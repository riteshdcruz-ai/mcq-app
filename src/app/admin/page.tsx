import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Nav from "@/components/Nav";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");

  const [users, books, questions, tests, attempts] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.question.count(),
    prisma.test.count(),
    prisma.testAttempt.count({ where: { status: "submitted" } }),
  ]);

  const recentAttempts = await prisma.testAttempt.findMany({
    where: { status: "submitted" },
    include: {
      user: { select: { name: true, email: true } },
      test: { select: { title: true } },
    },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  const cards = [
    { label: "Users", value: users, href: "/admin/users", color: "blue" },
    { label: "Books", value: books, href: "/admin/books", color: "purple" },
    { label: "Questions", value: questions, href: "/admin/questions", color: "indigo" },
    { label: "Tests", value: tests, href: "/admin/tests", color: "cyan" },
    { label: "Submissions", value: attempts, href: "/admin/results", color: "green" },
  ];

  return (
    <>
      <Nav name={session.name} role="admin" />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {cards.map((c) => (
            <Link key={c.href} href={c.href} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition text-center group">
              <div className="text-3xl font-bold text-blue-700 group-hover:text-blue-900">{c.value}</div>
              <div className="text-sm text-gray-500 mt-1">{c.label}</div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Recent Submissions</h2>
            <Link href="/admin/results" className="text-blue-600 text-sm hover:underline">View all</Link>
          </div>
          {recentAttempts.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No submissions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase">
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Test</th>
                  <th className="px-6 py-3 text-left">Score</th>
                  <th className="px-6 py-3 text-left">%</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((a) => {
                  const pct = a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0;
                  return (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">{a.user.name}</td>
                      <td className="px-6 py-3 text-gray-600">{a.test.title}</td>
                      <td className="px-6 py-3 text-gray-600">{a.score}/{a.totalQuestions}</td>
                      <td className="px-6 py-3">
                        <span className={`font-bold ${pct >= 60 ? "text-green-600" : "text-red-600"}`}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
