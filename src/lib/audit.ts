import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export interface AuditInput {
  firmId: string;
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  diff?: unknown;
  ip?: string;
  userAgent?: string;
}

export async function audit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        firmId: input.firmId,
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        diff: input.diff ? JSON.parse(JSON.stringify(input.diff)) : undefined,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  } catch (err) {
    logger.warn({ err, action: input.action }, "Audit log failed (non-fatal)");
  }
}
