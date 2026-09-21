import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

const QUESTIONS_FILE = process.argv[2] || resolve(process.cwd(), "scripts/questions.json");
const BOOK_TITLE = process.argv[3] || "Workday: Data Loading for Implementers";

async function main() {
  // Get admin user to be the book uploader
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin) {
    console.error("No admin user found. Run scripts/seed-admin.mjs first.");
    process.exit(1);
  }

  // Create or find the book
  let book = await prisma.book.findFirst({ where: { title: BOOK_TITLE } });
  if (!book) {
    book = await prisma.book.create({
      data: {
        title: BOOK_TITLE,
        filename: "Workday_Data_Loading_for_Implementers.pdf",
        filePath: "",
        extractedText: "",
        uploadedById: admin.id,
      },
    });
    console.log(`Created book: ${book.title} (${book.id})`);
  } else {
    console.log(`Using existing book: ${book.title} (${book.id})`);
  }

  const questions = JSON.parse(readFileSync(resolve(QUESTIONS_FILE), "utf-8"));
  console.log(`Importing ${questions.length} questions...`);

  let imported = 0;
  for (const q of questions) {
    await prisma.question.create({
      data: {
        bookId: book.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
        aiGenerated: false,
        approved: true,
      },
    });
    imported++;
    if (imported % 20 === 0) process.stdout.write(`  ${imported}/${questions.length}\r`);
  }

  console.log(`\nDone — ${imported} questions imported and auto-approved.`);
  console.log(`Book ID: ${book.id}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
