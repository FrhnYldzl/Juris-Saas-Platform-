import { z } from "zod";
import { ContentChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withPaperclip, paperclipOk, paperclipError } from "@/lib/paperclip-auth";
import { serializePost } from "../_serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────
// PATCH /api/paperclip/content/posts/[id]
//
// Edit a DRAFT (or IDEA) post. Posts that have been promoted to REVIEW,
// SCHEDULED, PUBLISHED or ARCHIVED CANNOT be edited via Paperclip — those
// transitions go through the in-app workflow + board approval.
//
// Body: any subset of the fields below. Status changes are limited to
// IDEA <-> DRAFT only.
// ─────────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  title:           z.string().min(2).optional(),
  summary:         z.string().nullable().optional(),
  body:            z.string().nullable().optional(),
  channel:         z.nativeEnum(ContentChannel).optional(),
  contentType:     z.string().nullable().optional(),
  author:          z.string().nullable().optional(),
  publishAt:       z.string().datetime().nullable().optional(),
  url:             z.string().url().or(z.literal("")).nullable().optional(),
  tags:            z.array(z.string()).optional(),
  keywords:        z.array(z.string()).optional(),
  metaTitle:       z.string().max(70).nullable().optional(),
  metaDescription: z.string().max(180).nullable().optional(),
  readMinutes:     z.coerce.number().min(0).max(120).nullable().optional(),
  aiAssisted:      z.boolean().optional(),
  status:          z.enum(["IDEA", "DRAFT"]).optional(),
});

const EDITABLE_STATUSES = new Set(["IDEA", "DRAFT"]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withPaperclip<unknown>(req, "content:draft", async ({ ctx, body }) => {
    const existing = await prisma.contentItem.findFirst({
      where: { id, firmId: ctx.firmId },
    });
    if (!existing) {
      return paperclipError(404, "not_found", `Post ${id} not found`);
    }

    if (!EDITABLE_STATUSES.has(existing.status)) {
      return paperclipError(
        409, "post_locked",
        `Post is in ${existing.status} state — only IDEA / DRAFT posts are editable via Paperclip. Use the in-app workflow.`,
      );
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return paperclipError(
        400, "validation_error",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      );
    }
    const d = parsed.data;

    const updated = await prisma.contentItem.update({
      where: { id },
      data: {
        ...(d.title !== undefined           ? { title: d.title } : {}),
        ...(d.summary !== undefined         ? { summary: d.summary } : {}),
        ...(d.body !== undefined            ? { body: d.body } : {}),
        ...(d.channel !== undefined         ? { channel: d.channel } : {}),
        ...(d.contentType !== undefined     ? { contentType: d.contentType } : {}),
        ...(d.author !== undefined          ? { author: d.author } : {}),
        ...(d.publishAt !== undefined       ? { publishAt: d.publishAt ? new Date(d.publishAt) : null } : {}),
        ...(d.url !== undefined             ? { url: d.url || null } : {}),
        ...(d.tags !== undefined            ? { tags: d.tags } : {}),
        ...(d.keywords !== undefined        ? { keywords: d.keywords } : {}),
        ...(d.metaTitle !== undefined       ? { metaTitle: d.metaTitle } : {}),
        ...(d.metaDescription !== undefined ? { metaDescription: d.metaDescription } : {}),
        ...(d.readMinutes !== undefined     ? { readMinutes: d.readMinutes } : {}),
        ...(d.aiAssisted !== undefined      ? { aiAssisted: d.aiAssisted } : {}),
        ...(d.status !== undefined          ? { status: d.status } : {}),
      },
      select: {
        id: true, title: true, summary: true, channel: true, status: true,
        author: true, contentType: true, publishAt: true, publishedAt: true,
        url: true, tags: true, keywords: true, metaTitle: true,
        metaDescription: true, readMinutes: true, viewCount: true,
        leadCount: true, engagementPct: true, seoRank: true, backlinks: true,
        aiAssisted: true, draftVersion: true,
        createdAt: true, updatedAt: true,
      },
    });

    return paperclipOk({ data: serializePost(updated) });
  });
}

// GET /api/paperclip/content/posts/[id] — single post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withPaperclip(req, "content:read", async ({ ctx }) => {
    const post = await prisma.contentItem.findFirst({
      where: { id, firmId: ctx.firmId },
      select: {
        id: true, title: true, summary: true, body: true, channel: true,
        status: true, author: true, contentType: true, publishAt: true,
        publishedAt: true, url: true, tags: true, keywords: true,
        metaTitle: true, metaDescription: true, readMinutes: true,
        viewCount: true, leadCount: true, engagementPct: true, seoRank: true,
        backlinks: true, aiAssisted: true, draftVersion: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!post) return paperclipError(404, "not_found", `Post ${id} not found`);
    return paperclipOk({
      data: { ...serializePost(post), body: post.body },
    });
  });
}
