import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: slotId } = await params;
  const { userIds } = await req.json();

  const slot = await prisma.testSlot.findUnique({ where: { id: slotId }, select: { testId: true } });
  if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

  // Remove these users from other slots in the same test (one slot per user per test)
  const otherSlots = await prisma.testSlot.findMany({
    where: { testId: slot.testId, NOT: { id: slotId } },
    select: { id: true },
  });
  const otherSlotIds = otherSlots.map((s) => s.id);
  if (otherSlotIds.length > 0 && userIds.length > 0) {
    await prisma.testSlotUser.deleteMany({
      where: { slotId: { in: otherSlotIds }, userId: { in: userIds } },
    });
  }

  // Replace all users for this slot
  await prisma.testSlotUser.deleteMany({ where: { slotId } });
  if (userIds.length > 0) {
    await prisma.testSlotUser.createMany({
      data: userIds.map((userId: string) => ({ slotId, userId })),
    });
  }

  return NextResponse.json({ ok: true });
}
