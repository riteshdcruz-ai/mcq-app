// Exports users (non-admin) + their test attempts + answers from local SQLite
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const db = new Database(path.join(__dirname, "../prisma/dev.db"), { readonly: true });

const users = db.prepare(`SELECT * FROM User WHERE role != 'admin'`).all();
const attempts = db.prepare(`SELECT * FROM TestAttempt WHERE userId IN (${users.map(() => "?").join(",") || "''"})`)
  .all(...users.map((u) => u.id));
const answers = attempts.length
  ? db.prepare(`SELECT * FROM TestAttemptAnswer WHERE attemptId IN (${attempts.map(() => "?").join(",")})`)
      .all(...attempts.map((a) => a.id))
  : [];

// Also export test titles and question texts for ID mapping on Railway
const testIds = [...new Set(attempts.map((a) => a.testId))];
const tests = testIds.length
  ? db.prepare(`SELECT id, title FROM Test WHERE id IN (${testIds.map(() => "?").join(",")})`)
      .all(...testIds)
  : [];

const questionIds = [...new Set(answers.map((a) => a.questionId))];
const questions = questionIds.length
  ? db.prepare(`SELECT id, questionText FROM Question WHERE id IN (${questionIds.map(() => "?").join(",")})`)
      .all(...questionIds)
  : [];

const output = { users, attempts, answers, tests, questions };
const outPath = path.join(__dirname, "../sqlite-export.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`Exported:`);
console.log(`  ${users.length} users`);
console.log(`  ${attempts.length} test attempts`);
console.log(`  ${answers.length} answers`);
console.log(`  ${tests.length} tests referenced`);
console.log(`  ${questions.length} questions referenced`);
console.log(`\nSaved to: sqlite-export.json`);

db.close();
