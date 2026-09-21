import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import fs from "fs";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

async function extractText(filePath: string, mimetype: string): Promise<string> {
  if (mimetype === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfModule = (await import("pdf-parse")) as any;
    const pdfParse = pdfModule.default ?? pdfModule;
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filePath.endsWith(".docx")
  ) {
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  if (mimetype === "text/plain" || filePath.endsWith(".txt")) {
    return fs.readFileSync(filePath, "utf-8");
  }
  return "";
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const books = await prisma.book.findMany({
    include: { _count: { select: { questions: true } }, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;

  if (!file || !title) {
    return NextResponse.json({ error: "File and title required" }, { status: 400 });
  }

  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  let extractedText = "";
  try {
    extractedText = await extractText(filePath, file.type);
  } catch (e) {
    console.error("Text extraction failed:", e);
  }

  const book = await prisma.book.create({
    data: {
      title,
      filename: file.name,
      filePath,
      extractedText,
      uploadedById: session.userId,
    },
  });

  return NextResponse.json(book, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.book.delete({ where: { id } });
  try {
    await unlink(book.filePath);
  } catch {}

  return NextResponse.json({ ok: true });
}
