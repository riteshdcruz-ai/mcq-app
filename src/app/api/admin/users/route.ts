import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Bulk create mode
  if (body.action === "bulk") {
    const { users, password, role } = body as {
      users: { name: string; email: string }[];
      password: string;
      role: string;
    };
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const u of users) {
      if (!u.email || !u.name) { results.errors.push(`Invalid row: "${u.name}, ${u.email}"`); continue; }
      const existing = await prisma.user.findUnique({ where: { email: u.email.toLowerCase() } });
      if (existing) { results.skipped++; continue; }
      try {
        await prisma.user.create({
          data: { email: u.email.toLowerCase().trim(), name: u.name.trim(), passwordHash, role: role || "resource" },
        });
        results.created++;
      } catch {
        results.errors.push(`Failed: ${u.email}`);
      }
    }
    return NextResponse.json(results, { status: 201 });
  }

  // Single create mode
  const { email, name, password, role } = body;
  if (!email || !name || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), name, passwordHash, role: role || "resource" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return NextResponse.json(user, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, password, role } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (password !== undefined) {
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(password, 12);
  }
  if (role !== undefined) {
    if (!["admin", "resource"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    data.role = role;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (id === session.userId) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  try {
    // Gather IDs to drive cascade order (SQLite needs explicit ordering)
    const [userBooks, userTests, userAttempts] = await Promise.all([
      prisma.book.findMany({ where: { uploadedById: id }, select: { id: true } }),
      prisma.test.findMany({ where: { createdById: id }, select: { id: true } }),
      prisma.testAttempt.findMany({ where: { userId: id }, select: { id: true } }),
    ]);
    const bookIds = userBooks.map((b) => b.id);
    const testIds = userTests.map((t) => t.id);
    const ownAttemptIds = userAttempts.map((a) => a.id);

    const [bookQuestions, testAttempts] = await Promise.all([
      bookIds.length
        ? prisma.question.findMany({ where: { bookId: { in: bookIds } }, select: { id: true } })
        : Promise.resolve([]),
      testIds.length
        ? prisma.testAttempt.findMany({ where: { testId: { in: testIds } }, select: { id: true } })
        : Promise.resolve([]),
    ]);
    const questionIds = bookQuestions.map((q) => q.id);
    const testAttemptIds = testAttempts.map((a) => a.id);

    await prisma.$transaction(async (tx) => {
      // 1. Remove answers referencing questions from this user's books (other users' attempts)
      if (questionIds.length) {
        await tx.testAttemptAnswer.deleteMany({ where: { questionId: { in: questionIds } } });
      }
      // 2. Remove answers for other users' attempts on this user's tests (cascade handles the rest)
      if (testAttemptIds.length) {
        await tx.testAttemptAnswer.deleteMany({ where: { attemptId: { in: testAttemptIds } } });
      }
      // 3. Remove answers for this user's own attempts
      if (ownAttemptIds.length) {
        await tx.testAttemptAnswer.deleteMany({ where: { attemptId: { in: ownAttemptIds } } });
      }
      // 4. Delete attempts on this user's tests
      if (testIds.length) {
        await tx.testAttempt.deleteMany({ where: { testId: { in: testIds } } });
      }
      // 5. Delete this user's attempts
      await tx.testAttempt.deleteMany({ where: { userId: id } });
      // 6. Delete this user's individual assignments
      await tx.testAssignment.deleteMany({ where: { userId: id } });
      // 7. Delete books → cascades Questions → cascades TestQuestions
      if (bookIds.length) {
        await tx.book.deleteMany({ where: { id: { in: bookIds } } });
      }
      // 8. Delete tests → cascades TestQuestions and TestAssignments
      if (testIds.length) {
        await tx.test.deleteMany({ where: { id: { in: testIds } } });
      }
      // 9. Delete the user
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[delete user] error:", msg);
    return NextResponse.json({ error: `Delete failed: ${msg}` }, { status: 500 });
  }
}
