const fs = require("fs");
const path = require("path");

async function run() {
  const pdfModule = require("pdf-parse");
  const pdfParse = pdfModule.PDFParse ? (...a) => new pdfModule.PDFParse().parse(...a) : (pdfModule.default ?? pdfModule);
  const buffer = fs.readFileSync(process.argv[2]);
  const data = await pdfParse(buffer);
  const outPath = process.argv[3] || path.join(__dirname, "extracted.txt");
  fs.writeFileSync(outPath, data.text, "utf8");
  console.log("Pages:", data.numpages);
  console.log("Text length:", data.text.length, "chars");
  console.log("Saved to:", outPath);
}

run().catch((e) => { console.error(e); process.exit(1); });
