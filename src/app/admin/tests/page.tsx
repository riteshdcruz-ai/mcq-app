"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

type Test = { id: string; title: string; description: string; timeLimit: number; randomMode: boolean; randomCount: number; published: boolean; allowRetake: boolean; passPercentage: number; createdAt: string; createdBy: { name: string }; _count: { testQuestions: number; attempts: number } };
type User = { id: string; name: string; email: string; role: string };
type Question = { id: string; questionText: string; book: { title: string }; approved: boolean };

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", timeLimit: 30, passPercentage: 60, assignToAll: true, assignedUserIds: [] as string[], questionIds: [] as string[], randomCount: 60 });
  const [saving, setSaving] = useState(false);
  const [randomMode, setRandomMode] = useState(false);

  async function fetchAll() {
    const [t, u, q] = await Promise.all([
      fetch("/api/admin/tests").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/questions").then((r) => r.json()),
    ]);
    setTests(t);
    setUsers(u.filter((u: User) => u.role === "resource"));
    setQuestions(q.filter((q: Question) => q.approved));
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetchAll();
  }, []);

  async function togglePublish(test: Test) {
    await fetch("/api/admin/tests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: test.id, published: !test.published }),
    });
    fetchAll();
  }

  async function toggleRetake(test: Test) {
    await fetch("/api/admin/tests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: test.id, allowRetake: !test.allowRetake }),
    });
    fetchAll();
  }

  async function deleteTest(id: string, title: string) {
    if (!confirm(`Delete test "${title}"?`)) return;
    await fetch("/api/admin/tests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAll();
  }

  function toggleQ(qId: string) {
    setForm((f) => ({ ...f, questionIds: f.questionIds.includes(qId) ? f.questionIds.filter((x) => x !== qId) : [...f.questionIds, qId] }));
  }

  function toggleUser(uid: string) {
    setForm((f) => ({ ...f, assignedUserIds: f.assignedUserIds.includes(uid) ? f.assignedUserIds.filter((x) => x !== uid) : [...f.assignedUserIds, uid] }));
  }

  async function createTest(e: React.FormEvent) {
    e.preventDefault();
    if (!randomMode && form.questionIds.length === 0) return alert("Select at least one question, or enable Random Mode");
    setSaving(true);
    await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, randomMode, randomCount: form.randomCount }),
    });
    setCreating(false);
    setRandomMode(false);
    setForm({ title: "", description: "", timeLimit: 30, passPercentage: 60, assignToAll: true, assignedUserIds: [], questionIds: [], randomCount: 60 });
    setSaving(false);
    fetchAll();
  }

  return (
    <>
      <Nav name={me?.name || "Admin"} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tests</h1>
          <button onClick={() => setCreating(true)} className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            + Create Test
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs uppercase">
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Questions</th>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Attempts</th>
                <th className="px-6 py-3 text-left">Pass %</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Retake</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{t.title}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {t.randomMode
                      ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Random {t.randomCount}q</span>
                      : t._count.testQuestions}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{t.timeLimit} min</td>
                  <td className="px-6 py-3 text-gray-600">{t._count.attempts}</td>
                  <td className="px-6 py-3">
                    <input
                      type="number" min={1} max={100}
                      value={t.passPercentage ?? 60}
                      onChange={async (e) => {
                        const val = Number(e.target.value);
                        if (val < 1 || val > 100) return;
                        await fetch("/api/admin/tests", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: t.id, passPercentage: val }),
                        });
                        fetchAll();
                      }}
                      className="w-16 border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-xs text-gray-400 ml-1">%</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => toggleRetake(t)}
                      className={`text-xs font-bold px-2 py-0.5 rounded-full transition ${t.allowRetake ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                    >
                      {t.allowRetake ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-right flex gap-3 justify-end">
                    <button onClick={() => togglePublish(t)} className={`text-xs font-medium ${t.published ? "text-orange-500 hover:text-orange-700" : "text-green-600 hover:text-green-800"}`}>
                      {t.published ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => deleteTest(t.id, t.title)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">No tests created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Create Test</h3>
            <form onSubmit={createTest} className="space-y-4">
              <input required placeholder="Test title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea rows={2} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">Time limit (min):</label>
                  <input type="number" min={1} max={180} value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">Pass percentage:</label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={1} max={100} value={form.passPercentage} onChange={(e) => setForm({ ...form, passPercentage: Number(e.target.value) })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>

              {/* Assign */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Assign to</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                  <input type="checkbox" checked={form.assignToAll} onChange={(e) => setForm({ ...form, assignToAll: e.target.checked })} className="rounded" />
                  All users
                </label>
                {!form.assignToAll && (
                  <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
                    {users.map((u) => (
                      <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.assignedUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} className="rounded" />
                        {u.name} ({u.email})
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Random mode */}
              <div className="border border-gray-200 rounded-lg p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={randomMode} onChange={(e) => setRandomMode(e.target.checked)} className="rounded" />
                  Random Mode — pick questions randomly per attempt
                </label>
                {randomMode && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <span>Show</span>
                    <input type="number" min={1} max={500} value={form.randomCount}
                      onChange={(e) => setForm({ ...form, randomCount: Number(e.target.value) })}
                      className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span>random questions (mixed easy / medium / hard)</span>
                  </div>
                )}
              </div>

              {/* Questions — hidden when random mode */}
              {!randomMode && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Questions ({form.questionIds.length} selected)
                </label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                  {questions.map((q) => (
                    <label key={q.id} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.questionIds.includes(q.id)} onChange={() => toggleQ(q.id)} className="rounded mt-0.5" />
                      <span className="text-gray-700">{q.questionText.slice(0, 80)}… <span className="text-gray-400 text-xs">({q.book.title})</span></span>
                    </label>
                  ))}
                  {questions.length === 0 && <p className="text-gray-400 text-xs">No approved questions available. Go to Questions tab to approve some.</p>}
                </div>
              </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
                  {saving ? "Creating..." : "Create Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
