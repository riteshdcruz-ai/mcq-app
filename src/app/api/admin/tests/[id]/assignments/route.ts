import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: testId } = await params;
  const assignments = await prisma.testAssignment.findMany({ where: { testId } });
  const assignedToAll = assignments.some((a) => a.userId === null);
  const userIds = assignments.filter((a) => a.userId !== null).map((a) => a.userId!);
  return NextResponse.json({ assignedToAll, userIds });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: testId } = await params;
  const { assignToAll, userIds } = await req.json();

  await prisma.testAssignment.deleteMany({ where: { testId } });

  if (assignToAll) {
    await prisma.testAssignment.create({ data: { testId, userId: null } });
  } else if (userIds?.length > 0) {
    await prisma.testAssignment.createMany({
      data: userIds.map((userId: string) => ({ testId, userId })),
    });
  }

  return NextResponse.json({ ok: true });
}
