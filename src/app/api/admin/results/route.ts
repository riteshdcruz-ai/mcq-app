import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { exportResultsToExcel } from "@/lib/excel";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const exportXlsx = searchParams.get("export") === "xlsx";

  const attempts = await prisma.testAttempt.findMany({
    where: { status: "submitted" },
    include: {
      user: { select: { name: true, email: true } },
      test: { select: { title: true, passPercentage: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  if (exportXlsx) {
    const rows = attempts.map((a) => ({
      userName: a.user.name,
      userEmail: a.user.email,
      testTitle: a.test.title,
      score: a.score,
      totalQuestions: a.totalQuestions,
      percentage: a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0,
      submittedAt: a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "",
    }));

    const buffer = await exportResultsToExcel(rows);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="mcq-results-${Date.now()}.xlsx"`,
      },
    });
  }

  return NextResponse.json(attempts);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  await prisma.testAttempt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
