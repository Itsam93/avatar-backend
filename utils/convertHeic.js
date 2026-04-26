import heicConvert from "heic-convert";
import fs from "fs";

export const convertHeicToJpg = async (inputPath, outputPath) => {
  const inputBuffer = fs.readFileSync(inputPath);

  const outputBuffer = await heicConvert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 1,
  });

  fs.writeFileSync(outputPath, outputBuffer);

  return outputPath;
};