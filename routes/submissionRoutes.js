import express from "express";
import multer from "multer";

import {
  createSubmission,
  exportToExcel,
  getSubmissions,
  deleteSubmission,
} from "../controllers/submissionController.js";

import protect from "../middleware/auth.js";

const router = express.Router();

// ==========================
// MULTER CONFIG (ROBUST)
// ==========================
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// ==========================
// MULTER WRAPPER 
// ==========================
const uploadSingle = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.message || "Upload error",
      });
    }

    if (err) {
      return res.status(500).json({
        success: false,
        message: "File upload failed",
      });
    }

    next();
  });
};

// ==========================
// PUBLIC ROUTE 
// ==========================
router.post("/", uploadSingle, createSubmission);

router.delete("/:id", protect, deleteSubmission);

// GET submissions 
router.get("/", protect, getSubmissions);

// EXPORT Excel
router.get("/export", protect, exportToExcel);

export default router;