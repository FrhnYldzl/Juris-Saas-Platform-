import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sendSchema = z.object({
  body: z.string().min(1, "Mesaj boş olamaz").max(4000, "Max 4000 karakter"),
});

async function assertMatterAccess(matterId: string, userId: string, firmId: string, role: string) {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId },
    include: { client: { select: { id: true, email: true } } },
  });
  if (!matter) return null;

  // CLIENT can only access matters linked to their own contact (via email match)
  if (role === "CLIENT") {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!me?.email || matter.client?.email?.toLowerCase() !== me.email.toLowerCase()) {
      return null;
    }
  }
  return matter;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { firmId, userId, role } = await requireTenant();

  const matter = await assertMatterAccess(id, userId, firmId, role);
  if (!matter) return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });

  const messages = await prisma.matterMessage.findMany({
    where: { matterId: id, firmId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, role: true, image: true } },
    },
  });

  // Mark incoming messages as read (messages sent by others)
  const unreadIds = messages
    .filter((m) => m.senderId !== userId && !m.readAt)
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await prisma.matterMessage.updateMany({
      where: { id: { in: unreadIds } },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      senderName: m.sender.name,
      senderRole: m.sender.role,
      readAt: m.readAt,
      createdAt: m.createdAt,
      isMe: m.senderId === userId,
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { firmId, userId, role } = await requireTenant();

  const matter = await assertMatterAccess(id, userId, firmId, role);
  if (!matter) return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz istek", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const msg = await prisma.matterMessage.create({
    data: {
      firmId,
      matterId: id,
      senderId: userId,
      body: parsed.data.body,
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json({
    message: {
      id: msg.id,
      body: msg.body,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      senderRole: msg.sender.role,
      readAt: null,
      createdAt: msg.createdAt,
      isMe: true,
    },
  });
}
