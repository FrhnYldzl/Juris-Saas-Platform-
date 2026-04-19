"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const timeEntrySchema = z.object({
  matterId: z.string().min(1),
  startedAt: z.string().min(1, "Başlangıç tarihi gerekli"),
  hours: z.coerce.number().positive("Saat > 0 olmalı").max(24, "En fazla 24 saat"),
  description: z.string().min(1, "Açıklama zorunlu"),
  billable: z.boolean().default(true),
});

export type TimeEntryState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function addTimeEntry(
  _prev: TimeEntryState,
  formData: FormData,
): Promise<TimeEntryState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "matter.edit");

  const parsed = timeEntrySchema.safeParse({
    matterId: formData.get("matterId"),
    startedAt: formData.get("startedAt"),
    hours: formData.get("hours"),
    description: formData.get("description"),
    billable: formData.get("billable") === "on",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const matter = await prisma.matter.findFirst({ where: { id: d.matterId, firmId } });
  if (!matter) return { ok: false, error: "Dosya bulunamadı" };

  const durationMin = Math.round(d.hours * 60);

  await prisma.timeEntry.create({
    data: {
      matterId: d.matterId,
      userId,
      startedAt: new Date(d.startedAt),
      durationMin,
      description: d.description,
      billable: d.billable,
    },
  });

  await audit({
    firmId, actorId: userId,
    action: "time_entry.create",
    entityType: "matter", entityId: d.matterId,
    diff: { hours: d.hours, description: d.description },
  });

  revalidatePath(`/ops/${d.matterId}`);
  return { ok: true };
}

export async function deleteTimeEntry(id: string, matterId: string) {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "matter.edit");

  const entry = await prisma.timeEntry.findFirst({
    where: { id, matter: { firmId } },
  });
  if (!entry) throw new Error("Kayıt bulunamadı");
  if (entry.billed) throw new Error("Faturalanmış zaman kaydı silinemez");

  await prisma.timeEntry.delete({ where: { id } });
  await audit({
    firmId, actorId: userId,
    action: "time_entry.delete",
    entityType: "matter", entityId: matterId,
  });
  revalidatePath(`/ops/${matterId}`);
}
