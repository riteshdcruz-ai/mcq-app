/**
 * Bulk-imports questions from a JSON file into the database.
 *
 * Usage:
 *   $env:DATABASE_URL = "file:C:\...\prisma\dev.db"
 *   node scripts/import-questions.mjs questions.json <bookId>
 *
 * JSON format (array of objects):
 * [
 *   {
 *     "questionText": "What is ...?",
 *     "optionA": "...",
 *     "optionB": "...",
 *     "optionC": "...",
 *     "optionD": "...",
 *     "correctOption": "A",
 *     "explanation": "...",
 *     "difficulty": "easy"   // "easy" | "medium" | "hard"
 *   }
 * ]
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

async function main() {
  const [, , jsonFile, bookId] = process.argv;

  if (!jsonFile || !bookId) {
    console.error("Usage: node scripts/import-questions.mjs <questions.json> <bookId>");
    process.exit(1);
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) {
    console.error(`Book not found: ${bookId}`);
    console.log("\nAvailable books:");
    const books = await prisma.book.findMany({ select: { id: true, title: true } });
    books.forEach((b) => console.log(`  ${b.id}  ${b.title}`));
    process.exit(1);
  }

  const raw = readFileSync(resolve(jsonFile), "utf-8");
  const questions = JSON.parse(raw);

  console.log(`Importing ${questions.length} questions into "${book.title}"…`);

  let imported = 0;
  for (const q of questions) {
    await prisma.question.create({
      data: {
        bookId,
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

  console.log(`\nDone — ${imported} questions imported and approved.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
