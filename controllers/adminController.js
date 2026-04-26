import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ==========================
// LOGIN
// ==========================
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    token,
  });
};

// ==========================
// FETCH SUBMISSIONS
// ==========================
export const getAllSubmissions = async (req, res) => {
  const submissions = await Submission.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    count: submissions.length,
    data: submissions,
  });
};