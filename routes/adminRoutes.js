import express from "express";
import {
  loginAdmin,
  getAllSubmissions,
} from "../controllers/adminController.js";

import protect from "../middleware/auth.js";

const router = express.Router();

// PUBLIC
router.post("/login", loginAdmin);

// PROTECTED
router.get("/submissions", protect, getAllSubmissions);

export default router;