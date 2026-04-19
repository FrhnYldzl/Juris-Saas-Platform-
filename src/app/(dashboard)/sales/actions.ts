"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ContactType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { validateTCKNFormat } from "@/lib/integrations/providers/mernis";

const contactSchema = z
  .object({
    type: z.nativeEnum(ContactType).default(ContactType.INDIVIDUAL),
    name: z.string().min(2, "Ad en az 2 karakter olmalı"),
    companyName: z.string().optional().nullable(),
    email: z.string().email("Geçerli bir e-posta girin").optional().or(z.literal("")),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    taxNumber: z
      .string()
      .optional()
      .nullable()
      .refine((v) => !v || /^\d{10}$/.test(v), {
        message: "Vergi no 10 hane rakam olmalı",
      }),
    tcNumber: z
      .string()
      .optional()
      .nullable()
      .refine((v) => !v || validateTCKNFormat(v), { message: "Geçersiz TC Kimlik No" }),
    isClient: z.boolean().default(false),
    notes: z.string().optional().nullable(),
  })
  .refine((d) => d.type !== "COMPANY" || Boolean(d.companyName), {
    message: "Kurum adı zorunlu",
    path: ["companyName"],
  });

export type ContactFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseForm(formData: FormData) {
  const toStrOrNull = (v: FormDataEntryValue | null) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s : null;
  };
  return {
    type: (formData.get("type") as ContactType) ?? "INDIVIDUAL",
    name: String(formData.get("name") ?? "").trim(),
    companyName: toStrOrNull(formData.get("companyName")),
    email: toStrOrNull(formData.get("email")),
    phone: toStrOrNull(formData.get("phone")),
    address: toStrOrNull(formData.get("address")),
    taxNumber: toStrOrNull(formData.get("taxNumber")),
    tcNumber: toStrOrNull(formData.get("tcNumber")),
    isClient: formData.get("isClient") === "on" || formData.get("isClient") === "true",
    notes: toStrOrNull(formData.get("notes")),
  };
}

export async function createContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "lead.create");

  const parsed = contactSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const contact = await prisma.contact.create({
    data: {
      firmId,
      type: d.type,
      name: d.name,
      companyName: d.companyName,
      email: d.email || null,
      phone: d.phone,
      address: d.address,
      taxNumber: d.taxNumber,
      tcNumber: d.tcNumber,
      isClient: d.isClient,
      notes: d.notes,
    },
  });

  await audit({
    firmId, actorId: userId,
    action: "contact.create",
    entityType: "contact", entityId: contact.id,
    diff: { name: contact.name, type: contact.type },
  });

  revalidatePath("/sales");
  redirect(`/sales/${contact.id}`);
}

export async function updateContact(
  id: string,
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "lead.edit");

  const existing = await prisma.contact.findFirst({ where: { id, firmId } });
  if (!existing) return { ok: false, error: "Kayıt bulunamadı" };

  const parsed = contactSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  await prisma.contact.update({
    where: { id },
    data: {
      type: d.type,
      name: d.name,
      companyName: d.companyName,
      email: d.email || null,
      phone: d.phone,
      address: d.address,
      taxNumber: d.taxNumber,
      tcNumber: d.tcNumber,
      isClient: d.isClient,
      notes: d.notes,
    },
  });

  await audit({ firmId, actorId: userId, action: "contact.update", entityType: "contact", entityId: id });
  revalidatePath("/sales");
  revalidatePath(`/sales/${id}`);
  return { ok: true };
}

export async function deleteContact(id: string) {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "lead.delete");

  const existing = await prisma.contact.findFirst({ where: { id, firmId } });
  if (!existing) throw new Error("Kayıt bulunamadı");

  // Safety: don't delete if linked to matters / invoices
  const [matters, invoices] = await Promise.all([
    prisma.matter.count({ where: { clientId: id, firmId } }),
    prisma.invoice.count({ where: { clientId: id, firmId } }),
  ]);
  if (matters > 0 || invoices > 0) {
    throw new Error(
      `Bu kişiye bağlı ${matters} dosya ve ${invoices} fatura var. Önce onları silin veya başka kişiye taşıyın.`,
    );
  }

  await prisma.contact.delete({ where: { id } });
  await audit({
    firmId, actorId: userId, action: "contact.delete",
    entityType: "contact", entityId: id, diff: { name: existing.name },
  });
  revalidatePath("/sales");
  redirect("/sales");
}
