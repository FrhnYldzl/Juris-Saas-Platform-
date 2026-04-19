"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ContentChannel, ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";

const schema = z.object({
  title: z.string().min(2, "Başlık en az 2 karakter"),
  summary: z.string().optional().nullable(),
  channel: z.nativeEnum(ContentChannel).default(ContentChannel.BLOG),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.IDEA),
  author: z.string().optional().nullable(),
  publishAt: z.string().optional().nullable(),
  url: z.string().url().optional().or(z.literal("")).nullable(),
  tags: z.string().optional().nullable(),
});

export type ContentState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parse(formData: FormData) {
  const toStr = (v: FormDataEntryValue | null) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s : null;
  };
  return {
    title: String(formData.get("title") ?? "").trim(),
    summary: toStr(formData.get("summary")),
    channel: (formData.get("channel") as ContentChannel) ?? ContentChannel.BLOG,
    status: (formData.get("status") as ContentStatus) ?? ContentStatus.IDEA,
    author: toStr(formData.get("author")),
    publishAt: toStr(formData.get("publishAt")),
    url: toStr(formData.get("url")),
    tags: toStr(formData.get("tags")),
  };
}

export async function createContentItem(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const { firmId, userId, role } = await requireTenant();
  if (role === "CLIENT" || role === "PARALEGAL") return { ok: false, error: "Yetki yok" };

  const parsed = schema.safeParse(parse(formData));
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const tags = d.tags ? d.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const item = await prisma.contentItem.create({
    data: {
      firmId,
      title: d.title,
      summary: d.summary,
      channel: d.channel,
      status: d.status,
      author: d.author,
      publishAt: d.publishAt ? new Date(d.publishAt) : null,
      publishedAt: d.status === "PUBLISHED" ? new Date() : null,
      url: d.url || null,
      tags,
    },
  });

  await audit({
    firmId, actorId: userId,
    action: "content.create",
    entityType: "content", entityId: item.id,
    diff: { title: item.title, channel: item.channel },
  });

  revalidatePath("/marketing");
  redirect("/marketing");
}

export async function updateContentStatus(id: string, status: ContentStatus) {
  const { firmId, userId, role } = await requireTenant();
  if (role === "CLIENT" || role === "PARALEGAL") throw new Error("Yetki yok");

  const existing = await prisma.contentItem.findFirst({ where: { id, firmId } });
  if (!existing) throw new Error("İçerik bulunamadı");

  await prisma.contentItem.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });

  await audit({
    firmId, actorId: userId,
    action: `content.${status.toLowerCase()}`,
    entityType: "content", entityId: id,
  });
  revalidatePath("/marketing");
}

export async function deleteContentItem(id: string) {
  const { firmId, userId, role } = await requireTenant();
  if (role === "CLIENT" || role === "PARALEGAL") throw new Error("Yetki yok");

  const existing = await prisma.contentItem.findFirst({ where: { id, firmId } });
  if (!existing) throw new Error("İçerik bulunamadı");

  await prisma.contentItem.delete({ where: { id } });
  await audit({
    firmId, actorId: userId,
    action: "content.delete",
    entityType: "content", entityId: id,
    diff: { title: existing.title },
  });
  revalidatePath("/marketing");
}
