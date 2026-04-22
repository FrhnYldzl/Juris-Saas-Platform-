"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";

const FirmInfoSchema = z.object({
  name:      z.string().min(2, "Firma adı en az 2 karakter"),
  taxNumber: z.string().max(20).optional().nullable(),
  email:     z.string().email("Geçerli e-posta girin").optional().or(z.literal("")),
  phone:     z.string().max(32).optional().nullable(),
  website:   z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  address:   z.string().max(500).optional().nullable(),
});

export type FirmFormState =
  | { ok: true; message: string }
  | { ok: false; errors: Partial<Record<keyof z.infer<typeof FirmInfoSchema>, string>>; message?: string }
  | null;

export async function updateFirmInfo(
  _prev: FirmFormState,
  formData: FormData,
): Promise<FirmFormState> {
  try {
    const { firmId, role } = await requireTenant();
    if (role !== "OWNER" && role !== "PARTNER") {
      return { ok: false, errors: {}, message: "Yetkiniz yok" };
    }

    const parsed = FirmInfoSchema.safeParse({
      name:      formData.get("name"),
      taxNumber: formData.get("taxNumber") || null,
      email:     formData.get("email") || "",
      phone:     formData.get("phone") || null,
      website:   formData.get("website") || "",
      address:   formData.get("address") || null,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as string;
        if (!errors[k]) errors[k] = issue.message;
      }
      return { ok: false, errors, message: "Lütfen hataları düzelt" };
    }

    const d = parsed.data;
    await prisma.firm.update({
      where: { id: firmId },
      data: {
        name:      d.name,
        taxNumber: d.taxNumber || null,
        email:     d.email || null,
        phone:     d.phone || null,
        website:   d.website || null,
        address:   d.address || null,
      },
    });

    revalidatePath("/settings");
    return { ok: true, message: "Firma bilgileri güncellendi" };
  } catch (err) {
    console.error("updateFirmInfo error:", err);
    return { ok: false, errors: {}, message: "Bir hata oluştu" };
  }
}
