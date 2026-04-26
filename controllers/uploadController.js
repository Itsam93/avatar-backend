import fs from "fs";
import path from "path";
import sharp from "sharp";
import heicConvert from "heic-convert";

export const processImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(req.file.originalname).toLowerCase();

    let outputBuffer = fileBuffer;

    // ==========================
    // HEIC / HEIF CONVERSION
    // ==========================
    const isHeic = ext === ".heic" || ext === ".heif";

    if (isHeic) {
      const converted = await heicConvert({
        buffer: fileBuffer,
        format: "JPEG",
        quality: 0.9,
      });

      outputBuffer = Buffer.from(converted);
    }

    // ==========================
    // FORCE STANDARDIZATION 
    // ==========================
    const finalImage = await sharp(outputBuffer)
      .rotate() 
      .jpeg({ quality: 90 })
      .toBuffer();

    // ==========================
    // OVERWRITE FILE AS JPEG
    // ==========================
    const newFilename =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ".jpg";

    const finalPath = path.join("uploads", newFilename);

    fs.writeFileSync(finalPath, finalImage);

    // delete original raw upload
    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      url: `${process.env.BASE_URL}/uploads/${newFilename}`,
      filename: newFilename,
    });
  } catch (err) {
    console.error("PROCESS IMAGE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Image processing failed",
    });
  }
};