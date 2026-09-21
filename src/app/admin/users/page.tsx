"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

type User = { id: string; email: string; name: string; role: string; createdAt: string };
type BulkResult = { created: number; skipped: number; errors: string[] };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "resource" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Bulk add state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPassword, setBulkPassword] = useState("");
  const [bulkRole, setBulkRole] = useState("resource");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    setUsers(await res.json());
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetchUsers();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setForm({ email: "", name: "", password: "", role: "resource" });
    setLoading(false);
    fetchUsers();
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete user "${name}" and all their data? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Delete failed");
    }
    fetchUsers();
  }

  async function changeRole(id: string, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to update role");
    }
    fetchUsers();
  }

  async function bulkAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkPassword) return;
    setBulkLoading(true);
    setBulkResult(null);

    // Parse textarea: each line is "Full Name, email@example.com" or tab-separated
    const rows = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Support tab (Excel paste) or comma separation
        const sep = line.includes("\t") ? "\t" : ",";
        const parts = line.split(sep).map((p) => p.trim());
        return { name: parts[0] || "", email: parts[1] || "" };
      })
      .filter((r) => r.name && r.email);

    if (rows.length === 0) { setBulkLoading(false); return; }

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk", users: rows, password: bulkPassword, role: bulkRole }),
    });
    const data = await res.json();
    setBulkResult(data);
    setBulkLoading(false);
    if (data.created > 0) { setBulkText(""); fetchUsers(); }
  }

  async function submitResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError("");
    setResetLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: resetTarget.id, password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResetError(data.error || "Failed to reset password");
      setResetLoading(false);
      return;
    }
    setResetTarget(null);
    setNewPassword("");
    setResetLoading(false);
  }

  return (
    <>
      <Nav name={me?.name || "Admin"} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Users</h1>

        {/* Create form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-gray-700 mb-4">Add User</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-3 text-sm">{error}</div>}
          <form onSubmit={createUser} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="resource">Resource</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" disabled={loading}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Bulk Add Users */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <button onClick={() => { setShowBulk(!showBulk); setBulkResult(null); }}
            className="w-full px-6 py-4 flex justify-between items-center text-left">
            <div>
              <span className="font-semibold text-gray-700">Bulk Add Users</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">One password for all</span>
            </div>
            <span className="text-gray-400 text-sm">{showBulk ? "▲" : "▼"}</span>
          </button>
          {showBulk && (
            <div className="px-6 pb-5 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-3">
                Paste one user per line — <span className="font-medium text-gray-600">Full Name, email@example.com</span><br />
                You can also paste directly from Excel (Name in column A, Email in column B).
              </p>
              <form onSubmit={bulkAdd} className="space-y-3">
                <textarea
                  rows={6}
                  placeholder={"John Smith, john.smith@accenture.com\nPriya Sharma, priya.sharma@accenture.com\nAlex Johnson, alex.johnson@accenture.com"}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3 flex-wrap">
                  <input
                    required
                    type="password"
                    placeholder="Common password for all users"
                    value={bulkPassword}
                    onChange={(e) => setBulkPassword(e.target.value)}
                    minLength={6}
                    className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select value={bulkRole} onChange={(e) => setBulkRole(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="resource">Resource</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" disabled={bulkLoading || !bulkText.trim()}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
                    {bulkLoading ? "Adding..." : "Add All"}
                  </button>
                </div>
              </form>

              {/* Results */}
              {bulkResult && (
                <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${bulkResult.errors.length > 0 ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
                  <p className="font-semibold text-gray-700 mb-1">
                    {bulkResult.created} created · {bulkResult.skipped} skipped (already exist)
                    {bulkResult.errors.length > 0 && ` · ${bulkResult.errors.length} errors`}
                  </p>
                  {bulkResult.errors.length > 0 && (
                    <ul className="text-xs text-red-600 mt-1 space-y-0.5">
                      {bulkResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs uppercase">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Added</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-6 py-3 text-gray-600">{u.email}</td>
                  <td className="px-6 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        u.role === "admin"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      <option value="resource">resource</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-right flex items-center justify-end gap-3">
                    <button
                      onClick={() => { setResetTarget({ id: u.id, name: u.name }); setNewPassword(""); setResetError(""); }}
                      className="text-blue-500 hover:text-blue-700 text-xs font-medium whitespace-nowrap"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => deleteUser(u.id, u.name)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-10">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">Setting new password for <span className="font-medium text-gray-700">{resetTarget.name}</span></p>
            {resetError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-3">{resetError}</div>
            )}
            <form onSubmit={submitResetPassword} className="space-y-3">
              <input
                autoFocus
                type="password"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition disabled:opacity-60"
                >
                  {resetLoading ? "Saving..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
