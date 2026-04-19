"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { MatterType, MatterStatus, BillingType } from "@prisma/client";

const matterSchema = z.object({
  title: z.string().min(2, "Başlık en az 2 karakter olmalı"),
  clientId: z.string().optional().nullable(),
  type: z.nativeEnum(MatterType).default(MatterType.OTHER),
  status: z.nativeEnum(MatterStatus).default(MatterStatus.ACTIVE),
  billingType: z.nativeEnum(BillingType).default(BillingType.HOURLY),
  hourlyRate: z.coerce.number().optional().nullable(),
  flatFee: z.coerce.number().optional().nullable(),
  courtName: z.string().optional().nullable(),
  courtFileNo: z.string().optional().nullable(),
  opposingParty: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type MatterFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function nextMatterNumber(firmId: string) {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;
  const last = await prisma.matter.findFirst({
    where: { firmId, matterNumber: { startsWith: prefix } },
    orderBy: { matterNumber: "desc" },
    select: { matterNumber: true },
  });
  const lastSeq = last ? parseInt(last.matterNumber.slice(prefix.length), 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

function parseForm(formData: FormData) {
  return {
    title: formData.get("title"),
    clientId: formData.get("clientId") || null,
    type: formData.get("type"),
    status: formData.get("status"),
    billingType: formData.get("billingType"),
    hourlyRate: formData.get("hourlyRate") || null,
    flatFee: formData.get("flatFee") || null,
    courtName: formData.get("courtName") || null,
    courtFileNo: formData.get("courtFileNo") || null,
    opposingParty: formData.get("opposingParty") || null,
    description: formData.get("description") || null,
  };
}

export async function createMatter(_prev: MatterFormState, formData: FormData): Promise<MatterFormState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "matter.create");

  const parsed = matterSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const matterNumber = await nextMatterNumber(firmId);
  const data = parsed.data;

  const matter = await prisma.matter.create({
    data: {
      firmId,
      matterNumber,
      title: data.title,
      clientId: data.clientId || null,
      type: data.type,
      status: data.status,
      billingType: data.billingType,
      hourlyRate: data.hourlyRate ? data.hourlyRate : null,
      flatFee: data.flatFee ? data.flatFee : null,
      courtName: data.courtName,
      courtFileNo: data.courtFileNo,
      opposingParty: data.opposingParty,
      description: data.description,
      assignees: { create: { userId, role: "lead" } },
    },
  });

  await audit({
    firmId,
    actorId: userId,
    action: "matter.create",
    entityType: "matter",
    entityId: matter.id,
    diff: { matterNumber: matter.matterNumber, title: matter.title },
  });

  revalidatePath("/ops");
  redirect(`/ops/${matter.id}`);
}

export async function updateMatter(id: string, formData: FormData): Promise<MatterFormState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "matter.edit");

  const parsed = matterSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.matter.findFirst({ where: { id, firmId } });
  if (!existing) return { ok: false, error: "Dosya bulunamadı" };

  const data = parsed.data;
  await prisma.matter.update({
    where: { id },
    data: {
      title: data.title,
      clientId: data.clientId || null,
      type: data.type,
      status: data.status,
      billingType: data.billingType,
      hourlyRate: data.hourlyRate ?? null,
      flatFee: data.flatFee ?? null,
      courtName: data.courtName,
      courtFileNo: data.courtFileNo,
      opposingParty: data.opposingParty,
      description: data.description,
      closedAt:
        data.status === "CLOSED_WON" || data.status === "CLOSED_LOST"
          ? existing.closedAt ?? new Date()
          : null,
    },
  });

  await audit({
    firmId, actorId: userId, action: "matter.update", entityType: "matter", entityId: id,
  });
  revalidatePath("/ops");
  revalidatePath(`/ops/${id}`);
  return { ok: true };
}

export async function deleteMatter(id: string) {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "matter.delete");

  const existing = await prisma.matter.findFirst({ where: { id, firmId } });
  if (!existing) throw new Error("Dosya bulunamadı");

  await prisma.matter.delete({ where: { id } });
  await audit({
    firmId, actorId: userId, action: "matter.delete", entityType: "matter", entityId: id,
    diff: { matterNumber: existing.matterNumber },
  });
  revalidatePath("/ops");
  redirect("/ops");
}
