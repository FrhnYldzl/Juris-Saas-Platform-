"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ContentChannel, ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";

// ──────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────

const planSchema = z.object({
  title:           z.string().min(2, "Başlık en az 2 karakter"),
  contentType:     z.string().min(2, "İçerik türü seçin"),
  channel:         z.nativeEnum(ContentChannel),
  summary:         z.string().optional().nullable(),
  keywords:        z.string().optional().nullable(),      // "kvkk, 2026, uyum" comma list
  metaTitle:       z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(180).optional().nullable(),
  readMinutes:     z.coerce.number().min(0).max(120).optional().nullable(),
  publishAt:       z.string().optional().nullable(),
  author:          z.string().optional().nullable(),
  tags:            z.string().optional().nullable(),      // comma list
});

const draftSchema = z.object({
  body:         z.string().min(0),       // empty draft OK — autosave
  draftVersion: z.coerce.number().optional().nullable(),
  aiAssisted:   z.coerce.boolean().optional().nullable(),
});

const scheduleSchema = z.object({
  publishAt: z.string().min(4, "Tarih gerekli"),
});

const metricsSchema = z.object({
  viewCount:     z.coerce.number().min(0).optional(),
  leadCount:     z.coerce.number().min(0).optional(),
  engagementPct: z.coerce.number().min(0).max(100).optional(),
  seoRank:       z.coerce.number().min(0).max(200).optional(),
  backlinks:     z.coerce.number().min(0).optional(),
  url:           z.string().url().optional().or(z.literal("")).nullable(),
});

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export type StageState =
  | { ok: true; message: string }
  | { ok: false; message?: string; errors?: Record<string, string> }
  | null;

function flatten<T>(err: z.ZodError<T>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path[0] as string;
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

async function ensureWritable(id: string) {
  const { firmId, role } = await requireTenant();
  if (role === "CLIENT" || role === "PARALEGAL") {
    throw new Error("Yetki yok");
  }
  const item = await prisma.contentItem.findFirst({ where: { id, firmId } });
  if (!item) throw new Error("İçerik bulunamadı");
  return { firmId, item };
}

// ──────────────────────────────────────────
// Stage 1 — PLANLAMA  (IDEA → DRAFT)
// ──────────────────────────────────────────

export async function savePlan(
  id: string,
  _prev: StageState,
  formData: FormData,
): Promise<StageState> {
  try {
    const { firmId, item } = await ensureWritable(id);
    const { userId } = await requireTenant();

    const parsed = planSchema.safeParse({
      title:           formData.get("title"),
      contentType:     formData.get("contentType"),
      channel:         formData.get("channel"),
      summary:         formData.get("summary") || null,
      keywords:        formData.get("keywords") || null,
      metaTitle:       formData.get("metaTitle") || null,
      metaDescription: formData.get("metaDescription") || null,
      readMinutes:     formData.get("readMinutes") || null,
      publishAt:       formData.get("publishAt") || null,
      author:          formData.get("author") || null,
      tags:            formData.get("tags") || null,
    });

    if (!parsed.success) {
      return { ok: false, errors: flatten(parsed.error), message: "Eksik alanlar var" };
    }

    const d = parsed.data;
    const keywords = d.keywords ? d.keywords.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const tags     = d.tags     ? d.tags.split(",").map((s) => s.trim()).filter(Boolean)     : [];

    // If still IDEA, move to DRAFT on plan save (we consider 'planned' = ready to draft)
    const nextStatus = item.status === "IDEA" ? "DRAFT" : item.status;

    await prisma.contentItem.update({
      where: { id },
      data: {
        title:           d.title,
        contentType:     d.contentType,
        channel:         d.channel,
        summary:         d.summary,
        keywords,
        metaTitle:       d.metaTitle,
        metaDescription: d.metaDescription,
        readMinutes:     d.readMinutes ?? null,
        author:          d.author,
        publishAt:       d.publishAt ? new Date(d.publishAt) : null,
        tags,
        status:          nextStatus,
      },
    });

    await audit({
      firmId, actorId: userId,
      action: "content.plan", entityType: "content", entityId: id,
      diff: { title: d.title, channel: d.channel, contentType: d.contentType },
    });

    revalidatePath(`/marketing/${id}`);
    revalidatePath("/marketing");
    return { ok: true, message: "Plan kaydedildi — üretim aşamasına geçtiniz" };
  } catch (err) {
    console.error("savePlan error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}

// ──────────────────────────────────────────
// Stage 2 — ÜRETİM  (draft editor autosave)
// ──────────────────────────────────────────

export async function saveDraft(
  id: string,
  _prev: StageState,
  formData: FormData,
): Promise<StageState> {
  try {
    const { firmId, item } = await ensureWritable(id);
    const { userId } = await requireTenant();

    const parsed = draftSchema.safeParse({
      body:         formData.get("body") ?? "",
      draftVersion: formData.get("draftVersion") ?? null,
      aiAssisted:   formData.get("aiAssisted") === "true" ? true : null,
    });
    if (!parsed.success) {
      return { ok: false, errors: flatten(parsed.error) };
    }

    await prisma.contentItem.update({
      where: { id },
      data: {
        body:         parsed.data.body,
        draftVersion: parsed.data.draftVersion ?? (item.draftVersion ?? 1),
        aiAssisted:   parsed.data.aiAssisted ?? item.aiAssisted,
        status:       item.status === "IDEA" ? "DRAFT" : item.status,
      },
    });

    await audit({
      firmId, actorId: userId,
      action: "content.draft", entityType: "content", entityId: id,
    });

    revalidatePath(`/marketing/${id}`);
    return { ok: true, message: "Taslak kaydedildi" };
  } catch (err) {
    console.error("saveDraft error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}

// AI-assisted draft: use the plan brief + keywords to generate a starter body.
// This is a heuristic placeholder — wiring to the real AI provider layer is a follow-up.
export async function aiGenerateDraft(id: string): Promise<StageState> {
  try {
    const { firmId, item } = await ensureWritable(id);
    const { userId } = await requireTenant();

    const sections: string[] = [];
    if (item.metaTitle || item.title) sections.push(`# ${item.metaTitle ?? item.title}\n`);
    if (item.summary) sections.push(`## Özet\n\n${item.summary}\n`);
    sections.push(`## Giriş\n\n${item.title} konusunda kısa bir giriş: sektörde neden önemli, kimleri etkiliyor, mevcut mevzuat ne diyor.\n`);
    sections.push(`## Mevzuat ve Referans Çerçeve\n\n- 6698 sayılı KVKK / 6102 sayılı TTK / ilgili yönetmelik\n- Kurul kararları, Yargıtay kararları\n- Sektörel rehberlikler (KVKK, Kurul Rehberi)\n`);
    sections.push(`## Pratik Kontrol Listesi\n\n1. Envanter\n2. Politika & aydınlatma\n3. Çalışan eğitimi\n4. İç denetim\n5. Dökümantasyon\n`);
    sections.push(`## Sonuç\n\nKısa bir kapanış + müvekkile yönelik eylem çağrısı. Juris ekibi danışmanlık sağlar.`);
    if ((item.keywords ?? []).length > 0) {
      sections.push(`\n---\n\n*Anahtar sözcükler: ${(item.keywords ?? []).join(", ")}*`);
    }

    const body = sections.join("\n");

    await prisma.contentItem.update({
      where: { id },
      data: {
        body,
        aiAssisted: true,
        draftVersion: (item.draftVersion ?? 0) + 1,
        status: item.status === "IDEA" ? "DRAFT" : item.status,
      },
    });

    await audit({
      firmId, actorId: userId,
      action: "content.ai_draft", entityType: "content", entityId: id,
    });

    revalidatePath(`/marketing/${id}`);
    return { ok: true, message: "AI taslak oluşturuldu — düzenleyip geliştirebilirsiniz" };
  } catch (err) {
    console.error("aiGenerateDraft error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}

// ──────────────────────────────────────────
// Stage 4 — ONAY  (DRAFT → REVIEW → APPROVED/REJECTED)
// ──────────────────────────────────────────

export async function requestReview(id: string): Promise<StageState> {
  try {
    const { firmId, item } = await ensureWritable(id);
    const { userId } = await requireTenant();

    if (!item.body || item.body.length < 50) {
      return { ok: false, message: "Onaya göndermeden önce taslağı en az 50 karakter doldurun" };
    }

    await prisma.contentItem.update({
      where: { id },
      data: { status: "REVIEW" },
    });

    await audit({
      firmId, actorId: userId,
      action: "content.request_review", entityType: "content", entityId: id,
    });

    revalidatePath(`/marketing/${id}`);
    revalidatePath("/marketing");
    return { ok: true, message: "İnceleme talebi gönderildi" };
  } catch (err) {
    console.error("requestReview error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}

export async function approveContent(id: string): Promise<StageState> {
  try {
    const { firmId, item } = await ensureWritable(id);
    const { userId, role } = await requireTenant();
    if (role !== "OWNER" && role !== "PARTNER") {
      return { ok: false, message: "Onay yalnızca OWNER/PARTNER yetkisiyle" };
    }
    // Approved = ready to schedule. If publishAt already set and in the past → PUBLISH.
    // Otherwise → SCHEDULED (awaiting publishAt).
    const nextStatus: ContentStatus = item.publishAt && item.publishAt <= new Date()
      ? "PUBLISHED" : "SCHEDULED";

    await prisma.contentItem.update({
      where: { id },
      data: {
        status: nextStatus,
        publishedAt: nextStatus === "PUBLISHED" ? new Date() : null,
      },
    });
    await audit({
      firmId, actorId: userId,
      action: "content.approve", entityType: "content", entityId: id,
      diff: { transitionedTo: nextStatus },
    });
    revalidatePath(`/marketing/${id}`);
    revalidatePath("/marketing");
    return { ok: true, message: nextStatus === "PUBLISHED" ? "Onaylandı ve yayımlandı" : "Onaylandı — yayım planında" };
  } catch (err) {
    console.error("approveContent error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}

export async function rejectContent(id: string, reason: string): Promise<StageState> {
  try {
    const { firmId } = await ensureWritable(id);
    const { userId, role } = await requireTenant();
    if (role !== "OWNER" && role !== "PARTNER") {
      return { ok: false, message: "Yalnızca ortaklar reddedebilir" };
    }

    await prisma.contentItem.update({
      where: { id },
      data: { status: "DRAFT" },
    });
    await audit({
      firmId, actorId: userId,
      action: "content.reject", entityType: "content", entityId: id,
      diff: { reason },
    });
    revalidatePath(`/marketing/${id}`);
    return { ok: true, message: "İade edildi — taslağa geri alındı" };
  } catch (err) {
    console.error("rejectContent error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}

// ──────────────────────────────────────────
// Stage 5 — YAYIM  (SCHEDULED → PUBLISHED)
// ──────────────────────────────────────────

export async function schedulePublish(
  id: string,
  _prev: StageState,
  formData: FormData,
): Promise<StageState> {
  try {
    const { firmId } = await ensureWritable(id);
    const { userId } = await requireTenant();

    const parsed = scheduleSchema.safeParse({ publishAt: formData.get("publishAt") });
    if (!parsed.success) {
      return { ok: false, errors: flatten(parsed.error) };
    }

    const when = new Date(parsed.data.publishAt);
    await prisma.contentItem.update({
      where: { id },
      data: { publishAt: when, status: "SCHEDULED" },
    });
    await audit({
      firmId, actorId: userId,
      action: "content.schedule", entityType: "content", entityId: id,
      diff: { publishAt: when.toISOString() },
    });
    revalidatePath(`/marketing/${id}`);
    revalidatePath("/marketing");
    return { ok: true, message: "Yayım planlandı" };
  } catch (err) {
    console.error("schedulePublish error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}

export async function publishNow(id: string): Promise<StageState> {
  try {
    const { firmId } = await ensureWritable(id);
    const { userId } = await requireTenant();
    await prisma.contentItem.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await audit({
      firmId, actorId: userId,
      action: "content.publish", entityType: "content", entityId: id,
    });
    revalidatePath(`/marketing/${id}`);
    revalidatePath("/marketing");
    return { ok: true, message: "İçerik yayımlandı" };
  } catch (err) {
    console.error("publishNow error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}

// ──────────────────────────────────────────
// Stage 6 — ÖLÇÜM
// ──────────────────────────────────────────

export async function saveMetrics(
  id: string,
  _prev: StageState,
  formData: FormData,
): Promise<StageState> {
  try {
    const { firmId } = await ensureWritable(id);
    const { userId } = await requireTenant();

    const parsed = metricsSchema.safeParse({
      viewCount:     formData.get("viewCount") || 0,
      leadCount:     formData.get("leadCount") || 0,
      engagementPct: formData.get("engagementPct") || 0,
      seoRank:       formData.get("seoRank") || 0,
      backlinks:     formData.get("backlinks") || 0,
      url:           formData.get("url") || null,
    });
    if (!parsed.success) {
      return { ok: false, errors: flatten(parsed.error) };
    }

    const d = parsed.data;
    await prisma.contentItem.update({
      where: { id },
      data: {
        viewCount:     d.viewCount     ?? 0,
        leadCount:     d.leadCount     ?? 0,
        engagementPct: d.engagementPct ?? null,
        seoRank:       d.seoRank       ?? null,
        backlinks:     d.backlinks     ?? 0,
        url:           d.url || null,
      },
    });
    await audit({
      firmId, actorId: userId,
      action: "content.metrics", entityType: "content", entityId: id,
      diff: d as unknown as Record<string, unknown>,
    });
    revalidatePath(`/marketing/${id}`);
    return { ok: true, message: "Performans güncellendi" };
  } catch (err) {
    console.error("saveMetrics error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}

// Helper: create an empty content item so the user can enter the workflow from scratch
export async function createEmptyDraft(opts?: {
  title?: string;
  channel?: ContentChannel;
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  try {
    const { firmId, userId, role } = await requireTenant();
    if (role === "CLIENT" || role === "PARALEGAL") {
      return { ok: false, message: "Yetki yok" };
    }

    const item = await prisma.contentItem.create({
      data: {
        firmId,
        title:   opts?.title   ?? "İsimsiz taslak",
        channel: opts?.channel ?? ContentChannel.BLOG,
        status:  ContentStatus.IDEA,
        author:  null,
      },
    });

    await audit({
      firmId, actorId: userId,
      action: "content.create_empty", entityType: "content", entityId: item.id,
    });

    revalidatePath("/marketing");
    return { ok: true, id: item.id };
  } catch (err) {
    console.error("createEmptyDraft error:", err);
    return { ok: false, message: err instanceof Error ? err.message : "Bir hata oluştu" };
  }
}
