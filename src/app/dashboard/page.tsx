import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Nav from "@/components/Nav";

type AttemptSummary = {
  id: string;
  status: string;
  score: number;
  totalQuestions: number;
  submittedAt: Date | null;
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [tests, retakePerms] = await Promise.all([
    prisma.test.findMany({
      where: {
        published: true,
        assignments: { some: { OR: [{ userId: session.userId }, { userId: null }] } },
      },
      include: {
        _count: { select: { testQuestions: true } },
        attempts: {
          where: { userId: session.userId },
          select: { id: true, status: true, score: true, totalQuestions: true, submittedAt: true },
          orderBy: { startedAt: "desc" },
        },
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.userTestRetakePermission.findMany({
      where: { userId: session.userId },
      select: { testId: true },
    }),
  ]);

  const retakeGrantedSet = new Set(retakePerms.map((p) => p.testId));

  // Latest attempt determines pending vs completed; tests with an active retake appear in pending
  const submitted = tests.filter((t) => t.attempts[0]?.status === "submitted");
  const pending = tests.filter((t) => !t.attempts[0] || t.attempts[0].status !== "submitted");

  return (
    <>
      <Nav name={session.name} role="resource" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {session.name}</h1>
        <p className="text-gray-500 mb-8">{session.email}</p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <Stat label="Assigned Tests" value={tests.length} />
          <Stat label="Completed" value={submitted.length} />
          <Stat label="Pending" value={pending.length} />
        </div>

        {pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Pending Tests</h2>
            <div className="space-y-3">
              {pending.map((t) => (
                <TestCard key={t.id} test={t} />
              ))}
            </div>
          </section>
        )}

        {submitted.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Completed Tests</h2>
            <div className="space-y-3">
              {submitted.map((t) => (
                <CompletedCard key={t.id} test={t} retakeGranted={retakeGrantedSet.has(t.id)} />
              ))}
            </div>
          </section>
        )}

        {tests.length === 0 && (
          <div className="text-center py-20 text-gray-400">No tests assigned yet.</div>
        )}
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
      <div className="text-3xl font-bold text-blue-700">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function TestCard({ test }: { test: { id: string; title: string; description: string; timeLimit: number; _count: { testQuestions: number } } }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-gray-800">{test.title}</h3>
        {test.description && <p className="text-sm text-gray-500 mt-0.5">{test.description}</p>}
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>{test._count.testQuestions} questions</span>
          <span>{test.timeLimit} min</span>
        </div>
      </div>
      <Link
        href={`/tests/${test.id}`}
        className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
      >
        Start
      </Link>
    </div>
  );
}

function CompletedCard({ test, retakeGranted }: { test: { id: string; title: string; allowRetake: boolean; attempts: AttemptSummary[] }; retakeGranted: boolean }) {
  // Show only submitted attempts, oldest first for sequential numbering
  const submittedAttempts = [...test.attempts.filter((a) => a.status === "submitted")].reverse();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{test.title}</h3>
        {(test.allowRetake || retakeGranted) && (
          <Link
            href={`/tests/${test.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
          >
            Retake
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {submittedAttempts.map((attempt, i) => {
          const pct = attempt.totalQuestions > 0
            ? Math.round((attempt.score / attempt.totalQuestions) * 100)
            : 0;
          const passed = pct >= 60;
          const date = attempt.submittedAt
            ? new Date(attempt.submittedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
            : "";

          return (
            <div key={attempt.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-xs w-16 shrink-0">Attempt {i + 1}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {passed ? "Passed" : "Failed"}
                </span>
                <span className="text-gray-700 font-medium">
                  {attempt.score}/{attempt.totalQuestions}
                  <span className="text-gray-400 font-normal ml-1">({pct}%)</span>
                </span>
                {date && <span className="text-gray-400 text-xs hidden sm:inline">{date}</span>}
              </div>
              <Link
                href={`/tests/${test.id}/result?attemptId=${attempt.id}`}
                className="text-blue-500 hover:text-blue-700 text-xs font-medium shrink-0 ml-2"
              >
                View
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
