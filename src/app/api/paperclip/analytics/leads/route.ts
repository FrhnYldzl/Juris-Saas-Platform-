import { LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withPaperclip, paperclipOk } from "@/lib/paperclip-auth";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────
// GET /api/paperclip/analytics/leads
//
// MQL (Marketing Qualified Lead) statistics.
//
// Query params:
//   ?from=ISO  ?to=ISO        (optional date window — defaults: last 30d)
//   ?groupBy=source|stage|day (defaults: stage)
//
// Response shape:
// {
//   window: { from, to },
//   totals: { all, qualified, lostRate, avgValue, avgProbability },
//   byStage:  [{ stage, count, valueSum }],
//   bySource: [{ source, count, valueSum, winRate }],
//   trend:    [{ date, count }]    // last 30 days
// }
// ─────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  return withPaperclip(req, "analytics:read", async ({ ctx }) => {
    const url = new URL(req.url);
    const fromParam = url.searchParams.get("from");
    const toParam   = url.searchParams.get("to");

    const now = new Date();
    const from = fromParam ? new Date(fromParam) : startOfDay(subDays(now, 29));
    const to   = toParam   ? new Date(toParam)   : endOfDay(now);

    const where = {
      firmId: ctx.firmId,
      createdAt: { gte: from, lte: to },
    };

    // High-level totals
    const [allCount, qualifiedCount, lostCount, byStageRaw, bySourceRaw, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, stage: { in: ["QUALIFIED", "MEETING", "PROPOSAL", "NEGOTIATION", "CONTRACT", "SIGNING", "WON"] } } }),
      prisma.lead.count({ where: { ...where, stage: "LOST" } }),
      prisma.lead.groupBy({
        by: ["stage"],
        where,
        _count: { _all: true },
        _sum: { value: true },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { ...where, source: { not: null } },
        _count: { _all: true },
        _sum: { value: true },
      }),
      prisma.lead.findMany({
        where,
        select: { value: true, probability: true, source: true, stage: true, createdAt: true },
      }),
    ]);

    // Compute averages
    const valueSum = leads.reduce((s, l) => s + (l.value?.toNumber() ?? 0), 0);
    const avgValue = leads.length > 0 ? valueSum / leads.length : 0;
    const avgProbability = leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + l.probability, 0) / leads.length)
      : 0;
    const lostRate = allCount > 0 ? Math.round((lostCount / allCount) * 100) : 0;

    // Per-source winRate (won / total)
    const bySource = bySourceRaw.map((s) => {
      const sourceLeads = leads.filter((l) => l.source === s.source);
      const wonInSource = sourceLeads.filter((l) => l.stage === "WON").length;
      return {
        source:    s.source,
        count:     s._count._all,
        valueSum:  s._sum.value?.toNumber() ?? 0,
        winRate:   sourceLeads.length > 0 ? Math.round((wonInSource / sourceLeads.length) * 100) : 0,
      };
    }).sort((a, b) => b.count - a.count);

    // Per-stage
    const byStage = byStageRaw.map((s) => ({
      stage:    s.stage,
      count:    s._count._all,
      valueSum: s._sum.value?.toNumber() ?? 0,
    })).sort((a, b) => stageOrder(a.stage) - stageOrder(b.stage));

    // Daily trend — last 30 days
    const dailyMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i);
      dailyMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const l of leads) {
      const k = l.createdAt.toISOString().slice(0, 10);
      if (dailyMap.has(k)) dailyMap.set(k, (dailyMap.get(k) ?? 0) + 1);
    }
    const trend = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

    // Current month MQL (compare against window)
    const mStart = startOfMonth(now);
    const mEnd   = endOfMonth(now);
    const mqlThisMonth = await prisma.lead.count({
      where: {
        firmId: ctx.firmId,
        createdAt: { gte: mStart, lte: mEnd },
        stage: { in: ["QUALIFIED", "MEETING", "PROPOSAL", "NEGOTIATION", "CONTRACT", "SIGNING", "WON"] },
      },
    });

    return paperclipOk({
      window: { from: from.toISOString(), to: to.toISOString() },
      totals: {
        all:            allCount,
        qualified:      qualifiedCount,
        lost:           lostCount,
        lostRate,
        avgValue:       Math.round(avgValue),
        avgProbability,
        mqlThisMonth,
      },
      byStage,
      bySource,
      trend,
    });
  });
}

function stageOrder(s: LeadStage): number {
  const order: LeadStage[] = ["NEW", "QUALIFIED", "MEETING", "PROPOSAL", "NEGOTIATION", "CONTRACT", "SIGNING", "WON", "LOST"];
  return order.indexOf(s);
}
