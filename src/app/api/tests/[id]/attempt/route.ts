import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const questionSelect = {
  id: true,
  questionText: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  correctOption: true, // used to derive isMultiSelect — not forwarded to client
};

// Get the current in-progress attempt with questions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: testId } = await params;
  const attempt = await prisma.testAttempt.findFirst({
    where: { testId, userId: session.userId, status: "in_progress" },
    orderBy: { startedAt: "desc" },
    include: {
      answers: {
        include: {
          question: { select: questionSelect },
        },
      },
    },
  });

  if (!attempt) return NextResponse.json(null);

  // Strip correctOption from each question; expose only isMultiSelect
  const safe = {
    ...attempt,
    answers: attempt.answers.map((a) => ({
      ...a,
      question: {
        id: a.question.id,
        questionText: a.question.questionText,
        optionA: a.question.optionA,
        optionB: a.question.optionB,
        optionC: a.question.optionC,
        optionD: a.question.optionD,
        isMultiSelect: a.question.correctOption.includes(","),
      },
    })),
  };

  return NextResponse.json(safe);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: testId } = await params;
  const body = await req.json();

  if (body.action === "start") {
    // Resume existing in-progress attempt if one exists
    const existing = await prisma.testAttempt.findFirst({
      where: { testId, userId: session.userId, status: "in_progress" },
      orderBy: { startedAt: "desc" },
    });
    if (existing) return NextResponse.json(existing);

    // No in-progress attempt — check retake permission before creating a new one
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { testQuestions: true },
    });
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    if (!test.allowRetake) {
      const prior = await prisma.testAttempt.findFirst({
        where: { testId, userId: session.userId, status: "submitted" },
      });
      if (prior) return NextResponse.json({ error: "Retake not allowed" }, { status: 403 });
    }

    let selectedQuestionIds: string[];

    if (test.randomMode) {
      const pool = await prisma.question.findMany({
        where: { approved: true },
        select: { id: true, difficulty: true },
      });

      const shuffle = <T>(arr: T[]) => arr.sort(() => Math.random() - 0.5);
      const easy = shuffle(pool.filter((q) => q.difficulty === "easy"));
      const medium = shuffle(pool.filter((q) => q.difficulty === "medium"));
      const hard = shuffle(pool.filter((q) => q.difficulty === "hard"));

      const target = test.randomCount;
      const perDiff = Math.floor(target / 3);

      const picked = [
        ...easy.slice(0, perDiff),
        ...medium.slice(0, perDiff),
        ...hard.slice(0, perDiff),
      ];
      const remaining = target - picked.length;
      if (remaining > 0) {
        const leftovers = shuffle([
          ...easy.slice(perDiff),
          ...medium.slice(perDiff),
          ...hard.slice(perDiff),
        ]);
        picked.push(...leftovers.slice(0, remaining));
      }

      selectedQuestionIds = shuffle(picked).map((q) => q.id);
    } else {
      selectedQuestionIds = test.testQuestions.map((tq) => tq.questionId);
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        userId: session.userId,
        totalQuestions: selectedQuestionIds.length,
        answers: {
          create: selectedQuestionIds.map((questionId) => ({
            questionId,
            selectedOption: null,
          })),
        },
      },
    });
    return NextResponse.json(attempt, { status: 201 });
  }

  if (body.action === "answer") {
    const { questionId, selectedOption } = body;
    const attempt = await prisma.testAttempt.findFirst({
      where: { testId, userId: session.userId, status: "in_progress" },
      orderBy: { startedAt: "desc" },
    });
    if (!attempt) return NextResponse.json({ error: "No in-progress attempt" }, { status: 400 });

    await prisma.testAttemptAnswer.updateMany({
      where: { attemptId: attempt.id, questionId },
      data: { selectedOption },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "submit") {
    const attempt = await prisma.testAttempt.findFirst({
      where: { testId, userId: session.userId, status: "in_progress" },
      orderBy: { startedAt: "desc" },
      include: {
        answers: { include: { question: { select: { correctOption: true } } } },
      },
    });

    if (!attempt) return NextResponse.json({ error: "No attempt found" }, { status: 404 });

    const normalize = (s: string) => s.split(",").sort().join(",");
    const score = attempt.answers.filter(
      (a) => a.selectedOption !== null && normalize(a.selectedOption) === normalize(a.question.correctOption)
    ).length;

    const updated = await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { status: "submitted", submittedAt: new Date(), score },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
