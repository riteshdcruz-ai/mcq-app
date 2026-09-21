import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tests = await prisma.test.findMany({
    include: {
      _count: { select: { testQuestions: true, attempts: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, timeLimit, questionIds, assignToAll, assignedUserIds, randomMode, randomCount, passPercentage } =
    await req.json();

  const test = await prisma.test.create({
    data: {
      title,
      description: description || "",
      timeLimit: timeLimit || 30,
      randomMode: randomMode ?? false,
      randomCount: randomCount ?? 60,
      passPercentage: passPercentage ?? 60,
      createdById: session.userId,
      testQuestions: randomMode
        ? undefined
        : {
            create: (questionIds as string[]).map((qId: string, index: number) => ({
              questionId: qId,
              order: index + 1,
            })),
          },
      assignments: assignToAll
        ? { create: [{ userId: null }] }
        : {
            create: (assignedUserIds as string[]).map((uid: string) => ({ userId: uid })),
          },
    },
    include: { _count: { select: { testQuestions: true } } },
  });

  return NextResponse.json(test, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, published, title, description, timeLimit, allowRetake, passPercentage } = await req.json();

  const test = await prisma.test.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(timeLimit !== undefined && { timeLimit }),
      ...(allowRetake !== undefined && { allowRetake }),
      ...(passPercentage !== undefined && { passPercentage }),
      ...(published !== undefined && {
        published,
        publishedAt: published ? new Date() : null,
      }),
    },
  });
  return NextResponse.json(test);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  await prisma.test.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
