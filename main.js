const { unzip, readDir, grayScale } = require("./IOhandler");
const fs = require("node:fs");
const path = require("path");

(async () => {
  const zipFilePath = path.resolve(__dirname, "myfile.zip");
  const outputDir = path.resolve(__dirname, "unzipped");
  const grayOutputDir = path.resolve(__dirname, "grayscaled");

  try {
    await fs.promises.mkdir(grayOutputDir, { recursive: true });

    await unzip(zipFilePath, outputDir);
    const pngFiles = await readDir(outputDir);

    for (const filePath of pngFiles) {
      const fileName = path.basename(filePath);
      const grayFilePath = path.join(grayOutputDir, `grayscaled_${fileName}`);
      await grayScale(filePath, grayFilePath);
    }

    console.log("All images have been processed.");
  } catch (error) {
    console.error("Error during image processing:", error);
  }
})();
