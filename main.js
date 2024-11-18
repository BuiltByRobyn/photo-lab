const { createDirectory, unzip, readDir, grayScale } = require("./IOhandler");
const path = require("path");

async function processImages() {
  const zipFilePath = path.resolve(__dirname, "myfile.zip");
  const outputDir = path.resolve(__dirname, "unzipped");
  const grayOutputDir = path.resolve(__dirname, "grayscaled");

  try {
    await createDirectory(grayOutputDir);

    await unzip(zipFilePath, outputDir);
    const pngFiles = await readDir(outputDir);

    for (const filePath of pngFiles) {
      const fileName = path.basename(filePath);
      const grayFilePath = path.join(grayOutputDir, `grayscaled_${fileName}`);
      await grayScale(filePath, grayFilePath);
    }

    console.log("All images have been processed.");
  } catch (error) {
    console.log("Error during image processing:", error);
  }
}
processImages();
