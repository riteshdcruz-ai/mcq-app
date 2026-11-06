import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const bookIdsParam = searchParams.get("bookIds");
  const bookIds = bookIdsParam ? bookIdsParam.split(",").filter(Boolean) : [];

  const questions = await prisma.question.findMany({
    where: { approved: true, ...(bookIds.length ? { bookId: { in: bookIds } } : {}) },
    include: { book: { select: { title: true } } },
    orderBy: [{ book: { title: "asc" } }, { createdAt: "asc" }],
  });

  const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;

  const header = ["#", "Book", "Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Explanation", "Difficulty"];
  const rows = questions.map((q, i) => [
    i + 1,
    escape(q.book.title),
    escape(q.questionText),
    escape(q.optionA),
    escape(q.optionB),
    escape(q.optionC),
    escape(q.optionD),
    q.correctOption,
    escape(q.explanation),
    q.difficulty,
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="questions-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
