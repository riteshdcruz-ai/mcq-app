import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PrintButton from "./PrintButton";

export default async function PrintQuestionsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const questions = await prisma.question.findMany({
    where: { approved: true },
    include: { book: { select: { title: true } } },
    orderBy: [{ book: { title: "asc" } }, { createdAt: "asc" }],
  });

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Question Bank</h1>
          <p className="text-sm text-gray-500">{questions.length} approved questions</p>
        </div>
        <PrintButton />
      </div>

      <div className="space-y-6 text-sm">
        {questions.map((q, i) => (
          <div key={q.id} className="border-b border-gray-200 pb-4 break-inside-avoid">
            <p className="font-semibold text-gray-800 mb-1">
              {i + 1}. {q.questionText}
              <span className="ml-2 text-xs font-normal text-gray-400">[{q.book.title}]</span>
            </p>
            <div className="ml-4 space-y-0.5 text-gray-700">
              {(["A", "B", "C", "D"] as const).map((k) => (
                <p key={k} className={k === q.correctOption ? "text-green-700 font-semibold" : ""}>
                  {k}. {q[`option${k}` as keyof typeof q] as string}
                  {k === q.correctOption && " ✓"}
                </p>
              ))}
            </div>
            {q.explanation && (
              <p className="ml-4 mt-1 text-xs text-gray-500 italic">{q.explanation}</p>
            )}
          </div>
        ))}
      </div>

    </main>
  );
}
