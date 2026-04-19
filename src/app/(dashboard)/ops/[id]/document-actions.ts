"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { getStorage, ALLOWED_DOC_TYPES, MAX_DOC_BYTES, categorizeDoc } from "@/lib/storage";

export type DocUploadState = {
  ok: boolean;
  error?: string;
  uploaded?: { name: string; size: number };
};

export async function uploadDocument(
  _prev: DocUploadState,
  formData: FormData,
): Promise<DocUploadState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "document.upload");

  const matterId = String(formData.get("matterId") ?? "");
  const file = formData.get("file");

  if (!matterId) return { ok: false, error: "Dosya (matter) ID eksik" };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Dosya seçilmedi" };
  }
  if (file.size > MAX_DOC_BYTES) {
    return { ok: false, error: `Dosya çok büyük (max ${MAX_DOC_BYTES / 1024 / 1024} MB)` };
  }
  if (!ALLOWED_DOC_TYPES.has(file.type)) {
    return { ok: false, error: `Desteklenmeyen dosya türü: ${file.type}` };
  }

  const matter = await prisma.matter.findFirst({ where: { id: matterId, firmId } });
  if (!matter) return { ok: false, error: "Dosya bulunamadı" };

  // Create DB row first (to get id for storage key), then write file, then update storageKey
  const doc = await prisma.document.create({
    data: {
      firmId,
      matterId,
      uploaderId: userId,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      storageKey: "pending",
      category: categorizeDoc(file.name),
    },
  });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const storage = getStorage();
    const { storageKey } = await storage.put({
      firmId,
      documentId: doc.id,
      filename: file.name,
      contentType: file.type,
      bytes,
    });

    await prisma.document.update({
      where: { id: doc.id },
      data: { storageKey },
    });

    await audit({
      firmId, actorId: userId,
      action: "document.upload",
      entityType: "document", entityId: doc.id,
      diff: { name: file.name, size: file.size, matterId },
    });

    revalidatePath(`/ops/${matterId}`);
    return { ok: true, uploaded: { name: file.name, size: file.size } };
  } catch (err) {
    // Rollback the DB row if storage failed
    await prisma.document.delete({ where: { id: doc.id } }).catch(() => {});
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Yükleme başarısız",
    };
  }
}

export async function deleteDocument(id: string, matterId: string) {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "document.delete");

  const doc = await prisma.document.findFirst({ where: { id, firmId } });
  if (!doc) throw new Error("Belge bulunamadı");

  try {
    await getStorage().delete(doc.storageKey);
  } catch {
    // If file is missing we still delete the row
  }

  await prisma.document.delete({ where: { id } });
  await audit({
    firmId, actorId: userId,
    action: "document.delete",
    entityType: "document", entityId: id,
    diff: { name: doc.name },
  });
  revalidatePath(`/ops/${matterId}`);
}
