// One-time patch: fix questions that should be multi-select in the database
// Run: $env:DATABASE_URL="file:...path.../prisma/dev.db"; node scripts/patch-multiselect.js
const path = require("path");
try { require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") }); } catch (_) {}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Each entry: find by questionText (partial match), set new correctOption
const patches = [
  {
    // Was "C" (Add/Update only), should be "B,C" (Put AND Add/Update)
    match: "Which web service operation types enable users to both add new data and update existing data in Workday",
    correctOption: "B,C",
    explanation: "Both 'Put' and 'Add/Update' web service operations allow adding new records and updating existing ones. 'Get' only retrieves; 'AddOnly' and 'Delete' do not update.",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set.");
    process.exit(1);
  }

  for (const patch of patches) {
    const questions = await prisma.question.findMany({
      where: { questionText: { contains: patch.match } },
    });

    if (questions.length === 0) {
      console.log(`NOT FOUND: "${patch.match.substring(0, 60)}..."`);
      continue;
    }

    for (const q of questions) {
      await prisma.question.update({
        where: { id: q.id },
        data: {
          correctOption: patch.correctOption,
          explanation: patch.explanation,
          questionText: q.questionText.includes("(Select all that apply)")
            ? q.questionText
            : q.questionText + " (Select all that apply)",
        },
      });
      console.log(`PATCHED: "${q.questionText.substring(0, 70)}..."`);
      console.log(`  correctOption: ${q.correctOption} → ${patch.correctOption}`);
    }
  }

  console.log("\nPatch complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
