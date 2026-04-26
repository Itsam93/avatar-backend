import fs from "fs";
import path from "path";
import sharp from "sharp";
import heicConvert from "heic-convert";

export const processImage = async (req, res) => {
  console.log("📥 PROCESS IMAGE HIT");

  try {
    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("📁 FILE INFO:", {
      original: req.file.originalname,
      mimetype: req.file.mimetype,
      path: req.file.path,
      size: req.file.size,
    });

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    let outputBuffer = fileBuffer;

    // ==========================
    // SAFE HEIC DETECTION (REAL FIX)
    // ==========================
    const isHeic =
      req.file.mimetype === "image/heic" ||
      req.file.mimetype === "image/heif" ||
      req.file.originalname?.toLowerCase().endsWith(".heic") ||
      req.file.originalname?.toLowerCase().endsWith(".heif");

    console.log("🧠 IS HEIC?", isHeic);

    // ==========================
    // HEIC CONVERSION (SAFE GUARD)
    // ==========================
    if (isHeic) {
      try {
        console.log("🔄 Converting HEIC → JPEG...");

        const converted = await heicConvert({
          buffer: fileBuffer,
          format: "JPEG",
          quality: 0.9,
        });

        outputBuffer = Buffer.from(converted);

        console.log("✅ HEIC conversion success");
      } catch (err) {
        console.error("❌ HEIC CONVERSION FAILED:", err.message);

        // fallback instead of crashing
        return res.status(400).json({
          success: false,
          message: "Invalid HEIC file or corrupted image",
          error: err.message,
        });
      }
    }

    // ==========================
    // FINAL NORMALIZATION WITH SHARP
    // ==========================
    console.log("🖼️ Processing with Sharp...");

    const finalImage = await sharp(outputBuffer)
      .rotate()
      .jpeg({ quality: 90 })
      .toBuffer();

    // ==========================
    // SAVE OUTPUT FILE
    // ==========================
    const newFilename =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ".jpg";

    const finalPath = path.join("uploads", newFilename);

    fs.writeFileSync(finalPath, finalImage);

    // cleanup original upload
    fs.unlinkSync(filePath);

    const url = `${process.env.BASE_URL || "https://avatar-backend-aikp.onrender.com"}/uploads/${newFilename}`;

    console.log("✅ IMAGE SUCCESS URL:", url);

    return res.status(200).json({
      success: true,
      url,
      filename: newFilename,
    });
  } catch (err) {
    console.error("🔥 PROCESS IMAGE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Image processing failed",
      error: err.message,
    });
  }
};