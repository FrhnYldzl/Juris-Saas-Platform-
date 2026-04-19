"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LeadStage, MatterType, MatterStatus, BillingType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const leadSchema = z.object({
  title: z.string().min(2, "Başlık en az 2 karakter olmalı"),
  contactId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  stage: z.nativeEnum(LeadStage).default(LeadStage.NEW),
  value: z.coerce.number().optional().nullable(),
  probability: z.coerce.number().int().min(0).max(100).default(20),
  expectedCloseAt: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type LeadFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseForm(formData: FormData) {
  const toStr = (v: FormDataEntryValue | null) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s : null;
  };
  return {
    title: String(formData.get("title") ?? "").trim(),
    contactId: toStr(formData.get("contactId")),
    ownerId: toStr(formData.get("ownerId")),
    source: toStr(formData.get("source")),
    stage: (formData.get("stage") as LeadStage) ?? LeadStage.NEW,
    value: toStr(formData.get("value")),
    probability: formData.get("probability") ?? 20,
    expectedCloseAt: toStr(formData.get("expectedCloseAt")),
    description: toStr(formData.get("description")),
  };
}

export async function createLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "lead.create");

  const parsed = leadSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const lead = await prisma.lead.create({
    data: {
      firmId,
      title: d.title,
      contactId: d.contactId,
      ownerId: d.ownerId ?? userId,
      source: d.source,
      stage: d.stage,
      value: d.value ?? null,
      probability: d.probability,
      expectedCloseAt: d.expectedCloseAt ? new Date(d.expectedCloseAt) : null,
      description: d.description,
    },
  });

  await audit({
    firmId, actorId: userId,
    action: "lead.create", entityType: "lead", entityId: lead.id,
    diff: { title: lead.title, stage: lead.stage },
  });

  revalidatePath("/bd");
  redirect(`/bd/${lead.id}`);
}

export async function updateLead(
  id: string,
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "lead.edit");

  const existing = await prisma.lead.findFirst({ where: { id, firmId } });
  if (!existing) return { ok: false, error: "Fırsat bulunamadı" };

  const parsed = leadSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  await prisma.lead.update({
    where: { id },
    data: {
      title: d.title,
      contactId: d.contactId,
      ownerId: d.ownerId,
      source: d.source,
      stage: d.stage,
      value: d.value ?? null,
      probability: d.probability,
      expectedCloseAt: d.expectedCloseAt ? new Date(d.expectedCloseAt) : null,
      description: d.description,
    },
  });

  await audit({ firmId, actorId: userId, action: "lead.update", entityType: "lead", entityId: id });
  revalidatePath("/bd");
  revalidatePath(`/bd/${id}`);
  return { ok: true };
}

export async function deleteLead(id: string) {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "lead.delete");
  const existing = await prisma.lead.findFirst({ where: { id, firmId } });
  if (!existing) throw new Error("Fırsat bulunamadı");

  await prisma.lead.delete({ where: { id } });
  await audit({
    firmId, actorId: userId, action: "lead.delete",
    entityType: "lead", entityId: id, diff: { title: existing.title },
  });
  revalidatePath("/bd");
  redirect("/bd");
}

// -------------- Convert to Matter --------------

const convertSchema = z.object({
  matterTitle: z.string().min(2),
  matterType: z.nativeEnum(MatterType).default(MatterType.CONSULTING),
  billingType: z.nativeEnum(BillingType).default(BillingType.HOURLY),
  hourlyRate: z.coerce.number().optional().nullable(),
  flatFee: z.coerce.number().optional().nullable(),
  ensureClient: z.boolean().default(true),
});

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

export type ConvertState = LeadFormState & { matterId?: string };

export async function convertLeadToMatter(
  leadId: string,
  _prev: ConvertState,
  formData: FormData,
): Promise<ConvertState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "matter.create");

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, firmId },
    include: { contact: true },
  });
  if (!lead) return { ok: false, error: "Fırsat bulunamadı" };

  const parsed = convertSchema.safeParse({
    matterTitle: formData.get("matterTitle"),
    matterType: formData.get("matterType"),
    billingType: formData.get("billingType"),
    hourlyRate: formData.get("hourlyRate") || null,
    flatFee: formData.get("flatFee") || null,
    ensureClient: formData.get("ensureClient") === "on",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const matterNumber = await nextMatterNumber(firmId);

  // Ensure the linked contact is flagged as a client
  if (lead.contact && d.ensureClient && !lead.contact.isClient) {
    await prisma.contact.update({
      where: { id: lead.contact.id },
      data: { isClient: true },
    });
  }

  const matter = await prisma.matter.create({
    data: {
      firmId,
      matterNumber,
      title: d.matterTitle,
      clientId: lead.contactId,
      type: d.matterType,
      status: MatterStatus.ACTIVE,
      billingType: d.billingType,
      hourlyRate: d.hourlyRate ?? null,
      flatFee: d.flatFee ?? null,
      description: lead.description,
      assignees: { create: { userId: lead.ownerId ?? userId, role: "lead" } },
    },
  });

  // Mark lead as WON + link via description (no FK; lose history intentionally)
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage: LeadStage.WON,
      description: (lead.description ?? "") + `\n\n[Dönüştürüldü → Dosya ${matterNumber}]`,
    },
  });

  await audit({
    firmId, actorId: userId,
    action: "lead.convert_to_matter",
    entityType: "matter", entityId: matter.id,
    diff: { fromLeadId: leadId, matterNumber },
  });

  revalidatePath("/bd");
  revalidatePath("/ops");
  redirect(`/ops/${matter.id}`);
}
