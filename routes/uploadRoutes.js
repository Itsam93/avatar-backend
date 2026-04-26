import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { processImage } from "../controllers/uploadController.js";

const router = express.Router();

// ensure upload folder exists 
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// SINGLE ENTRY POINT
router.post("/image", upload.single("image"), processImage);

export default router;