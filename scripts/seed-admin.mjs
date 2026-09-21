import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hash = await bcrypt.hash("Admin@123", 12);
const admin = await prisma.user.upsert({
  where: { email: "admin@company.com" },
  update: {},
  create: { email: "admin@company.com", name: "Admin", passwordHash: hash, role: "admin" },
});

console.log("✅ Admin created:", admin.email);
console.log("   Password: Admin@123");
await prisma.$disconnect();
