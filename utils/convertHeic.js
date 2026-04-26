import heicConvert from "heic-convert";
import fs from "fs";
import path from "path";

export const convertHeicToJpeg = async (inputPath) => {
  const inputBuffer = fs.readFileSync(inputPath);

  const outputBuffer = await heicConvert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 0.9,
  });

  const outputPath =
    "processed/" +
    Date.now() +
    "-" +
    Math.round(Math.random() * 1e6) +
    ".jpg";

  fs.writeFileSync(outputPath, outputBuffer);

  return outputPath;
};