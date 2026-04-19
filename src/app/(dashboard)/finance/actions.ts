"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const itemSchema = z.object({
  description: z.string().min(1, "Açıklama zorunlu"),
  quantity: z.coerce.number().positive("Miktar > 0 olmalı"),
  unitPrice: z.coerce.number().nonnegative("Birim fiyat ≥ 0 olmalı"),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Müvekkil seçilmeli"),
  matterId: z.string().optional().nullable(),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.DRAFT),
  issuedAt: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  currency: z.string().default("TRY"),
  notes: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, "En az 1 satır kalemi gerekli"),
});

export type InvoiceFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function nextInvoiceNumber(firmId: string) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { firmId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const lastSeq = last ? parseInt(last.invoiceNumber.slice(prefix.length), 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

function parseForm(formData: FormData) {
  // Line items serialized as JSON string by the client form
  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    items = [];
  }

  const toStr = (v: FormDataEntryValue | null) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s : null;
  };

  return {
    clientId: String(formData.get("clientId") ?? ""),
    matterId: toStr(formData.get("matterId")),
    status: (formData.get("status") as InvoiceStatus) ?? InvoiceStatus.DRAFT,
    issuedAt: toStr(formData.get("issuedAt")),
    dueAt: toStr(formData.get("dueAt")),
    taxRate: formData.get("taxRate") ?? 20,
    currency: String(formData.get("currency") ?? "TRY"),
    notes: toStr(formData.get("notes")),
    items,
  };
}

function computeTotals(items: { quantity: number; unitPrice: number }[], taxRate: number) {
  const subtotal = items.reduce(
    (s, it) => s + Number(it.quantity) * Number(it.unitPrice),
    0,
  );
  const tax = +(subtotal * (taxRate / 100)).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), tax, total };
}

export async function createInvoice(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "invoice.create");

  const parsed = invoiceSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const totals = computeTotals(d.items, d.taxRate);
  const invoiceNumber = await nextInvoiceNumber(firmId);

  const invoice = await prisma.invoice.create({
    data: {
      firmId,
      clientId: d.clientId,
      matterId: d.matterId,
      invoiceNumber,
      status: d.status,
      issuedAt: d.issuedAt ? new Date(d.issuedAt) : new Date(),
      dueAt: d.dueAt ? new Date(d.dueAt) : null,
      subtotal: totals.subtotal,
      taxRate: d.taxRate,
      tax: totals.tax,
      total: totals.total,
      currency: d.currency,
      notes: d.notes,
      items: {
        create: d.items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: +(it.quantity * it.unitPrice).toFixed(2),
        })),
      },
    },
  });

  await audit({
    firmId, actorId: userId,
    action: "invoice.create",
    entityType: "invoice", entityId: invoice.id,
    diff: { invoiceNumber, total: totals.total, status: d.status },
  });

  revalidatePath("/finance");
  redirect(`/finance/${invoice.id}`);
}

export async function markInvoiceStatus(id: string, status: InvoiceStatus) {
  const { firmId, userId, role } = await requireTenant();
  // invoice.send for SENT transitions; invoice.create covers edits from other states
  requirePermission(role, status === "SENT" ? "invoice.send" : "invoice.create");

  const existing = await prisma.invoice.findFirst({ where: { id, firmId } });
  if (!existing) throw new Error("Fatura bulunamadı");

  await prisma.invoice.update({
    where: { id },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : existing.paidAt,
    },
  });

  await audit({
    firmId, actorId: userId,
    action: `invoice.${status.toLowerCase()}`,
    entityType: "invoice", entityId: id,
    diff: { from: existing.status, to: status },
  });

  revalidatePath("/finance");
  revalidatePath(`/finance/${id}`);
}

export async function deleteInvoice(id: string) {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "invoice.delete");

  const existing = await prisma.invoice.findFirst({ where: { id, firmId } });
  if (!existing) throw new Error("Fatura bulunamadı");
  if (existing.status === "PAID") {
    throw new Error("Ödenmiş fatura silinemez, iptal statüsüne alın.");
  }

  await prisma.invoice.delete({ where: { id } });
  await audit({
    firmId, actorId: userId,
    action: "invoice.delete",
    entityType: "invoice", entityId: id,
    diff: { invoiceNumber: existing.invoiceNumber },
  });
  revalidatePath("/finance");
  redirect("/finance");
}
