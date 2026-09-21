import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const books = await prisma.book.findMany({ select: { id: true, title: true } });
console.log("Books:", JSON.stringify(books, null, 2));
const admin = await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true, email: true } });
console.log("Admin:", admin);
await prisma.$disconnect();
