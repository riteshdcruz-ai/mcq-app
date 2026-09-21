import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateQuestionsFromText } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");

  const questions = await prisma.question.findMany({
    where: bookId ? { bookId } : undefined,
    include: { book: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // AI generation mode
  if (body.action === "generate") {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your-anthropic-api-key-here") {
      return NextResponse.json(
        { error: "AI generation is not configured. Add ANTHROPIC_API_KEY to .env.local to enable it." },
        { status: 501 }
      );
    }

    const { bookId, count } = body;
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    if (!book.extractedText) {
      return NextResponse.json({ error: "No text extracted from this book" }, { status: 400 });
    }

    const generated = await generateQuestionsFromText(book.extractedText, count || 10);
    const created = await prisma.$transaction(
      generated.map((q) =>
        prisma.question.create({
          data: {
            bookId,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation,
            aiGenerated: true,
            approved: false,
          },
        })
      )
    );
    return NextResponse.json(created, { status: 201 });
  }

  // Manual create
  const { bookId, questionText, optionA, optionB, optionC, optionD, correctOption, explanation, difficulty } =
    body;
  const question = await prisma.question.create({
    data: {
      bookId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation: explanation || "",
      difficulty: difficulty || "medium",
      aiGenerated: false,
      approved: true,
    },
  });
  return NextResponse.json(question, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, questionText, optionA, optionB, optionC, optionD, correctOption, explanation, difficulty, approved } =
    await req.json();

  const question = await prisma.question.update({
    where: { id },
    data: { questionText, optionA, optionB, optionC, optionD, correctOption, explanation, difficulty, approved },
  });
  return NextResponse.json(question);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
