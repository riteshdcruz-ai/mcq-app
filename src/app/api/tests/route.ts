import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find tests assigned to this user or to all users
  const tests = await prisma.test.findMany({
    where: {
      published: true,
      assignments: {
        some: {
          OR: [{ userId: session.userId }, { userId: null }],
        },
      },
    },
    include: {
      _count: { select: { testQuestions: true } },
      attempts: {
        where: { userId: session.userId },
        select: { status: true, score: true, totalQuestions: true, submittedAt: true },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json(tests);
}
