const fs = require("node:fs");
const path = require("node:path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await pdfParse(buffer);
  return result.text || "";
}

async function extractTextFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
}

async function extractTextFromFile(inputPath) {
  const filePath = path.resolve(inputPath);
  const extension = path.extname(filePath).toLowerCase();

  let text;
  if (extension === ".pdf") {
    text = await extractTextFromPdf(filePath);
  } else if (extension === ".docx") {
    text = await extractTextFromDocx(filePath);
  } else if (extension === ".txt" || extension === ".md" || extension === ".json") {
    text = fs.readFileSync(filePath, "utf8");
  } else {
    throw new Error(`Formato nao suportado: ${extension || "sem extensao"}`);
  }

  return {
    filePath,
    extension,
    text: text.replace(/\r\n/g, "\n").trim(),
  };
}

module.exports = {
  extractTextFromFile,
  extractTextFromPdf,
  extractTextFromDocx,
};
