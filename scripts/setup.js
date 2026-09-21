// Quick setup script — creates the DB and first admin account
const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Running Prisma migrations...");
  execSync("npx prisma migrate dev --name init", { stdio: "inherit" });

  const prisma = new PrismaClient();
  const hash = await bcrypt.hash("Admin@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: { email: "admin@company.com", name: "Admin", passwordHash: hash, role: "admin" },
  });

  console.log("\n✅ Setup complete!");
  console.log("Admin email:   ", admin.email);
  console.log("Admin password:", "Admin@123");
  console.log("⚠️  Change this password from the Users page after logging in!");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
