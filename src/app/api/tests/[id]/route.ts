import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      testQuestions: {
        orderBy: { order: "asc" },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              // correctOption omitted — revealed only after submission
            },
          },
        },
      },
    },
  });

  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!test.published && session.role !== "admin") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(test);
}
