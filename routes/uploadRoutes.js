import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { processImage } from "../controllers/uploadController.js";

const router = express.Router();

// ==========================
// ABSOLUTE SAFE PATH (CRITICAL FIX)
// ==========================
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Upload directory created:", uploadDir);
}

// ==========================
// MULTER STORAGE
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("📂 Saving file to:", uploadDir);
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    console.log("📄 Incoming file:", file.originalname);
    console.log("🆔 Generated filename:", uniqueName);

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ==========================
// ROUTE DEBUG LAYER
// ==========================
router.post(
  "/image",
  (req, res, next) => {
    console.log("📥 ROUTE HIT: /api/upload/image");
    next();
  },
  upload.single("image"),
  (req, res, next) => {
    console.log("📦 MULTER DONE, FILE READY");
    next();
  },
  processImage
);

export default router;