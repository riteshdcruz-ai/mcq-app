"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

type Attempt = {
  id: string;
  userId: string;
  testId: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  user: { name: string; email: string };
  test: { title: string; passPercentage: number };
};

export default function AdminResultsPage() {
  const [results, setResults] = useState<Attempt[]>([]);
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [filter, setFilter] = useState("");
  const [exporting, setExporting] = useState(false);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  async function fetchResults() {
    const data = await fetch("/api/admin/results").then((r) => r.json());
    setResults(data);
  }

  async function fetchPermissions() {
    const data: { userId: string; testId: string }[] = await fetch("/api/admin/retake-permissions").then((r) => r.json());
    setPermissions(new Set(data.map((p) => `${p.userId}:${p.testId}`)));
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetchResults();
    fetchPermissions();
  }, []);

  async function deleteResult(id: string, name: string) {
    if (!confirm(`Delete score for ${name}? This cannot be undone.`)) return;
    await fetch("/api/admin/results", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchResults();
  }

  async function grantRetake(userId: string, testId: string) {
    await fetch("/api/admin/retake-permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, testId }),
    });
    fetchPermissions();
  }

  async function revokeRetake(userId: string, testId: string) {
    await fetch("/api/admin/retake-permissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, testId }),
    });
    fetchPermissions();
  }

  async function exportXlsx() {
    setExporting(true);
    const res = await fetch("/api/admin/results?export=xlsx");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcq-results-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  const filtered = results.filter(
    (r) =>
      r.user.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.user.email.toLowerCase().includes(filter.toLowerCase()) ||
      r.test.title.toLowerCase().includes(filter.toLowerCase())
  );

  const avgPct = results.length
    ? Math.round(results.reduce((s, r) => s + (r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : 0), 0) / results.length)
    : 0;
  const passed = results.filter((r) => r.totalQuestions > 0 && (r.score / r.totalQuestions) * 100 >= (r.test.passPercentage ?? 60)).length;

  return (
    <>
      <Nav name={me?.name || "Admin"} role="admin" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Results</h1>
          <button onClick={exportXlsx} disabled={exporting}
            className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
            {exporting ? "Exporting..." : "Export to Excel"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-700">{results.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Submissions</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-green-600">{passed}</div>
            <div className="text-sm text-gray-500 mt-1">Passed (≥60%)</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-700">{avgPct}%</div>
            <div className="text-sm text-gray-500 mt-1">Average Score</div>
          </div>
        </div>

        {/* Filter */}
        <input
          placeholder="Search by name, email or test..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs uppercase">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Test</th>
                <th className="px-6 py-3 text-left">Score</th>
                <th className="px-6 py-3 text-left">%</th>
                <th className="px-6 py-3 text-left">Result</th>
                <th className="px-6 py-3 text-left">Submitted</th>
                <th className="px-6 py-3 text-left">Retake</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const pct = r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0;
                const isPassed = pct >= (r.test.passPercentage ?? 60);
                const retakeKey = `${r.userId}:${r.testId}`;
                const retakeGranted = permissions.has(retakeKey);
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{r.user.name}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{r.user.email}</td>
                    <td className="px-6 py-3 text-gray-600">{r.test.title}</td>
                    <td className="px-6 py-3 text-gray-700">{r.score}/{r.totalQuestions}</td>
                    <td className="px-6 py-3 font-semibold text-gray-700">{pct}%</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {isPassed ? "Pass" : "Fail"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""}</td>
                    <td className="px-6 py-3">
                      {retakeGranted ? (
                        <button
                          onClick={() => revokeRetake(r.userId, r.testId)}
                          className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                          title="Click to revoke"
                        >
                          Granted
                        </button>
                      ) : (
                        <button
                          onClick={() => grantRetake(r.userId, r.testId)}
                          className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-700 transition"
                        >
                          Allow
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => deleteResult(r.id, r.user.name)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center text-gray-400 py-10">No results found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
