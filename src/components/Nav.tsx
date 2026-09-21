"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

type Props = { name: string; role: "admin" | "resource" };

export default function Nav({ name, role }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const links =
    role === "admin"
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/users", label: "Users" },
          { href: "/admin/books", label: "Books" },
          { href: "/admin/questions", label: "Questions" },
          { href: "/admin/tests", label: "Tests" },
          { href: "/admin/results", label: "Results" },
        ]
      : [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/tests", label: "My Tests" },
        ];

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-bold text-base tracking-wide">MCQ Platform</span>
          <div className="hidden md:flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-70">{name}</span>
          {role === "admin" && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded">
              ADMIN
            </span>
          )}
          <button
            onClick={logout}
            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
