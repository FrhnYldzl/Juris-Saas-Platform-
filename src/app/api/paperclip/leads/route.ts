import { z } from "zod";
import { LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withPaperclip, paperclipOk, paperclipError } from "@/lib/paperclip-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────
// GET /api/paperclip/leads
//
// List leads in the firm. Supports query filters:
//   ?stage=NEW,QUALIFIED   (comma list of LeadStage)
//   ?source=LinkedIn        (single source string)
//   ?campaign=Q1-LinkedIn   (matches Lead.source against utm_campaign)
//   ?limit=50&offset=0
// ─────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  return withPaperclip(req, "lead:read", async ({ ctx }) => {
    const url = new URL(req.url);

    const limit  = Math.min(Math.max(Number(url.searchParams.get("limit")  ?? 50), 1), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

    const stagesRaw = url.searchParams.get("stage");
    const stages = stagesRaw
      ? (stagesRaw.split(",")
          .map((s) => s.trim().toUpperCase())
          .filter((s): s is LeadStage => s in LeadStage))
      : null;
    const source   = url.searchParams.get("source")   || undefined;
    const campaign = url.searchParams.get("campaign") || undefined;

    const where = {
      firmId: ctx.firmId,
      ...(stages && stages.length > 0 ? { stage: { in: stages } } : {}),
      ...(source   ? { source } : {}),
      ...(campaign ? { source: campaign } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true, title: true, clientName: true, topic: true, source: true,
          pricingModel: true, stage: true, value: true, currency: true,
          probability: true, expectedCloseAt: true, nextActionText: true,
          nextActionAt: true, assigneeName: true, lostReason: true,
          createdAt: true, updatedAt: true,
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return paperclipOk({
      data: items.map(serializeLead),
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    });
  });
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/paperclip/leads
//
// Create a new lead from an S&M campaign.
// Body:
//   {
//     title:        string  (required)
//     clientName?:  string
//     topic?:       string
//     source?:      string  (e.g. "LinkedIn", "Q1-LinkedIn-Campaign")
//     pricingModel?:string
//     stage?:       LeadStage  (defaults to "NEW")
//     value?:       number
//     currency?:    string  (default "TRY")
//     probability?: number  (0-100)
//     expectedCloseAt?: ISO date
//     nextActionText?:  string
//     nextActionAt?:    ISO date
//     assigneeName?:    string
//     description?:     string
//   }
// ─────────────────────────────────────────────────────────────────────

const createLeadSchema = z.object({
  title:           z.string().min(2, "title >= 2 chars"),
  clientName:      z.string().optional().nullable(),
  topic:           z.string().optional().nullable(),
  source:          z.string().optional().nullable(),
  pricingModel:    z.string().optional().nullable(),
  stage:           z.nativeEnum(LeadStage).default(LeadStage.NEW),
  value:           z.coerce.number().min(0).optional().nullable(),
  currency:        z.string().length(3).default("TRY"),
  probability:     z.coerce.number().min(0).max(100).default(20),
  expectedCloseAt: z.string().datetime().optional().nullable(),
  nextActionText:  z.string().optional().nullable(),
  nextActionAt:    z.string().datetime().optional().nullable(),
  assigneeName:    z.string().optional().nullable(),
  description:     z.string().optional().nullable(),
});

export async function POST(req: Request) {
  return withPaperclip<unknown>(req, "lead:write", async ({ ctx, body }) => {
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return paperclipError(400, "validation_error", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    }
    const d = parsed.data;

    const lead = await prisma.lead.create({
      data: {
        firmId:          ctx.firmId,
        title:           d.title,
        clientName:      d.clientName ?? null,
        topic:           d.topic ?? null,
        source:          d.source ?? null,
        pricingModel:    d.pricingModel ?? null,
        stage:           d.stage,
        value:           d.value ?? null,
        currency:        d.currency,
        probability:     d.probability,
        expectedCloseAt: d.expectedCloseAt ? new Date(d.expectedCloseAt) : null,
        nextActionText:  d.nextActionText ?? null,
        nextActionAt:    d.nextActionAt ? new Date(d.nextActionAt) : null,
        assigneeName:    d.assigneeName ?? null,
        description:     d.description ?? null,
      },
      select: {
        id: true, title: true, clientName: true, topic: true, source: true,
        pricingModel: true, stage: true, value: true, currency: true,
        probability: true, expectedCloseAt: true, nextActionText: true,
        nextActionAt: true, assigneeName: true, lostReason: true,
        createdAt: true, updatedAt: true,
      },
    });

    return paperclipOk({ data: serializeLead(lead) }, 201);
  });
}

// ─── Serializer ───

function serializeLead(l: {
  id: string; title: string; clientName: string | null; topic: string | null;
  source: string | null; pricingModel: string | null; stage: LeadStage;
  value: { toNumber: () => number } | null; currency: string; probability: number;
  expectedCloseAt: Date | null; nextActionText: string | null;
  nextActionAt: Date | null; assigneeName: string | null;
  lostReason: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id:              l.id,
    title:           l.title,
    clientName:      l.clientName,
    topic:           l.topic,
    source:          l.source,
    pricingModel:    l.pricingModel,
    stage:           l.stage,
    value:           l.value ? l.value.toNumber() : null,
    currency:        l.currency,
    probability:     l.probability,
    expectedCloseAt: l.expectedCloseAt?.toISOString() ?? null,
    nextActionText:  l.nextActionText,
    nextActionAt:    l.nextActionAt?.toISOString() ?? null,
    assigneeName:    l.assigneeName,
    lostReason:      l.lostReason,
    createdAt:       l.createdAt.toISOString(),
    updatedAt:       l.updatedAt.toISOString(),
  };
}
