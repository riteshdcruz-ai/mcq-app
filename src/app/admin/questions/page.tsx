"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

type Book = { id: string; title: string };
type Question = {
  id: string; bookId: string; questionText: string; optionA: string; optionB: string;
  optionC: string; optionD: string; correctOption: string; explanation: string;
  difficulty: string; aiGenerated: boolean; approved: boolean; book: { title: string };
};

const DIFF_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const BLANK_FORM = { bookId: "", questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", explanation: "", difficulty: "medium" };

export default function AdminQuestionsPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [me, setMe] = useState<{ name: string } | null>(null);

  // Manual add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // AI generate
  const [aiBookId, setAiBookId] = useState("");
  const [genCount, setGenCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAi, setShowAi] = useState(false);

  // Edit
  const [editQ, setEditQ] = useState<Question | null>(null);

  const [tab, setTab] = useState<"pending" | "approved">("pending");

  async function fetchData() {
    const [booksRes, qRes] = await Promise.all([
      fetch("/api/admin/books"),
      fetch("/api/admin/questions"),
    ]);
    setBooks(await booksRes.json());
    setQuestions(await qRes.json());
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetchData();
  }, []);

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.bookId) { setAddError("Select a book"); return; }
    setAddSaving(true);
    setAddError("");
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (!res.ok) {
      const d = await res.json();
      setAddError(d.error || "Failed to save");
    } else {
      setAddForm(BLANK_FORM);
      setShowAdd(false);
      fetchData();
    }
    setAddSaving(false);
  }

  async function generate() {
    if (!aiBookId) return setAiError("Select a book first");
    setGenerating(true);
    setAiError("");
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", bookId: aiBookId, count: genCount }),
    });
    const d = await res.json();
    if (!res.ok) setAiError(d.error);
    else { await fetchData(); setTab("pending"); }
    setGenerating(false);
  }

  async function approve(q: Question) {
    await fetch("/api/admin/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: q.id, approved: true }),
    });
    fetchData();
  }

  async function saveEdit() {
    if (!editQ) return;
    await fetch("/api/admin/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editQ),
    });
    setEditQ(null);
    fetchData();
  }

  async function deleteQ(id: string) {
    if (!confirm("Delete this question?")) return;
    await fetch("/api/admin/questions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  const pending = questions.filter((q) => !q.approved);
  const approved = questions.filter((q) => q.approved);
  const displayed = tab === "pending" ? pending : approved;

  return (
    <>
      <Nav name={me?.name || "Admin"} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Questions</h1>
          <div className="flex gap-2">
            <a
              href="/api/admin/questions/export"
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Export CSV
            </a>
            <a
              href="/admin/questions/print"
              target="_blank"
              rel="noreferrer"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Print / PDF
            </a>
            <button onClick={() => { setShowAdd(true); setAddError(""); }}
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              + Add Question
            </button>
          </div>
        </div>

        {/* AI Generate (collapsible) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <button onClick={() => setShowAi(!showAi)}
            className="w-full px-6 py-4 flex justify-between items-center text-left">
            <div>
              <span className="font-semibold text-gray-700">AI Question Generation</span>
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Optional — needs API key</span>
            </div>
            <span className="text-gray-400 text-sm">{showAi ? "▲" : "▼"}</span>
          </button>
          {showAi && (
            <div className="px-6 pb-5 border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-400 mb-3">
                Upload a book first, then auto-generate MCQ drafts. Requires <code className="bg-gray-100 px-1 rounded">ANTHROPIC_API_KEY</code> in <code className="bg-gray-100 px-1 rounded">.env.local</code>.
              </p>
              {aiError && <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded mb-3 text-sm">{aiError}</div>}
              <div className="flex gap-3 flex-wrap">
                <select value={aiBookId} onChange={(e) => setAiBookId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select a book</option>
                  {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
                <input type="number" min={1} max={30} value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button onClick={generate} disabled={generating}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
                  {generating ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["pending", "approved"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${tab === t ? "bg-blue-700 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"}`}>
              {t === "pending" ? `Pending Approval (${pending.length})` : `Approved (${approved.length})`}
            </button>
          ))}
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          {displayed.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{q.book.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${DIFF_COLORS[q.difficulty] || DIFF_COLORS.medium}`}>{q.difficulty || "medium"}</span>
                    {q.aiGenerated && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">AI</span>}
                  </div>
                  <p className="font-medium text-gray-800 text-sm mb-2">{q.questionText}</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    {(["A", "B", "C", "D"] as const).map((k) => (
                      <span key={k} className={`px-2 py-1 rounded ${q.correctOption.split(",").includes(k) ? "bg-green-50 text-green-700 font-medium" : ""}`}>
                        {k}. {q[`option${k}` as keyof Question] as string}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {!q.approved && (
                    <button onClick={() => approve(q)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Approve</button>
                  )}
                  <button onClick={() => setEditQ(q)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg transition">Edit</button>
                  <button onClick={() => deleteQ(q.id)}
                    className="text-red-500 hover:text-red-700 text-xs px-3 py-1.5 rounded-lg transition">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {displayed.length === 0 && (
            <div className="text-center text-gray-400 py-10 bg-white rounded-xl border border-gray-200">
              {tab === "pending"
                ? 'No questions pending. Click "+ Add Question" to add manually.'
                : 'No approved questions yet. Approve questions from the "Pending Approval" tab.'}
            </div>
          )}
        </div>
      </main>

      {/* Add Question modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Add Question</h3>
            {addError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-3 text-sm">{addError}</div>
            )}
            <form onSubmit={addQuestion} className="space-y-3">
              <select required value={addForm.bookId} onChange={(e) => setAddForm({ ...addForm, bookId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select book</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <textarea required rows={3} placeholder="Question text"
                value={addForm.questionText} onChange={(e) => setAddForm({ ...addForm, questionText: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {(["A", "B", "C", "D"] as const).map((k) => (
                <input key={k} required placeholder={`Option ${k}`}
                  value={addForm[`option${k}` as keyof typeof addForm] as string}
                  onChange={(e) => setAddForm({ ...addForm, [`option${k}`]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ))}
              <div className="py-1">
                <span className="text-sm text-gray-600 font-medium block mb-1">Correct answer(s):</span>
                <div className="flex items-center gap-4">
                  {(["A", "B", "C", "D"] as const).map((k) => {
                    const selected = addForm.correctOption ? addForm.correctOption.split(",") : [];
                    const checked = selected.includes(k);
                    return (
                      <label key={k} className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="checkbox" value={k} checked={checked}
                          onChange={() => {
                            const next = checked ? selected.filter((x) => x !== k) : [...selected, k];
                            next.sort();
                            setAddForm({ ...addForm, correctOption: next.join(",") });
                          }} />
                        {k}
                      </label>
                    );
                  })}
                </div>
              </div>
              <select value={addForm.difficulty} onChange={(e) => setAddForm({ ...addForm, difficulty: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <textarea rows={2} placeholder="Explanation (optional)"
                value={addForm.explanation} onChange={(e) => setAddForm({ ...addForm, explanation: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={addSaving}
                  className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
                  {addSaving ? "Saving…" : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editQ && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-4">Edit Question</h3>
            <div className="space-y-3">
              <textarea rows={3} value={editQ.questionText}
                onChange={(e) => setEditQ({ ...editQ, questionText: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Question" />
              {(["A", "B", "C", "D"] as const).map((k) => (
                <input key={k} value={editQ[`option${k}` as keyof Question] as string}
                  onChange={(e) => setEditQ({ ...editQ, [`option${k}`]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${k}`} />
              ))}
              <div className="py-1">
                <span className="text-sm text-gray-600 font-medium block mb-1">Correct answer(s):</span>
                <div className="flex items-center gap-4">
                  {(["A", "B", "C", "D"] as const).map((k) => {
                    const selected = editQ.correctOption ? editQ.correctOption.split(",") : [];
                    const checked = selected.includes(k);
                    return (
                      <label key={k} className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="checkbox" value={k} checked={checked}
                          onChange={() => {
                            const next = checked ? selected.filter((x) => x !== k) : [...selected, k];
                            next.sort();
                            setEditQ({ ...editQ, correctOption: next.join(",") });
                          }} />
                        {k}
                      </label>
                    );
                  })}
                </div>
              </div>
              <select value={editQ.difficulty || "medium"}
                onChange={(e) => setEditQ({ ...editQ, difficulty: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <textarea rows={2} value={editQ.explanation}
                onChange={(e) => setEditQ({ ...editQ, explanation: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Explanation (optional)" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setEditQ(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
