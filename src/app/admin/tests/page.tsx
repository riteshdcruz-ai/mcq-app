"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

type Test = { id: string; title: string; description: string; timeLimit: number; randomMode: boolean; randomCount: number; published: boolean; allowRetake: boolean; passPercentage: number; createdAt: string; createdBy: { name: string }; _count: { testQuestions: number; attempts: number } };
type SlotUser = { id: string; name: string; email: string };
type Slot = { id: string; label: string; startsAt: string; slotUsers: { userId: string; user: SlotUser }[] };
type User = { id: string; name: string; email: string; role: string };
type Question = { id: string; questionText: string; book: { title: string }; approved: boolean };
type Book = { id: string; title: string };

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", timeLimit: 30, passPercentage: 60, assignToAll: true, assignedUserIds: [] as string[], questionIds: [] as string[], bookIds: [] as string[], randomCount: 60, randomSourceType: "all" as "all" | "books" | "questions" });
  const [saving, setSaving] = useState(false);
  const [randomMode, setRandomMode] = useState(false);
  const [assigningTest, setAssigningTest] = useState<Test | null>(null);
  const [assignForm, setAssignForm] = useState<{ assignedToAll: boolean; userIds: string[] }>({ assignedToAll: true, userIds: [] });
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignFilter, setAssignFilter] = useState("");

  // Slots state
  const [slotsTest, setSlotsTest] = useState<Test | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlot, setNewSlot] = useState({ label: "", startsAt: "" });
  const [slotSaving, setSlotSaving] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [slotUserSearch, setSlotUserSearch] = useState("");
  const [pendingSlotUsers, setPendingSlotUsers] = useState<string[]>([]);
  const [slotUserSaving, setSlotUserSaving] = useState(false);

  async function fetchAll() {
    const [t, u, q, b] = await Promise.all([
      fetch("/api/admin/tests").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/questions").then((r) => r.json()),
      fetch("/api/admin/books").then((r) => r.json()),
    ]);
    setTests(t);
    setUsers(u.filter((u: User) => u.role === "resource"));
    setQuestions(q.filter((q: Question) => q.approved));
    setBooks(b);
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

  function toggleBook(bId: string) {
    setForm((f) => ({ ...f, bookIds: f.bookIds.includes(bId) ? f.bookIds.filter((x) => x !== bId) : [...f.bookIds, bId] }));
  }

  function toggleUser(uid: string) {
    setForm((f) => ({ ...f, assignedUserIds: f.assignedUserIds.includes(uid) ? f.assignedUserIds.filter((x) => x !== uid) : [...f.assignedUserIds, uid] }));
  }

  async function openAssignModal(test: Test) {
    const data = await fetch(`/api/admin/tests/${test.id}/assignments`).then((r) => r.json());
    setAssignForm(data);
    setAssignFilter("");
    setAssigningTest(test);
  }

  async function saveAssignments() {
    if (!assigningTest) return;
    setAssignSaving(true);
    await fetch(`/api/admin/tests/${assigningTest.id}/assignments`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignToAll: assignForm.assignedToAll, userIds: assignForm.userIds }),
    });
    setAssignSaving(false);
    setAssigningTest(null);
    fetchAll();
  }

  function toggleAssignUser(uid: string) {
    setAssignForm((f) => ({
      ...f,
      userIds: f.userIds.includes(uid) ? f.userIds.filter((x) => x !== uid) : [...f.userIds, uid],
    }));
  }

  async function openSlotsModal(test: Test) {
    setSlotsTest(test);
    setActiveSlotId(null);
    setNewSlot({ label: "", startsAt: "" });
    setSlotUserSearch("");
    const data = await fetch(`/api/admin/tests/${test.id}/slots`).then((r) => r.json());
    setSlots(data);
  }

  async function addSlot() {
    if (!slotsTest || !newSlot.startsAt) return;
    setSlotSaving(true);
    await fetch(`/api/admin/tests/${slotsTest.id}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newSlot.label, startsAt: newSlot.startsAt }),
    });
    const data = await fetch(`/api/admin/tests/${slotsTest.id}/slots`).then((r) => r.json());
    setSlots(data);
    setNewSlot({ label: "", startsAt: "" });
    setSlotSaving(false);
  }

  async function deleteSlot(slotId: string) {
    if (!slotsTest || !confirm("Delete this slot and all its user assignments?")) return;
    await fetch(`/api/admin/tests/${slotsTest.id}/slots`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    const data = await fetch(`/api/admin/tests/${slotsTest.id}/slots`).then((r) => r.json());
    setSlots(data);
    if (activeSlotId === slotId) setActiveSlotId(null);
  }

  function openSlotUsers(slot: Slot) {
    setActiveSlotId(slot.id);
    setPendingSlotUsers(slot.slotUsers.map((su) => su.userId));
    setSlotUserSearch("");
  }

  async function saveSlotUsers() {
    if (!activeSlotId || !slotsTest) return;
    setSlotUserSaving(true);
    await fetch(`/api/admin/slots/${activeSlotId}/users`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: pendingSlotUsers }),
    });
    const data = await fetch(`/api/admin/tests/${slotsTest.id}/slots`).then((r) => r.json());
    setSlots(data);
    setActiveSlotId(null);
    setSlotUserSaving(false);
  }

  async function createTest(e: React.FormEvent) {
    e.preventDefault();
    if (!randomMode && form.questionIds.length === 0) return alert("Select at least one question, or enable Random Mode");
    if (randomMode && form.randomSourceType === "books" && form.bookIds.length === 0) return alert("Select at least one book for the question pool");
    if (randomMode && form.randomSourceType === "questions" && form.questionIds.length === 0) return alert("Select at least one question for the pool");
    setSaving(true);
    await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, randomMode, randomCount: form.randomCount, randomSourceType: form.randomSourceType }),
    });
    setCreating(false);
    setRandomMode(false);
    setForm({ title: "", description: "", timeLimit: 30, passPercentage: 60, assignToAll: true, assignedUserIds: [], questionIds: [], bookIds: [], randomCount: 60, randomSourceType: "all" });
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
                    <button onClick={() => openAssignModal(t)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Assign</button>
                    <button onClick={() => openSlotsModal(t)} className="text-purple-600 hover:text-purple-800 text-xs font-medium">Slots</button>
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

      {/* Slots modal */}
      {slotsTest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Exam Slots</h3>
                <p className="text-sm text-gray-500">{slotsTest.title}</p>
              </div>
              <button onClick={() => { setSlotsTest(null); setActiveSlotId(null); }} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
            </div>

            {/* Existing slots */}
            {slots.length === 0 && (
              <p className="text-sm text-gray-400 mb-4">No slots yet. Add one below to schedule exam access by time.</p>
            )}
            <div className="space-y-3 mb-5">
              {slots.map((slot) => (
                <div key={slot.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{slot.label || "Unnamed slot"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Starts: {new Date(slot.startsAt).toLocaleString()} · {slot.slotUsers.length} user{slot.slotUsers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => activeSlotId === slot.id ? setActiveSlotId(null) : openSlotUsers(slot)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                      >
                        {activeSlotId === slot.id ? "Close" : "Assign Users"}
                      </button>
                      <button onClick={() => deleteSlot(slot.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
                    </div>
                  </div>

                  {/* Inline user assignment for this slot */}
                  {activeSlotId === slot.id && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{pendingSlotUsers.length} selected</span>
                        <div className="flex gap-3 text-xs">
                          <button onClick={() => setPendingSlotUsers(users.map((u) => u.id))} className="text-blue-600 hover:underline">Select all</button>
                          <button onClick={() => setPendingSlotUsers([])} className="text-gray-500 hover:underline">Clear</button>
                        </div>
                      </div>
                      <input
                        placeholder="Search users..."
                        value={slotUserSearch}
                        onChange={(e) => setSlotUserSearch(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="border border-gray-100 rounded-lg p-2 max-h-48 overflow-y-auto space-y-0.5">
                        {users
                          .filter((u) => !slotUserSearch || u.name.toLowerCase().includes(slotUserSearch.toLowerCase()) || u.email.toLowerCase().includes(slotUserSearch.toLowerCase()))
                          .map((u) => (
                            <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
                              <input
                                type="checkbox"
                                checked={pendingSlotUsers.includes(u.id)}
                                onChange={() => setPendingSlotUsers((prev) => prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id])}
                                className="rounded"
                              />
                              <span className="text-gray-800">{u.name}</span>
                              <span className="text-gray-400 text-xs">{u.email}</span>
                            </label>
                          ))}
                        {users.length === 0 && <p className="text-gray-400 text-xs px-1">No resource users found.</p>}
                      </div>
                      <div className="flex gap-2 justify-end mt-3">
                        <button onClick={() => setActiveSlotId(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                        <button onClick={saveSlotUsers} disabled={slotUserSaving} className="px-4 py-1.5 text-sm bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-60 transition">
                          {slotUserSaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new slot */}
            <div className="border border-dashed border-gray-300 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Add Slot</p>
              <div className="flex flex-col gap-2">
                <input
                  placeholder='Label, e.g. "Slot A" or "Morning Batch"'
                  value={newSlot.label}
                  onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={newSlot.startsAt}
                    onChange={(e) => setNewSlot({ ...newSlot, startsAt: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={addSlot}
                    disabled={slotSaving || !newSlot.startsAt}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                  >
                    {slotSaving ? "Adding..." : "Add Slot"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assigningTest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 text-lg mb-1">Assign Users</h3>
            <p className="text-sm text-gray-500 mb-4">{assigningTest.title}</p>

            <label className="flex items-center gap-2 text-sm cursor-pointer mb-3 font-medium">
              <input type="checkbox" checked={assignForm.assignedToAll}
                onChange={(e) => setAssignForm((f) => ({ ...f, assignedToAll: e.target.checked, userIds: [] }))}
                className="rounded" />
              Assign to all users
            </label>

            {!assignForm.assignedToAll && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{assignForm.userIds.length} selected</span>
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => setAssignForm((f) => ({ ...f, userIds: users.map((u) => u.id) }))} className="text-blue-600 hover:underline">Select all</button>
                    <button onClick={() => setAssignForm((f) => ({ ...f, userIds: [] }))} className="text-gray-500 hover:underline">Clear</button>
                  </div>
                </div>
                <input
                  placeholder="Search users..."
                  value={assignFilter}
                  onChange={(e) => setAssignFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-1">
                  {users
                    .filter((u) => !assignFilter || u.name.toLowerCase().includes(assignFilter.toLowerCase()) || u.email.toLowerCase().includes(assignFilter.toLowerCase()))
                    .map((u) => (
                      <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
                        <input type="checkbox" checked={assignForm.userIds.includes(u.id)} onChange={() => toggleAssignUser(u.id)} className="rounded" />
                        <span className="text-gray-800">{u.name}</span>
                        <span className="text-gray-400 text-xs">{u.email}</span>
                      </label>
                    ))}
                  {users.length === 0 && <p className="text-gray-400 text-xs">No users found.</p>}
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setAssigningTest(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveAssignments} disabled={assignSaving} className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
                {assignSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Show</span>
                      <input type="number" min={1} max={500} value={form.randomCount}
                        onChange={(e) => setForm({ ...form, randomCount: Number(e.target.value) })}
                        className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span>random questions per attempt</span>
                    </div>

                    {/* Pool source */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1.5">Pick questions from:</p>
                      <div className="flex flex-col gap-1.5">
                        {(["all", "books", "questions"] as const).map((type) => (
                          <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" name="randomSourceType" value={type}
                              checked={form.randomSourceType === type}
                              onChange={() => setForm({ ...form, randomSourceType: type, bookIds: [], questionIds: [] })}
                              className="rounded-full" />
                            {type === "all" && "All approved questions"}
                            {type === "books" && "Specific book(s)"}
                            {type === "questions" && "Specific questions (hand-picked pool)"}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Book picker */}
                    {form.randomSourceType === "books" && (
                      <div className="border border-gray-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-1">
                        {books.map((b) => (
                          <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={form.bookIds.includes(b.id)} onChange={() => toggleBook(b.id)} className="rounded" />
                            <span className="text-gray-700">{b.title}</span>
                          </label>
                        ))}
                        {books.length === 0 && <p className="text-gray-400 text-xs">No books available.</p>}
                      </div>
                    )}

                    {/* Question pool picker */}
                    {form.randomSourceType === "questions" && (
                      <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                        <p className="text-xs text-gray-400 mb-1">{form.questionIds.length} selected as pool</p>
                        {questions.map((q) => (
                          <label key={q.id} className="flex items-start gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={form.questionIds.includes(q.id)} onChange={() => toggleQ(q.id)} className="rounded mt-0.5" />
                            <span className="text-gray-700">{q.questionText.slice(0, 80)}… <span className="text-gray-400 text-xs">({q.book.title})</span></span>
                          </label>
                        ))}
                        {questions.length === 0 && <p className="text-gray-400 text-xs">No approved questions available.</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Questions — only shown for non-random mode */}
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
