import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPaperclip, paperclipOk, paperclipError } from "@/lib/paperclip-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────
// POST /api/paperclip/campaigns
//
// Register a UTM campaign. Future leads with matching utm_campaign in
// their source field will be attributable.
//
// Body:
//   {
//     name:         "Q1 LinkedIn"           (required)
//     utmCampaign:  "q1-linkedin-2026"      (required, unique per firm)
//     utmSource:    "linkedin"              (required)
//     utmMedium:    "social"                (required)
//     utmTerm?:     "kvkk-2026"
//     utmContent?:  "carousel-1"
//     channel?:     "LINKEDIN" | "BLOG" | ...
//     startsAt?:    ISO date
//     endsAt?:      ISO date
//     budget?:      number (TRY)
//     notes?:       string
//   }
//
// Returns: 201 { data: campaign }   or   409 if utmCampaign already exists.
// ─────────────────────────────────────────────────────────────────────

const utmSlug = /^[a-z0-9_-]+$/i;

const createCampaignSchema = z.object({
  name:        z.string().min(2, "name >= 2 chars"),
  utmCampaign: z.string().min(2).regex(utmSlug, "utmCampaign: only [a-zA-Z0-9_-]"),
  utmSource:   z.string().min(2).regex(utmSlug, "utmSource: only [a-zA-Z0-9_-]"),
  utmMedium:   z.string().min(2).regex(utmSlug, "utmMedium: only [a-zA-Z0-9_-]"),
  utmTerm:     z.string().regex(utmSlug, "utmTerm: only [a-zA-Z0-9_-]").optional().nullable(),
  utmContent:  z.string().regex(utmSlug, "utmContent: only [a-zA-Z0-9_-]").optional().nullable(),
  channel:     z.string().optional().nullable(),
  startsAt:    z.string().datetime().optional().nullable(),
  endsAt:      z.string().datetime().optional().nullable(),
  budget:      z.coerce.number().min(0).optional().nullable(),
  notes:       z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  return withPaperclip<unknown>(req, "campaign:write", async ({ ctx, body }) => {
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return paperclipError(
        400, "validation_error",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      );
    }
    const d = parsed.data;

    // Idempotency: same utmCampaign per firm should 409 (or upsert? — choose 409 for explicit)
    const existing = await prisma.campaign.findFirst({
      where: { firmId: ctx.firmId, utmCampaign: d.utmCampaign },
      select: { id: true },
    });
    if (existing) {
      return paperclipError(
        409, "campaign_exists",
        `utmCampaign '${d.utmCampaign}' already registered (id ${existing.id}). Use PATCH to update.`,
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        firmId:      ctx.firmId,
        name:        d.name,
        utmCampaign: d.utmCampaign,
        utmSource:   d.utmSource,
        utmMedium:   d.utmMedium,
        utmTerm:     d.utmTerm ?? null,
        utmContent:  d.utmContent ?? null,
        channel:     d.channel ?? null,
        startsAt:    d.startsAt ? new Date(d.startsAt) : null,
        endsAt:      d.endsAt   ? new Date(d.endsAt)   : null,
        budget:      d.budget ?? null,
        notes:       d.notes ?? null,
        createdVia:  "paperclip",
      },
    });

    return paperclipOk({
      data: serialize(campaign),
      // Helpful UTM tracking URL example so clients can copy/use it
      trackingUrl: buildTrackingUrl("https://juris.com.tr", campaign),
    }, 201);
  });
}

// ─────────────────────────────────────────────────────────────────────
// GET /api/paperclip/campaigns — list campaigns
// ─────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  return withPaperclip(req, "campaign:read", async ({ ctx }) => {
    const url = new URL(req.url);
    const limit  = Math.min(Math.max(Number(url.searchParams.get("limit")  ?? 50), 1), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
    const activeParam = url.searchParams.get("active");

    const where = {
      firmId: ctx.firmId,
      ...(activeParam === "true"  ? { active: true }  :
          activeParam === "false" ? { active: false } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.campaign.count({ where }),
    ]);

    return paperclipOk({
      data: items.map(serialize),
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    });
  });
}

// ─── helpers ───

function serialize(c: {
  id: string; name: string; utmSource: string; utmMedium: string;
  utmCampaign: string; utmTerm: string | null; utmContent: string | null;
  channel: string | null; startsAt: Date | null; endsAt: Date | null;
  budget: { toNumber: () => number } | null; notes: string | null;
  active: boolean; createdVia: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id:          c.id,
    name:        c.name,
    utmCampaign: c.utmCampaign,
    utmSource:   c.utmSource,
    utmMedium:   c.utmMedium,
    utmTerm:     c.utmTerm,
    utmContent:  c.utmContent,
    channel:     c.channel,
    startsAt:    c.startsAt?.toISOString() ?? null,
    endsAt:      c.endsAt?.toISOString() ?? null,
    budget:      c.budget ? c.budget.toNumber() : null,
    notes:       c.notes,
    active:      c.active,
    createdVia:  c.createdVia,
    createdAt:   c.createdAt.toISOString(),
    updatedAt:   c.updatedAt.toISOString(),
  };
}

function buildTrackingUrl(base: string, c: {
  utmSource: string; utmMedium: string; utmCampaign: string;
  utmTerm: string | null; utmContent: string | null;
}): string {
  const u = new URL(base);
  u.searchParams.set("utm_source",   c.utmSource);
  u.searchParams.set("utm_medium",   c.utmMedium);
  u.searchParams.set("utm_campaign", c.utmCampaign);
  if (c.utmTerm)    u.searchParams.set("utm_term", c.utmTerm);
  if (c.utmContent) u.searchParams.set("utm_content", c.utmContent);
  return u.toString();
}
