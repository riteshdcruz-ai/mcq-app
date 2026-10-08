import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: testId } = await params;
  const slots = await prisma.testSlot.findMany({
    where: { testId },
    include: {
      slotUsers: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json(slots);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: testId } = await params;
  const { label, startsAt } = await req.json();
  if (!startsAt) return NextResponse.json({ error: "startsAt required" }, { status: 400 });
  const slot = await prisma.testSlot.create({
    data: { testId, label: label || "", startsAt: new Date(startsAt) },
  });
  return NextResponse.json(slot, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { slotId } = await req.json();
  await prisma.testSlot.delete({ where: { id: slotId } });
  return NextResponse.json({ ok: true });
}
