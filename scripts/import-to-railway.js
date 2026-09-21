// Imports SQLite export into Railway PostgreSQL
// Usage: $env:DATABASE_URL="postgresql://..." ; node scripts/import-to-railway.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../sqlite-export.json"), "utf8"));
  const { users, attempts, answers, tests, questions } = data;

  // Build lookup maps
  const testTitleToId = new Map(); // oldTitle -> new Railway test ID
  const questionTextToId = new Map(); // questionText -> new Railway question ID

  // Map tests by title
  const railwayTests = await prisma.test.findMany({ select: { id: true, title: true } });
  for (const t of railwayTests) testTitleToId.set(t.title, t.id);

  // Map questions by text
  const railwayQuestions = await prisma.question.findMany({ select: { id: true, questionText: true } });
  for (const q of railwayQuestions) questionTextToId.set(q.questionText.trim(), q.id);

  // Old ID -> new Railway ID maps
  const oldTestIdToNew = new Map();
  for (const t of tests) {
    const newId = testTitleToId.get(t.title);
    if (newId) oldTestIdToNew.set(t.id, newId);
    else console.warn(`  ⚠ Test not found in Railway: "${t.title}"`);
  }

  const oldQIdToNew = new Map();
  for (const q of questions) {
    const newId = questionTextToId.get(q.questionText.trim());
    if (newId) oldQIdToNew.set(q.id, newId);
    else console.warn(`  ⚠ Question not found: "${q.questionText.substring(0, 60)}..."`);
  }

  // Import users
  console.log(`\nImporting ${users.length} users...`);
  const oldUserIdToNew = new Map();
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      oldUserIdToNew.set(u.id, existing.id);
      console.log(`  SKIP (exists): ${u.email}`);
    } else {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role || "resource",
        },
      });
      oldUserIdToNew.set(u.id, created.id);
      console.log(`  Created: ${u.email}`);
    }
  }

  // Import test attempts
  console.log(`\nImporting ${attempts.length} test attempts...`);
  const oldAttemptIdToNew = new Map();
  let attemptSkipped = 0;
  for (const a of attempts) {
    const newTestId = oldTestIdToNew.get(a.testId);
    const newUserId = oldUserIdToNew.get(a.userId);
    if (!newTestId || !newUserId) { attemptSkipped++; continue; }

    const created = await prisma.testAttempt.create({
      data: {
        testId: newTestId,
        userId: newUserId,
        startedAt: new Date(a.startedAt),
        submittedAt: a.submittedAt ? new Date(a.submittedAt) : null,
        score: a.score,
        totalQuestions: a.totalQuestions,
        status: a.status,
      },
    });
    oldAttemptIdToNew.set(a.id, created.id);
  }
  console.log(`  Created: ${oldAttemptIdToNew.size}, Skipped: ${attemptSkipped}`);

  // Import answers
  console.log(`\nImporting ${answers.length} answers...`);
  let answerCreated = 0, answerSkipped = 0;
  for (const ans of answers) {
    const newAttemptId = oldAttemptIdToNew.get(ans.attemptId);
    const newQId = oldQIdToNew.get(ans.questionId);
    if (!newAttemptId || !newQId) { answerSkipped++; continue; }

    await prisma.testAttemptAnswer.create({
      data: {
        attemptId: newAttemptId,
        questionId: newQId,
        selectedOption: ans.selectedOption,
      },
    });
    answerCreated++;
  }
  console.log(`  Created: ${answerCreated}, Skipped: ${answerSkipped}`);

  console.log(`\n✅ Import complete!`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
