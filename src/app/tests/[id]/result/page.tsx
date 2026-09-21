import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Nav from "@/components/Nav";

const questionSelect = {
  questionText: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  correctOption: true,
  explanation: true,
};

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { id: testId } = await params;
  const { attemptId } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const include = {
    test: { select: { title: true, timeLimit: true, passPercentage: true } },
    answers: {
      include: { question: { select: questionSelect } },
    },
  };

  // Load a specific attempt by ID, or the most recent submitted attempt
  const attempt = attemptId
    ? await prisma.testAttempt.findFirst({
        where: { id: attemptId, testId, userId: session.userId, status: "submitted" },
        include,
      })
    : await prisma.testAttempt.findFirst({
        where: { testId, userId: session.userId, status: "submitted" },
        orderBy: { submittedAt: "desc" },
        include,
      });

  if (!attempt) redirect(`/tests/${testId}`);

  // Figure out which attempt number this is (1-indexed, chronological)
  const attemptNumber = await prisma.testAttempt.count({
    where: {
      testId,
      userId: session.userId,
      status: "submitted",
      submittedAt: { lte: attempt.submittedAt ?? new Date() },
    },
  });
  const attemptTotal = await prisma.testAttempt.count({
    where: { testId, userId: session.userId, status: "submitted" },
  });

  const pct = attempt.totalQuestions > 0
    ? Math.round((attempt.score / attempt.totalQuestions) * 100)
    : 0;
  const passMark = attempt.test.passPercentage ?? 60;
  const passed = pct >= passMark;

  return (
    <>
      <Nav name={session.name} role="resource" />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className={`rounded-2xl p-8 text-center mb-8 shadow-sm ${passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className={`text-5xl font-bold mb-2 ${passed ? "text-green-600" : "text-red-600"}`}>{pct}%</div>
          <div className={`text-lg font-semibold mb-1 ${passed ? "text-green-700" : "text-red-700"}`}>
            {passed ? "Passed" : "Failed"}
          </div>
          <p className="text-gray-600 text-sm">{attempt.score} out of {attempt.totalQuestions} correct</p>
          <p className="text-gray-400 text-xs mt-1">Pass mark: {passMark}%</p>
          <p className="text-gray-500 text-sm mt-1">{attempt.test.title}</p>
          {attemptTotal > 1 && (
            <p className="text-gray-400 text-xs mt-2">
              Attempt {attemptNumber} of {attemptTotal}
            </p>
          )}
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Review Answers</h2>
        <div className="space-y-4">
          {attempt.answers.map((a, i) => {
            const normalize = (s: string) => s.split(",").sort().join(",");
            const correctKeys = a.question.correctOption.split(",");
            const selectedKeys = a.selectedOption ? a.selectedOption.split(",") : [];
            const isMultiSelect = a.question.correctOption.includes(",");
            const correct = a.selectedOption !== null &&
              normalize(a.selectedOption) === normalize(a.question.correctOption);
            const opts: [string, string][] = [
              ["A", a.question.optionA],
              ["B", a.question.optionB],
              ["C", a.question.optionC],
              ["D", a.question.optionD],
            ];
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start gap-2 mb-3">
                  <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${correct ? "bg-green-100 text-green-700" : a.selectedOption ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                    {correct ? "✓" : a.selectedOption ? "✗" : "–"}
                  </span>
                  <div>
                    <p className="text-gray-800 font-medium text-sm">{i + 1}. {a.question.questionText}</p>
                    {isMultiSelect && <p className="text-xs text-blue-500 mt-0.5">Select all that apply</p>}
                  </div>
                </div>
                <div className="space-y-1.5 ml-7">
                  {opts.map(([key, label]) => {
                    const isCorrectKey = correctKeys.includes(key);
                    const isSelectedKey = selectedKeys.includes(key);
                    const isWrongSelection = isSelectedKey && !isCorrectKey;
                    return (
                      <div
                        key={key}
                        className={`text-sm px-3 py-2 rounded-lg ${
                          isCorrectKey
                            ? "bg-green-50 text-green-800 font-medium border border-green-200"
                            : isWrongSelection
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "text-gray-600"
                        }`}
                      >
                        <span className="font-bold mr-2">{key}.</span>{label}
                        {isCorrectKey && <span className="ml-2 text-green-600 text-xs">(correct)</span>}
                        {isWrongSelection && <span className="ml-2 text-red-500 text-xs">(your answer)</span>}
                      </div>
                    );
                  })}
                </div>
                {a.question.explanation && (
                  <p className="ml-7 mt-3 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 border border-gray-100">
                    {a.question.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/dashboard" className="inline-block bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-800 transition">
            Back to Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
