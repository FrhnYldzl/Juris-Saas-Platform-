"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";
import { sha256Hex } from "@/lib/paperclip-auth";

const KEY_PREFIX = "jpc";  // Juris Paperclip Key

const ALL_SCOPES = [
  "lead:read", "lead:write",
  "content:read", "content:draft",
  "analytics:read",
  "campaign:read", "campaign:write",
] as const;

type Scope = typeof ALL_SCOPES[number];

const createSchema = z.object({
  name:    z.string().min(2, "İsim en az 2 karakter").max(60),
  service: z.enum(["paperclip", "custom"]).default("paperclip"),
  scopes:  z.array(z.string()).default([]),
  expiresInDays: z.coerce.number().min(0).max(3650).optional().nullable(),
});

export type CreateKeyResult =
  | {
      ok: true;
      key: {
        id: string;
        name: string;
        prefix: string;
        plaintext: string;          // ⚠ shown ONCE in the modal — never returned again
        scopes: string[];
      };
    }
  | { ok: false; error: string };

/**
 * Create a new API key. The plaintext key is returned ONCE for the user to copy.
 * Only the SHA-256 hash is persisted; the plaintext cannot be recovered later.
 */
export async function createApiKey(
  _prev: CreateKeyResult | null,
  formData: FormData,
): Promise<CreateKeyResult> {
  try {
    const { firmId, userId, role } = await requireTenant();
    if (role !== "OWNER" && role !== "PARTNER") {
      return { ok: false, error: "API anahtarı oluşturmak için OWNER/PARTNER yetkisi gerekir" };
    }

    const scopesRaw = formData.getAll("scopes").map((v) => String(v));
    const parsed = createSchema.safeParse({
      name:    formData.get("name"),
      service: formData.get("service") || "paperclip",
      scopes:  scopesRaw.length > 0 ? scopesRaw : ALL_SCOPES,
      expiresInDays: formData.get("expiresInDays") || null,
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    // Filter scopes to known set
    const scopes = d.scopes.filter((s): s is Scope =>
      (ALL_SCOPES as readonly string[]).includes(s),
    );
    if (scopes.length === 0) {
      return { ok: false, error: "En az bir scope seçin" };
    }

    // Generate the plaintext key: prefix_<32 random bytes hex> (~70 chars total)
    const random = randomBytes(32).toString("hex");
    const plaintext = `${KEY_PREFIX}_${random}`;
    const prefix = plaintext.slice(0, 12);  // jpc_xxxxxxxx
    const keyHash = sha256Hex(plaintext);

    const expiresAt = d.expiresInDays && d.expiresInDays > 0
      ? new Date(Date.now() + d.expiresInDays * 86_400_000)
      : null;

    const created = await prisma.apiKey.create({
      data: {
        firmId,
        name:        d.name,
        prefix,
        keyHash,
        scopes,
        service:     d.service,
        expiresAt,
        createdById: userId,
      },
      select: { id: true, name: true, prefix: true, scopes: true },
    });

    await audit({
      firmId,
      actorId: userId,
      action: "api_key.create",
      entityType: "api_key",
      entityId: created.id,
      diff: { name: created.name, scopes: created.scopes, service: d.service },
    });

    revalidatePath("/settings/api");

    return {
      ok: true,
      key: {
        id:        created.id,
        name:      created.name,
        prefix:    created.prefix,
        plaintext,
        scopes:    created.scopes,
      },
    };
  } catch (err) {
    console.error("createApiKey error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

/**
 * Revoke an API key (soft-delete via revokedAt). The key is rejected from
 * future authentication immediately.
 */
export async function revokeApiKey(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { firmId, userId, role } = await requireTenant();
    if (role !== "OWNER" && role !== "PARTNER") {
      return { ok: false, error: "Yetki yok" };
    }

    const key = await prisma.apiKey.findFirst({
      where: { id, firmId },
      select: { id: true, name: true, revokedAt: true },
    });
    if (!key) return { ok: false, error: "Anahtar bulunamadı" };
    if (key.revokedAt) return { ok: false, error: "Anahtar zaten iptal edilmiş" };

    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await audit({
      firmId,
      actorId: userId,
      action: "api_key.revoke",
      entityType: "api_key",
      entityId: id,
      diff: { name: key.name },
    });

    revalidatePath("/settings/api");
    return { ok: true };
  } catch (err) {
    console.error("revokeApiKey error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}
