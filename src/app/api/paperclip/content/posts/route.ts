import { z } from "zod";
import { ContentChannel, ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withPaperclip, paperclipOk, paperclipError } from "@/lib/paperclip-auth";
import { serializePost } from "./_serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────
// GET /api/paperclip/content/posts
// Filters: ?status=DRAFT,REVIEW  ?channel=BLOG  ?limit=50&offset=0
// ─────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  return withPaperclip(req, "content:read", async ({ ctx }) => {
    const url = new URL(req.url);
    const limit  = Math.min(Math.max(Number(url.searchParams.get("limit")  ?? 50), 1), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

    const statusRaw = url.searchParams.get("status");
    const statuses = statusRaw
      ? statusRaw.split(",").map((s) => s.trim().toUpperCase())
          .filter((s): s is ContentStatus => s in ContentStatus)
      : null;

    const channelRaw = url.searchParams.get("channel");
    const channel = channelRaw && channelRaw.toUpperCase() in ContentChannel
      ? (channelRaw.toUpperCase() as ContentChannel) : null;

    const where = {
      firmId: ctx.firmId,
      ...(statuses && statuses.length > 0 ? { status:  { in: statuses } } : {}),
      ...(channel ? { channel } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        skip: offset,
        select: {
          id: true, title: true, summary: true, channel: true, status: true,
          author: true, contentType: true, publishAt: true, publishedAt: true,
          url: true, tags: true, keywords: true, metaTitle: true,
          metaDescription: true, readMinutes: true, viewCount: true,
          leadCount: true, engagementPct: true, seoRank: true, backlinks: true,
          aiAssisted: true, draftVersion: true,
          createdAt: true, updatedAt: true,
        },
      }),
      prisma.contentItem.count({ where }),
    ]);

    return paperclipOk({
      data: items.map(serializePost),
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    });
  });
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/paperclip/content/posts
// CREATE DRAFT ONLY — publishing requires board approval (status=REVIEW
// or higher is rejected here). Status can be omitted (defaults to DRAFT)
// or explicitly DRAFT / IDEA.
// ─────────────────────────────────────────────────────────────────────

const createPostSchema = z.object({
  title:           z.string().min(2, "title >= 2 chars"),
  summary:         z.string().optional().nullable(),
  body:            z.string().optional().nullable(),
  channel:         z.nativeEnum(ContentChannel).default(ContentChannel.BLOG),
  contentType:     z.string().optional().nullable(),
  author:          z.string().optional().nullable(),
  publishAt:       z.string().datetime().optional().nullable(),
  url:             z.string().url().optional().or(z.literal("")).nullable(),
  tags:            z.array(z.string()).optional().nullable(),
  keywords:        z.array(z.string()).optional().nullable(),
  metaTitle:       z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(180).optional().nullable(),
  readMinutes:     z.coerce.number().min(0).max(120).optional().nullable(),
  aiAssisted:      z.boolean().optional().nullable(),
  // status: only DRAFT or IDEA accepted
  status:          z.enum(["IDEA", "DRAFT"]).default("DRAFT"),
});

export async function POST(req: Request) {
  return withPaperclip<unknown>(req, "content:draft", async ({ ctx, body }) => {
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return paperclipError(
        400, "validation_error",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      );
    }
    const d = parsed.data;

    const post = await prisma.contentItem.create({
      data: {
        firmId:          ctx.firmId,
        title:           d.title,
        summary:         d.summary,
        body:            d.body,
        channel:         d.channel,
        contentType:     d.contentType,
        author:          d.author,
        publishAt:       d.publishAt ? new Date(d.publishAt) : null,
        url:             d.url || null,
        tags:            d.tags ?? [],
        keywords:        d.keywords ?? [],
        metaTitle:       d.metaTitle,
        metaDescription: d.metaDescription,
        readMinutes:     d.readMinutes ?? null,
        aiAssisted:      d.aiAssisted ?? false,
        status:          d.status,  // IDEA or DRAFT only
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

    return paperclipOk({ data: serializePost(post), notes: ["Draft created — publishing requires board approval flow at /marketing/" + post.id] }, 201);
  });
}

