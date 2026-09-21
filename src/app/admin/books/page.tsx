"use client";
import { useEffect, useState, useRef } from "react";
import Nav from "@/components/Nav";

type Book = { id: string; title: string; filename: string; createdAt: string; uploadedBy: { name: string }; _count: { questions: number } };

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchBooks() {
    const res = await fetch("/api/admin/books");
    setBooks(await res.json());
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetchBooks();
  }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) return;
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);

    const res = await fetch("/api/admin/books", { method: "POST", body: fd });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Upload failed");
    } else {
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      fetchBooks();
    }
    setUploading(false);
  }

  async function deleteBook(id: string, title: string) {
    if (!confirm(`Delete book "${title}" and all its questions?`)) return;
    await fetch("/api/admin/books", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchBooks();
  }

  return (
    <>
      <Nav name={me?.name || "Admin"} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Books</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-gray-700 mb-4">Upload Book</h2>
          <p className="text-sm text-gray-400 mb-4">Supported: PDF, DOCX, TXT. The text will be extracted and used for AI question generation.</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-3 text-sm">{error}</div>}
          <form onSubmit={upload} className="flex gap-3 flex-wrap">
            <input required placeholder="Book title" value={title} onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input required ref={fileRef} type="file" accept=".pdf,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700" />
            <button type="submit" disabled={uploading}
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs uppercase">
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">File</th>
                <th className="px-6 py-3 text-left">Questions</th>
                <th className="px-6 py-3 text-left">Uploaded by</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{b.title}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{b.filename}</td>
                  <td className="px-6 py-3 text-gray-600">{b._count.questions}</td>
                  <td className="px-6 py-3 text-gray-500">{b.uploadedBy.name}</td>
                  <td className="px-6 py-3 text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => deleteBook(b.id, b.title)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">No books uploaded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
