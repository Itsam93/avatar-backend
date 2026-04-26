import fs from "fs";
import path from "path";
import sharp from "sharp";
import heicConvert from "heic-convert";

export const processImage = async (req, res) => {
  try {
    console.log("⚙️ PROCESS IMAGE STARTED");

    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("📥 FILE RECEIVED:", req.file.filename);

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(req.file.originalname).toLowerCase();

    let outputBuffer = fileBuffer;

    // ==========================
    // HEIC CONVERSION
    // ==========================
    if (ext === ".heic" || ext === ".heif") {
      console.log("🔄 Converting HEIC → JPEG");

      const converted = await heicConvert({
        buffer: fileBuffer,
        format: "JPEG",
        quality: 0.9,
      });

      outputBuffer = Buffer.from(converted);
    }

    // ==========================
    // NORMALIZE IMAGE
    // ==========================
    const finalImage = await sharp(outputBuffer)
      .rotate()
      .jpeg({ quality: 90 })
      .toBuffer();

    // ==========================
    // SAFE OUTPUT PATH
    // ==========================
    const uploadsDir = path.join(process.cwd(), "uploads");

    const newFilename =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ".jpg";

    const finalPath = path.join(uploadsDir, newFilename);

    fs.writeFileSync(finalPath, finalImage);

    console.log("✅ IMAGE SAVED:", finalPath);

    // cleanup
    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      url: `${process.env.BASE_URL}/uploads/${newFilename}`,
      filename: newFilename,
    });
  } catch (err) {
    console.error("❌ PROCESS IMAGE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Image processing failed",
      error: err.message,
    });
  }
};