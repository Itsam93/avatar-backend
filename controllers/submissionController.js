import Submission from "../models/Submission.js";
import { processImage } from "../utils/imageProcessor.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";

// ==========================
// CREATE SUBMISSION
// ==========================
export const createSubmission = async (req, res) => {
  try {
    const { fullName, church, cell, quantity } = req.body;

    // ==========================
    // VALIDATION (SERVER-SIDE SAFETY)
    // ==========================
    if (!fullName || !church || !cell) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!quantity || isNaN(quantity) || Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });
    }

    let imageUrl = null;
    let originalFileName = null;

    // ==========================
    // IMAGE PROCESSING (ROBUST PIPELINE)
    // ==========================
    if (req.file) {
      try {
        originalFileName = req.file.originalname;
        imageUrl = await processImage(req.file); 
      } catch (err) {
        console.error("Image processing error:", err);

        return res.status(400).json({
          success: false,
          message: "Unsupported or corrupted image format",
        });
      }
    }

    // ==========================
    // CREATE DOCUMENT
    // ==========================
    const submission = await Submission.create({
      fullName,
      church,
      cell,
      quantity: Number(quantity),

      imageUrl,
      originalFileName,

      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "Submission created successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Create Submission Error:", error);

    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};

// ==========================
// EXPORT TO EXCEL
// ==========================
export const exportToExcel = async (req, res) => {
  try {
    const { from, to } = req.query;

    const query = {};

    // ==========================
    // DATE FILTER
    // ==========================
    if (from || to) {
      query.createdAt = {};

      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const data = await Submission.find(query).sort({ createdAt: -1 }).lean();

    const formatted = data.map((item, i) => ({
      "S/N": i + 1,
      "Full Name": item.fullName,
      Church: item.church,
      Cell: item.cell,
      Quantity: item.quantity,
      Image: item.imageUrl
        ? `${req.protocol}://${req.get("host")}/uploads/${item.imageUrl}`
        : "",
      "Submitted At": new Date(item.createdAt).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");

    // ==========================
    // SAFE FILE OUTPUT (NO OVERWRITE COLLISION)
    // ==========================
    const fileName = `submissions-${Date.now()}.xlsx`;
    const filePath = path.join(process.cwd(), fileName);

    XLSX.writeFile(wb, filePath);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Excel download error:", err);
      }

      // cleanup after download
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    console.error("Export Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to export submissions",
    });
  }
};

// ==========================
// GET SUBMISSIONS (ADMIN)
// ==========================
export const getSubmissions = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      from,
      to,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const query = {};

    // ==========================
    // SEARCH (FULL NAME / CHURCH / CELL)
    // ==========================
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { church: { $regex: search, $options: "i" } },
        { cell: { $regex: search, $options: "i" } },
      ];
    }

    // ==========================
    // DATE FILTER
    // ==========================
    if (from || to) {
      query.createdAt = {};

      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const total = await Submission.countDocuments(query);

    const data = await Submission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      count: total,
      page,
      pages: Math.ceil(total / limit),
      data,
    });
  } catch (err) {
    console.error("Get Submissions Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch submissions",
    });
  }
};


export const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Submission.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};