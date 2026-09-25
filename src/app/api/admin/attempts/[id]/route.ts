import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const attempt = await prisma.testAttempt.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      test: { select: { title: true, passPercentage: true } },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              correctOption: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(attempt);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: attemptId } = await params;
  const { answerId, override } = await req.json();

  await prisma.testAttemptAnswer.update({
    where: { id: answerId },
    data: { manualOverride: override },
  });

  // Recalculate and save the score
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        include: { question: { select: { correctOption: true } } },
      },
    },
  });
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const normalize = (s: string) => s.split(",").sort().join(",");
  const score = attempt.answers.filter(
    (a) =>
      a.manualOverride ||
      (a.selectedOption !== null &&
        normalize(a.selectedOption) === normalize(a.question.correctOption))
  ).length;

  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { score },
  });

  return NextResponse.json({ ok: true, score });
}
