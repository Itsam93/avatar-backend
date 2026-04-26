import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// ROUTES
import submissionRoutes from "./routes/submissionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

// ==========================
// ENVIRONMENT VARIABLES
// ==========================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Frontend domains 
const CLIENT_URLS = [
  "http://localhost:5173",
  "https://avatar-generator-peach.vercel.app",
  "https://nwz1-bibles-avatar.online",
];

// ==========================
// SAFETY CHECKS
// ==========================
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in environment variables");
  process.exit(1);
}


const uploadDir = path.join(process.cwd(), "uploads");
const processedDir = path.join(process.cwd(), "processed");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir);

// ==========================
// CORS CONFIG 
// ==========================
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      if (CLIENT_URLS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ==========================
// BODY PARSERS
// ==========================
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ==========================
// REQUEST LOGGER (DEBUG)
// ==========================
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ==========================
// STATIC FILES
// ==========================

// Uploaded raw files
app.use("/uploads", express.static(uploadDir));

// Processed avatar output
app.use("/processed", express.static(processedDir));

// ==========================
// ROUTES
// ==========================
app.use("/api/admin", adminRoutes);
app.use("/api/submissions", submissionRoutes);

// ==========================
// HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Avatar Backend Running 🚀",
  });
});

// ==========================
// DATABASE CONNECTION
// ==========================
const connectDB = async () => {
  try {
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
  console.error("SERVER ERROR:", err);

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large (max 15MB)",
    });
  }

  // CORS error
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
    console.log(`Server running on port ${PORT}`);
    console.log(`Allowed frontend: ${CLIENT_URLS.join(", ")}`);
  });
};

startServer();