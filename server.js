import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// ROUTES
import submissionRoutes from "./routes/submissionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

const app = express();

// ==========================
// ENVIRONMENT VARIABLES
// ==========================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ==========================
// FRONTEND ORIGINS
// ==========================
const allowedOrigins = [
  "http://localhost:5173",
  "https://avatar-generator-peach.vercel.app",
  "https://nwz1-bibles-avatar.online",
  "https://www.nwz1-bibles-avatar.online",
];

// ==========================
// SAFETY CHECKS
// ==========================
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in environment variables");
  process.exit(1);
}

// ==========================
// FILE DIRECTORIES
// ==========================
const uploadDir = path.join(process.cwd(), "uploads");
const processedDir = path.join(process.cwd(), "processed");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 Created uploads directory");
}

if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir);
  console.log("📁 Created processed directory");
}

// ==========================
// CORS CONFIG (DEBUG ENABLED)
// ==========================
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🌐 Incoming Origin:", origin);

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        console.log("✅ CORS ALLOWED:", origin);
        return callback(null, true);
      }

      console.log("❌ CORS BLOCKED:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],
    credentials: true,
  })
);

app.options(/.*/, cors());

// ==========================
// BODY PARSERS
// ==========================
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ==========================
// REQUEST LOGGER (ENHANCED)
// ==========================
app.use((req, res, next) => {
  console.log("\n==============================");
  console.log("📥 REQUEST INCOMING");
  console.log("➡️ Method:", req.method);
  console.log("➡️ URL:", req.url);
  console.log("➡️ Origin:", req.headers.origin);
  console.log("==============================\n");

  next();
});

// ==========================
// STATIC FILES
// ==========================
app.use("/uploads", express.static(uploadDir));
app.use("/processed", express.static(processedDir));

// ==========================
// ROUTE LOAD DEBUG (CRITICAL)
// ==========================

console.log("\n🔍 LOADING ROUTES...");

console.log("submissionRoutes:", typeof submissionRoutes);
console.log("adminRoutes:", typeof adminRoutes);
console.log("uploadRoutes:", typeof uploadRoutes);

// THIS IS THE MOST IMPORTANT DEBUG LINE
app.use("/api/upload", (req, res, next) => {
  console.log("🔥 HIT /api/upload BASE ROUTE");
  next();
}, uploadRoutes);

// ==========================
// OTHER ROUTES
// ==========================
app.use("/api/admin", adminRoutes);
app.use("/api/submissions", submissionRoutes);

// ==========================
// HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  console.log("❤️ HEALTH CHECK HIT");
  res.json({
    status: "OK",
    message: "Avatar Backend Running 🚀",
  });
});

// TEST ROUTE FOR DEBUGGING
app.get("/test-upload-route", (req, res) => {
  res.json({
    ok: true,
    message: "Upload route base is reachable",
  });
});

// ==========================
// DATABASE CONNECTION
// ==========================
const connectDB = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI, {
      dbName: "avatar_db",
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  console.error("\n❌ SERVER ERROR:");
  console.error("Message:", err.message);
  console.error(err.stack);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large (max 15MB)",
    });
  }

  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "CORS blocked this request",
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ==========================
// START SERVER
// ==========================
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log("\n🚀 SERVER STARTED");
    console.log("Port:", PORT);
    console.log("Allowed origins:", allowedOrigins.join(", "));
    console.log("Upload route expected at: /api/upload/image");
  });
};

startServer();