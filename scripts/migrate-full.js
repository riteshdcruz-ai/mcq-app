// Full migration: seeds missing questions, recreates test, migrates submitted scores
// Usage: $env:DATABASE_URL="postgresql://..." ; node scripts/migrate-full.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const allBooks = JSON.parse(fs.readFileSync(path.join(__dirname, "../sqlite-full-export.json"), "utf8"));
  const exportData = JSON.parse(fs.readFileSync(path.join(__dirname, "../sqlite-export.json"), "utf8"));
  const { users, attempts, answers } = exportData;

  // ── 1. Seed all books & questions (upsert by questionText to avoid duplicates) ──
  console.log("=== Step 1: Seeding books & questions ===");
  const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!adminUser) throw new Error("No admin user found in Railway. Run admin creation first.");

  const oldQIdToNew = new Map(); // SQLite question ID -> Railway question ID

  for (const book of allBooks) {
    let railwayBook = await prisma.book.findFirst({ where: { title: book.title } });
    if (!railwayBook) {
      railwayBook = await prisma.book.create({
        data: { title: book.title, filename: book.filename || "imported.pdf", filePath: book.filePath || "/imported", uploadedById: adminUser.id },
      });
      console.log(`  Created book: ${book.title}`);
    } else {
      console.log(`  Book exists: ${book.title}`);
    }

    // Upsert questions
    let created = 0, skipped = 0;
    for (const q of book.questions) {
      const existing = await prisma.question.findFirst({ where: { questionText: q.questionText.trim() } });
      if (existing) {
        oldQIdToNew.set(q.id, existing.id);
        skipped++;
      } else {
        const created_q = await prisma.question.create({
          data: {
            bookId: railwayBook.id,
            questionText: q.questionText.trim(),
            optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation || "",
            difficulty: q.difficulty || "medium",
            approved: true,
          },
        });
        oldQIdToNew.set(q.id, created_q.id);
        created++;
      }
    }
    console.log(`    Questions: ${created} created, ${skipped} already exist`);
  }

  // ── 2. Reconstruct "Recertification GHP" test ──
  console.log("\n=== Step 2: Recreating Recertification GHP test ===");
  const uniqueOldQIds = [...new Set(answers.map((a) => a.questionId))];
  const mappedQIds = uniqueOldQIds.map((id) => oldQIdToNew.get(id)).filter(Boolean);

  let test = await prisma.test.findFirst({ where: { title: "Recertification GHP" } });
  if (!test) {
    test = await prisma.test.create({
      data: {
        title: "Recertification GHP",
        description: "Recertification test for GHP",
        timeLimit: 60,
        randomMode: true,
        randomCount: 60,
        published: true,
        allowRetake: false,
        passPercentage: 60,
        createdById: adminUser.id,
      },
    });
    console.log(`  Created test: Recertification GHP`);
  } else {
    console.log(`  Test already exists`);
  }

  // Add questions to test
  let tqCreated = 0;
  for (let i = 0; i < mappedQIds.length; i++) {
    await prisma.testQuestion.upsert({
      where: { testId_questionId: { testId: test.id, questionId: mappedQIds[i] } },
      update: {},
      create: { testId: test.id, questionId: mappedQIds[i], order: i + 1 },
    });
    tqCreated++;
  }
  console.log(`  Linked ${tqCreated} questions to test`);

  // ── 3. Migrate submitted attempts (skip in_progress) ──
  console.log("\n=== Step 3: Migrating submitted scores ===");
  const oldUserIdToNew = new Map();
  const allRailwayUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const railwayUserMap = new Map(allRailwayUsers.map((u) => [u.email, u.id]));

  for (const u of users) {
    const railwayId = railwayUserMap.get(u.email);
    if (railwayId) oldUserIdToNew.set(u.id, railwayId);
  }

  const submittedAttempts = attempts.filter((a) => a.status === "submitted");
  console.log(`  Found ${submittedAttempts.length} submitted attempts to migrate`);

  let attemptCreated = 0;
  for (const a of submittedAttempts) {
    const newUserId = oldUserIdToNew.get(a.userId);
    if (!newUserId) { console.log(`  SKIP: user not found`); continue; }

    // Check if attempt already exists
    const existing = await prisma.testAttempt.findFirst({
      where: { testId: test.id, userId: newUserId, status: "submitted" },
    });
    if (existing) { console.log(`  SKIP: attempt already exists`); continue; }

    const attempt = await prisma.testAttempt.create({
      data: {
        testId: test.id,
        userId: newUserId,
        startedAt: new Date(a.startedAt),
        submittedAt: a.submittedAt ? new Date(a.submittedAt) : new Date(),
        score: a.score,
        totalQuestions: a.totalQuestions,
        status: "submitted",
      },
    });

    // Migrate answers for this attempt
    const attemptAnswers = answers.filter((ans) => ans.attemptId === a.id);
    let ansCreated = 0;
    for (const ans of attemptAnswers) {
      const newQId = oldQIdToNew.get(ans.questionId);
      if (!newQId) continue;
      await prisma.testAttemptAnswer.create({
        data: { attemptId: attempt.id, questionId: newQId, selectedOption: ans.selectedOption },
      });
      ansCreated++;
    }

    const user = users.find((u) => u.id === a.userId);
    console.log(`  Migrated: ${user?.name || user?.email} — ${a.score}/${a.totalQuestions} (${ansCreated} answers)`);
    attemptCreated++;
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Questions mapped: ${oldQIdToNew.size}`);
  console.log(`   Attempts migrated: ${attemptCreated}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
