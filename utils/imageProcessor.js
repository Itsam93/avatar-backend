import sharp from "sharp";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

// ==========================
// HELPER: HEIC → JPG fallback
// ==========================
const convertHeicWithCLI = (input, output) => {
  return new Promise((resolve, reject) => {
    exec(`heif-convert "${input}" "${output}"`, (err) => {
      if (err) reject(err);
      else resolve(output);
    });
  });
};

// ==========================
// MAIN PROCESSOR
// ==========================
export const processImage = async (file) => {
  const inputPath = file.path;

  const outputPath = path.join(
    "processed",
    `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  );

  try {
    // ==========================
    // STEP 1: READ FILE BUFFER
    // ==========================
    const inputBuffer = fs.readFileSync(inputPath);

    // ==========================
    // STEP 2: SAFE SHARP PIPELINE
    // ==========================
    const image = sharp(inputBuffer, {
      failOnError: false, 
    });

    const metadata = await image.metadata();

    // ==========================
    // STEP 3: UNIVERSAL CONVERSION
    // ==========================
    await image
      .rotate() // fixes iPhone orientation
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 90,
        mozjpeg: true,
      })
      .toFile(outputPath);

    // ==========================
    // STEP 4: CLEANUP
    // ==========================
    fs.unlinkSync(inputPath);

    return outputPath;

  } catch (error) {
    console.error("❌ Image processing error:", error);

    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    throw new Error("Image processing failed");
  }
};