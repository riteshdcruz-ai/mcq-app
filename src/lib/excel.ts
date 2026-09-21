import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

export async function exportResultsToExcel(
  results: {
    userName: string;
    userEmail: string;
    testTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    submittedAt: string;
  }[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MCQ Platform";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Results");

  sheet.columns = [
    { header: "Name", key: "userName", width: 25 },
    { header: "Email", key: "userEmail", width: 35 },
    { header: "Test", key: "testTitle", width: 35 },
    { header: "Score", key: "score", width: 10 },
    { header: "Total Questions", key: "totalQuestions", width: 18 },
    { header: "Percentage (%)", key: "percentage", width: 18 },
    { header: "Submitted At", key: "submittedAt", width: 22 },
  ];

  // Header styling
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  sheet.getRow(1).height = 22;

  results.forEach((r, i) => {
    const row = sheet.addRow(r);
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4F8" } };
      });
    }
    row.getCell("percentage").numFmt = "0.0";
  });

  const buffer = await workbook.xlsx.writeBuffer();

  // Also save to configured path if set
  const exportPath = process.env.EXCEL_EXPORT_PATH;
  if (exportPath && fs.existsSync(exportPath)) {
    const filePath = path.join(exportPath, `mcq-results-${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
  }

  return Buffer.from(buffer);
}
