import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const permissions = await prisma.userTestRetakePermission.findMany({
    select: { userId: true, testId: true },
  });
  return NextResponse.json(permissions);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { userId, testId } = await req.json();
  await prisma.userTestRetakePermission.upsert({
    where: { userId_testId: { userId, testId } },
    create: { userId, testId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { userId, testId } = await req.json();
  await prisma.userTestRetakePermission.deleteMany({
    where: { userId, testId },
  });
  return NextResponse.json({ ok: true });
}
