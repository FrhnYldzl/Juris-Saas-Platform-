"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const inviteSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  name: z.string().min(2, "İsim en az 2 karakter"),
  title: z.string().optional().nullable(),
  role: z.nativeEnum(UserRole).default(UserRole.ASSOCIATE)
    .refine((r) => r !== "CLIENT", { message: "Müvekkiller Satış bölümünden eklenir" }),
  tempPassword: z
    .string()
    .optional()
    .nullable(),
});

export type InviteState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  invited?: { email: string; tempPassword?: string };
};

export async function inviteMember(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const { firmId, userId, role: myRole } = await requireTenant();
  requirePermission(myRole, "user.invite");

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    title: formData.get("title") || null,
    role: formData.get("role") ?? UserRole.ASSOCIATE,
    tempPassword: formData.get("tempPassword") || null,
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const email = d.email.toLowerCase();

  // OWNER rolünü sadece mevcut OWNER atayabilir
  if (d.role === "OWNER" && myRole !== "OWNER") {
    return { ok: false, error: "Sadece Kurucu Ortak başka bir Kurucu Ortak atayabilir." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: `${email} zaten kayıtlı.` };
  }

  // Generate a random temp password if not provided
  const tempPassword =
    d.tempPassword && d.tempPassword.length >= 8
      ? d.tempPassword
      : Math.random().toString(36).slice(2, 10) + "!" + Math.floor(Math.random() * 1000);

  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.create({
    data: {
      email,
      name: d.name,
      title: d.title,
      role: d.role,
      firmId,
      passwordHash,
      active: true,
    },
  });

  await audit({
    firmId, actorId: userId,
    action: "user.invite",
    entityType: "user",
    diff: { email, role: d.role },
  });

  revalidatePath("/people");
  return {
    ok: true,
    invited: { email, tempPassword },
  };
}

export async function toggleMemberActive(id: string) {
  const { firmId, userId, role: myRole } = await requireTenant();
  requirePermission(myRole, "user.edit");

  const target = await prisma.user.findFirst({ where: { id, firmId } });
  if (!target) throw new Error("Üye bulunamadı");
  if (target.id === userId) throw new Error("Kendinizi pasifleştiremezsiniz");
  if (target.role === "OWNER" && myRole !== "OWNER") {
    throw new Error("Kurucu Ortak rolünü sadece başka bir Kurucu Ortak değiştirebilir");
  }

  await prisma.user.update({ where: { id }, data: { active: !target.active } });
  await audit({
    firmId, actorId: userId,
    action: target.active ? "user.deactivate" : "user.activate",
    entityType: "user", entityId: id,
  });
  revalidatePath("/people");
}
