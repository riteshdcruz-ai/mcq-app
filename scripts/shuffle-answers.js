// Shuffle answer options for all questions so correct answers aren't always "A"
// Run: $env:DATABASE_URL="file:...path.../prisma/dev.db"; node scripts/shuffle-answers.js
const path = require("path");
try { require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") }); } catch (_) {}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set.");
    process.exit(1);
  }

  const questions = await prisma.question.findMany();
  console.log(`Found ${questions.length} questions. Shuffling...`);

  let updated = 0;
  for (const q of questions) {
    const keys = ["A", "B", "C", "D"];

    // Build map: key → option text
    const optionMap = {
      A: q.optionA,
      B: q.optionB,
      C: q.optionC,
      D: q.optionD,
    };

    // Which keys are currently correct (supports "A", "B,C", etc.)
    const correctKeys = q.correctOption.split(",").map((k) => k.trim());

    // Shuffle the keys
    const shuffledKeys = shuffle([...keys]);

    // Build new options in the shuffled order
    const newOptions = {};
    shuffledKeys.forEach((originalKey, newIdx) => {
      newOptions[`option${keys[newIdx]}`] = optionMap[originalKey];
    });

    // Map old correct keys to their new positions
    const newCorrectKeys = correctKeys.map((ck) => {
      const newIdx = shuffledKeys.indexOf(ck);
      return keys[newIdx];
    });
    newCorrectKeys.sort();
    const newCorrectOption = newCorrectKeys.join(",");

    await prisma.question.update({
      where: { id: q.id },
      data: {
        optionA: newOptions.optionA,
        optionB: newOptions.optionB,
        optionC: newOptions.optionC,
        optionD: newOptions.optionD,
        correctOption: newCorrectOption,
      },
    });
    updated++;
  }

  console.log(`Done — ${updated} questions shuffled.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
