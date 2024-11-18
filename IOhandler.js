const fs = require("node:fs");
const PNG = require("pngjs").PNG;
const path = require("path");
const yauzl = require("yauzl-promise");
const { pipeline } = require("stream/promises");

async function createDirectory(outputDir) {
  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.log("Error creating directory:", error);
    throw error;
  }
}
async function unzip(zipFilePath, outputDir) {
  try {
    const zipfile = await yauzl.open(zipFilePath, {
      validateFilenames: false,
      supportMacArchive: false,
    });

    for await (const entry of zipfile) {
      const entryPath = path.join(outputDir, entry.filename);

      if (entry.filename.endsWith("/")) {
        await fs.promises.mkdir(entryPath, { recursive: true });
        continue;
      }

      await fs.promises.mkdir(path.dirname(entryPath), { recursive: true });

      try {
        const readStream = await entry.openReadStream({ decompress: true });

        const writeStream = fs.createWriteStream(entryPath);
        await pipeline(readStream, writeStream);
      } catch (err) {
        console.log(`Error extracting ${entry.filename}:`, err);
        continue;
      }
    }

    console.log("Extraction operation complete");
    await zipfile.close();
  } catch (error) {
    console.log("An error occurred during extraction:", error);
    throw error;
  }
}

async function readDir(directoryPath) {
  try {
    const files = await fs.promises.readdir(directoryPath, {
      withFileTypes: true,
    });
    const pngFiles = [];

    for (const file of files) {
      if (file.isFile() && path.extname(file.name).toLowerCase() === ".png") {
        const filePath = path.join(directoryPath, file.name);

        const fileHandle = await fs.promises.open(filePath, "r");
        const buffer = Buffer.alloc(8);
        await fileHandle.read(buffer, 0, 8, 0);
        await fileHandle.close();

        if (
          buffer.equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
          )
        ) {
          pngFiles.push(filePath);
        }
      }
    }

    console.log(`Filtered PNG files: ${pngFiles.length}`);
    return pngFiles;
  } catch (error) {
    console.log(`Error reading directory ${directoryPath}:`, error);
    throw error;
  }
}

async function grayScale(pathIn, pathOut) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(pathIn)
      .pipe(new PNG())
      .on("parsed", function () {
        for (let i = 0; i < this.data.length; i += 4) {
          const gray = Math.round(
            (this.data[i] + this.data[i + 1] + this.data[i + 2]) / 3
          );
          this.data[i] = this.data[i + 1] = this.data[i + 2] = gray;
        }

        this.pack()
          .pipe(fs.createWriteStream(pathOut))
          .on("finish", () => {
            console.log(`Saved grayscale image to: ${pathOut}`);
            resolve();
          })
          .on("error", (err) => {
            console.log(`Error saving image: ${pathOut}`, err);
            reject(err);
          });
      })
      .on("error", (err) => {
        console.log(`Error processing image ${pathIn}:`, err);
        reject(err);
      });
  });
}

module.exports = {
  createDirectory,
  unzip,
  readDir,
  grayScale,
};
