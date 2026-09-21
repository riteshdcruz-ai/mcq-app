// Run with: npx ts-node scripts/seed.ts
// Creates the first admin account
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      name: "Admin",
      passwordHash: hash,
      role: "admin",
    },
  });
  console.log("Admin created:", admin.email);
  console.log("Password: Admin@123");
  console.log("IMPORTANT: Change this password after first login!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
