import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { subHours } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Notification feed — last 20 audit log entries + unread count (entries in
 * the last 24 hours that weren't created by the current user).
 */
export async function GET() {
  const { firmId, userId } = await requireTenant();

  const [items, unread] = await Promise.all([
    prisma.auditLog.findMany({
      where: { firmId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { name: true } } },
    }),
    prisma.auditLog.count({
      where: {
        firmId,
        createdAt: { gte: subHours(new Date(), 24) },
        actorId: { not: userId },
      },
    }),
  ]);

  return NextResponse.json({
    items: items.map((a) => ({
      id: a.id,
      action: a.action,
      createdAt: a.createdAt.toISOString(),
      actorName: a.actor?.name ?? null,
      entityType: a.entityType,
      entityId: a.entityId,
    })),
    unread,
  });
}
