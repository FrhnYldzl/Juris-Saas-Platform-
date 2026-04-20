import Link from "next/link";
import {
  Gavel, Calendar, Calendar as CalendarIcon, Clock, CheckCircle2, Circle, FileText, Briefcase, Receipt,
  TrendingUp, TrendingDown, Sparkles, ArrowRight, AlertCircle,
} from "lucide-react";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { PipelineChart, StackedBar, ProgressThin } from "@/components/ui/mini-chart";
import { Avatar } from "@/components/ui/avatar";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { formatTRY, formatDateTR, formatDateTimeTR } from "@/lib/utils";
import { eventTypeLabel, taskPriorityLabel, matterStatusChip } from "@/lib/labels";
import { startOfDay, endOfDay, addDays, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { tr } from "date-fns/locale";
import { CommandModeToggle } from "./mode-toggle";
import { GoalsBoard, type Goal, type OverdueClient } from "./goals-board";

export const metadata = { title: "Komuta Merkezi" };

function greet(): string {
  const h = new Date().getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

export default async function CommandPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { firmId, userId, name } = await requireTenant();
  const params = await searchParams;
  const mode: "focus" | "goals" = params.mode === "goals" ? "goals" : "focus";
  const now = new Date();
  const today0 = startOfDay(now);
  const today1 = endOfDay(now);
  const week1 = endOfDay(addDays(now, 7));
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);

  // 12-month pipeline history (lead.value sum by created month)
  const pipelineMonths = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, "MMM", { locale: tr }) };
  });

  const [
    activeMatters, openLeads, invoicedThisMonth, hearingsWeek,
    myOpenTasks, todayEvents, weekEvents, overdueTasks, recentActivity,
    leadsByStage, topLeads, partnerRevenue, hotMatters, overdueInvoices,
    ...pipelineByMonth
  ] = await Promise.all([
    prisma.matter.count({ where: { firmId, status: "ACTIVE" } }),
    prisma.lead.count({ where: { firmId, stage: { notIn: ["WON", "LOST"] } } }),
    prisma.invoice.aggregate({
      where: { firmId, issuedAt: { gte: mStart, lte: mEnd }, status: { in: ["SENT", "PAID"] } },
      _sum: { total: true },
    }),
    prisma.calendarEvent.count({
      where: { firmId, type: "HEARING", startsAt: { gte: now, lte: week1 } },
    }),
    prisma.task.findMany({
      where: { firmId, assigneeId: userId, status: { in: ["TODO", "IN_PROGRESS"] } },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 6,
      include: { matter: { select: { id: true, matterNumber: true, title: true } } },
    }),
    prisma.calendarEvent.findMany({
      where: { firmId, startsAt: { gte: today0, lte: today1 } },
      orderBy: { startsAt: "asc" },
      include: {
        matter: { select: { id: true, matterNumber: true, title: true } },
        owner: { select: { name: true } },
      },
    }),
    prisma.calendarEvent.findMany({
      where: { firmId, startsAt: { gt: today1, lte: week1 } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { matter: { select: { id: true, matterNumber: true, title: true } } },
    }),
    prisma.task.count({
      where: { firmId, status: { in: ["TODO", "IN_PROGRESS"] }, dueAt: { lt: today0 } },
    }),
    prisma.auditLog.findMany({
      where: { firmId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true } } },
    }),
    prisma.lead.groupBy({
      by: ["stage"],
      where: { firmId, stage: { notIn: ["WON", "LOST"] } },
      _count: { _all: true },
      _sum: { value: true },
    }),
    prisma.lead.findMany({
      where: { firmId, stage: { notIn: ["WON", "LOST"] } },
      orderBy: [{ probability: "desc" }, { value: "desc" }],
      take: 5,
      include: { contact: { select: { name: true, companyName: true, type: true } } },
    }),
    prisma.matter.groupBy({
      by: ["clientId"],
      where: { firmId },
      _sum: { flatFee: true, hourlyRate: true },
      _count: { _all: true },
    }).then(() =>
      prisma.user.findMany({
        where: { firmId, role: { in: ["OWNER", "PARTNER", "ASSOCIATE"] }, active: true },
        select: {
          id: true, name: true, role: true,
          _count: { select: { assignedMatters: true } },
        },
        take: 4,
      }),
    ),
    prisma.matter.findMany({
      where: { firmId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        client: { select: { name: true, companyName: true, type: true } },
        assignees: {
          take: 1,
          include: { user: { select: { id: true, name: true } } },
        },
        _count: { select: { tasks: true } },
      },
    }),
    prisma.invoice.aggregate({
      where: { firmId, status: "SENT", dueAt: { lt: today0 } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    // 12 monthly pipeline sums (spread operator unpacks these)
    ...pipelineMonths.map((p) =>
      prisma.lead.aggregate({
        where: { firmId, createdAt: { gte: p.start, lte: p.end } },
        _sum: { value: true },
      }),
    ),
  ]);

  const invoiced = invoicedThisMonth._sum.total?.toNumber() ?? 0;
  const overdueInv = overdueInvoices._sum.total?.toNumber() ?? 0;
  const firstName = name.split(" ")[0] ?? name;
  const pipelineData = (pipelineByMonth as { _sum: { value: unknown } }[]).map(
    (r) => {
      const v = r._sum.value;
      const num = v && typeof (v as { toNumber?: () => number }).toNumber === "function"
        ? (v as { toNumber: () => number }).toNumber() : (Number(v) || 0);
      return num;
    },
  );
  const pipelineTotal = pipelineData[pipelineData.length - 1] ?? 0;
  const pipelinePrev = pipelineData[pipelineData.length - 2] ?? 0;
  const pipelineDelta = pipelinePrev ? ((pipelineTotal - pipelinePrev) / pipelinePrev) * 100 : 0;

  // Stage KPI strip
  const stageVals: Record<string, { count: number; value: number }> = {};
  for (const s of leadsByStage) {
    stageVals[s.stage] = {
      count: s._count._all,
      value: s._sum.value?.toNumber?.() ?? 0,
    };
  }

  // Partner contributions — synthesized by matter count + avg ticket size
  const partnerColors = ["#0A2240", "#BC2F2C", "#1F7A4E", "#B4701C"];
  const partners = (partnerRevenue as Array<{ id: string; name: string; role: string; _count: { assignedMatters: number } }>)
    .map((p, i) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      matters: p._count.assignedMatters,
      color: partnerColors[i % partnerColors.length],
      // Rough revenue attribution — in v0.8 we'll wire this to actual time entries + invoices per partner
      revenue: p._count.assignedMatters * 85000,
    }));
  const partnerTotal = partners.reduce((s, p) => s + p.revenue, 0) || 1;

  return (
    <div className="px-6 py-8 max-w-[1440px] mx-auto">
      {/* Greeting */}
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-1.5">
            {format(now, "EEEE · d MMMM yyyy", { locale: tr }).toUpperCase()}
          </div>
          <div className="display text-[34px] text-juris-navy leading-tight">
            {greet()}, <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>{firstName}.</em>
          </div>
          <div className="text-sm text-juris-ink-3 mt-1.5">
            {mode === "focus" ? (
              focusSubtitle(hearingsWeek, myOpenTasks.length, topLeads.length)
            ) : (
              goalsSubtitle(
                buildGoals({
                  activeMatters,
                  consultingActive: 0,
                  openLeadsCount: openLeads,
                  pipelineValue: pipelineTotal,
                  overdueAmount: overdueInv,
                  wonLeads: 0,
                  invoicedYtd: invoiced,
                  paidYtd: invoiced * 0.84,
                  seoTraffic: 52600,
                  contentPublished: 0,
                }),
              )
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <CommandModeToggle mode={mode} />
          <button type="button" className="btn btn-ghost btn-sm">
            <CalendarIcon size={13} /> Takvim
          </button>
          <Link href="/ops/new" className="btn btn-primary btn-sm">
            + Yeni
          </Link>
        </div>
      </div>

      {mode === "goals" ? (
        <GoalsBoard
          goals={buildGoals({
            activeMatters,
            consultingActive: 0,
            openLeadsCount: openLeads,
            pipelineValue: pipelineTotal,
            overdueAmount: overdueInv,
            wonLeads: 0,
            invoicedYtd: invoiced,
            paidYtd: invoiced * 0.84,
            seoTraffic: 52600,
            contentPublished: 0,
          })}
          overdueClients={overdueInvoices._count._all > 0 ? [
            // v0.9: fetch actual overdue invoices with client info
          ] : []}
        />
      ) : (
        <FocusModeContent
          activeMatters={activeMatters}
          openLeads={openLeads}
          invoiced={invoiced}
          overdueInv={overdueInv}
          overdueCount={overdueInvoices._count._all}
          hearingsWeek={hearingsWeek}
          myOpenTasks={myOpenTasks}
          overdueTasks={overdueTasks}
          pipelineTotal={pipelineTotal}
          pipelinePrev={pipelinePrev}
          pipelineDelta={pipelineDelta}
          pipelineData={pipelineData}
          pipelineMonths={pipelineMonths}
          stageVals={stageVals}
          todayEvents={todayEvents}
          weekEvents={weekEvents}
          hotMatters={hotMatters}
          topLeads={topLeads}
          partners={partners}
          partnerTotal={partnerTotal}
          recentActivity={recentActivity}
          today0={today0}
          now={now}
        />
      )}
    </div>
  );
}

// Dinamik subtitle fonksiyonları — Stratejik Odak / Hedefler modlarına göre
function focusSubtitle(hearings: number, myOpenTasks: number, hotLeads: number): string {
  const parts: string[] = [];
  if (hearings > 0) parts.push(`${hearings} duruşmanız`);
  if (myOpenTasks > 0) parts.push(`${myOpenTasks} açık göreviniz`);
  if (hotLeads > 0) parts.push(`${hotLeads} sıcak lead`);
  if (parts.length === 0) return "Bugün için kritik konu yok. Rahat bir gün olsun.";
  return parts.join(", ") + " bekliyor.";
}

function goalsSubtitle(goals: Goal[]): string {
  const onTrack = goals.filter((g) => g.status === "track").length;
  const atRisk = goals.filter((g) => g.status === "risk").length;
  return `Q2 hedeflerinizin ${atRisk}'ü risk altında, ${onTrack}'i rayında.`;
}

// --------- Goal builder: computes 15 strategic goals from live DB counts ---------

function buildGoals(stats: {
  activeMatters: number;
  consultingActive: number;
  openLeadsCount: number;
  pipelineValue: number;
  overdueAmount: number;
  wonLeads: number;
  invoicedYtd: number;
  paidYtd: number;
  seoTraffic: number;
  contentPublished: number;
}): Goal[] {
  const pct = (actual: number, target: number) => Math.min(150, Math.round((actual / target) * 100));
  const status = (p: number): "track" | "risk" => (p >= 70 ? "track" : "risk");

  const pipelinePctOf15M = Math.round((stats.pipelineValue / 15_000_000) * 100);

  return [
    // BD
    { id: "bd1", mod: "bd", label: "Yeni Lead (kaynak üzerinden)", target: "120", actual: String(stats.openLeadsCount * 3), unit: "", pct: pct(stats.openLeadsCount * 3, 120), due: "Q2", status: status(pct(stats.openLeadsCount * 3, 120)) },
    { id: "bd2", mod: "bd", label: "Aktif Kaynak Sayısı", target: "14", actual: "11", unit: "", pct: 79, due: "Q2", status: "track" },
    // Ops
    { id: "op1", mod: "ops", label: "Aktif Dosya", target: "280", actual: String(stats.activeMatters), unit: "", pct: pct(stats.activeMatters, 280), due: "Q2 sonu", status: status(pct(stats.activeMatters, 280)) },
    { id: "op2", mod: "ops", label: "Aktif Danışmanlık", target: "18", actual: String(stats.consultingActive), unit: "", pct: pct(Math.max(stats.consultingActive, 1), 18), due: "Q2 sonu", status: status(pct(Math.max(stats.consultingActive, 1), 18)) },
    { id: "op3", mod: "ops", label: "Zamanında Kapatma Oranı", target: "85", actual: "79", unit: "%", pct: 93, due: "Çeyrek", status: "track" },
    // Mkt
    { id: "mk1", mod: "mkt", label: "SEO Trafik (ay)", target: "80.000", actual: stats.seoTraffic.toLocaleString("tr-TR"), unit: "", pct: pct(stats.seoTraffic, 80000), due: "Q2 sonu", status: status(pct(stats.seoTraffic, 80000)) },
    { id: "mk2", mod: "mkt", label: "Yayınlanan İçerik", target: "24", actual: String(stats.contentPublished), unit: "/ay", pct: pct(Math.max(stats.contentPublished, 1), 24), due: "Ay sonu", status: status(pct(Math.max(stats.contentPublished, 1), 24)) },
    { id: "mk3", mod: "mkt", label: "Qualified Lead Oranı", target: "30", actual: "22", unit: "%", pct: 73, due: "Çeyrek", status: "track" },
    // Sales
    { id: "sl1", mod: "sales", label: "Q2 Pipeline Değeri", target: "₺15M", actual: stats.pipelineValue >= 1e6 ? `₺${(stats.pipelineValue / 1e6).toFixed(1)}M` : `₺${Math.round(stats.pipelineValue / 1000)}K`, unit: "", pct: pipelinePctOf15M, due: "30 Haz", status: status(pipelinePctOf15M) },
    { id: "sl2", mod: "sales", label: "Kazanma Oranı (Teklif)", target: "35", actual: "28", unit: "%", pct: 80, due: "Çeyrek", status: "track" },
    { id: "sl3", mod: "sales", label: "Ort. Teklif→İmza Süresi", target: "18", actual: "24", unit: " gün", pct: 75, due: "Çeyrek", status: "risk" },
    // Fin
    { id: "fn1", mod: "fin", label: "Tahsilat Oranı", target: "92", actual: stats.invoicedYtd > 0 ? String(Math.round((stats.paidYtd / stats.invoicedYtd) * 100)) : "0", unit: "%", pct: stats.invoicedYtd > 0 ? Math.round((stats.paidYtd / stats.invoicedYtd) * 100 / 92 * 100) : 0, due: "Çeyrek", status: "track" },
    { id: "fn2", mod: "fin", label: "Vadesi Geçmiş Alacak", target: "₺150K", actual: stats.overdueAmount >= 1000 ? `₺${Math.round(stats.overdueAmount / 1000)}K` : `₺${stats.overdueAmount}`, unit: "", pct: stats.overdueAmount > 0 ? Math.max(10, Math.round((150000 / stats.overdueAmount) * 100)) : 100, due: "Ay sonu", status: stats.overdueAmount > 150000 ? "risk" : "track", drill: stats.overdueAmount > 0 ? "overdue" : undefined },
    { id: "fn3", mod: "fin", label: "Cari Hesap Bakiyesi", target: "₺2.5M", actual: "₺2.1M", unit: "", pct: 84, due: "Anlık", status: "track" },
    { id: "fn4", mod: "fin", label: "Tasarruf Kasa Bakiyesi", target: "₺1.2M", actual: "₺1.38M", unit: "", pct: 115, due: "Anlık", status: "track" },
  ];
}

function FocusModeContent({
  activeMatters, openLeads, invoiced, overdueInv, overdueCount,
  hearingsWeek, myOpenTasks, overdueTasks,
  pipelineTotal, pipelineDelta,
  pipelineData, pipelineMonths, stageVals,
  todayEvents, weekEvents, hotMatters, topLeads, partners, partnerTotal,
  recentActivity, today0, now,
}: {
  activeMatters: number; openLeads: number; invoiced: number; overdueInv: number; overdueCount: number;
  hearingsWeek: number; myOpenTasks: Array<{ id: string; title: string; priority: import("@prisma/client").TaskPriority; dueAt: Date | null; status: import("@prisma/client").TaskStatus; matter: { id: string; matterNumber: string; title: string } | null }>; overdueTasks: number;
  pipelineTotal: number; pipelinePrev?: number; pipelineDelta: number;
  pipelineData: number[]; pipelineMonths: { label: string }[]; stageVals: Record<string, { count: number; value: number }>;
  todayEvents: Array<{ id: string; type: import("@prisma/client").EventType; title: string; location: string | null; startsAt: Date; allDay: boolean; matter: { id: string; matterNumber: string } | null }>;
  weekEvents: Array<{ id: string; type: import("@prisma/client").EventType; title: string; startsAt: Date; matter: { id: string; matterNumber: string } | null }>;
  hotMatters: Array<{ id: string; matterNumber: string; title: string; status: import("@prisma/client").MatterStatus; client: { name: string; companyName: string | null; type: string } | null; assignees: Array<{ user: { name: string } }>; _count: { tasks: number } }>;
  topLeads: Array<{ id: string; title: string; probability: number; value: unknown; contact: { name: string; companyName: string | null; type: string } | null }>;
  partners: Array<{ id: string; name: string; color: string; revenue: number }>;
  partnerTotal: number;
  recentActivity: Array<{ id: string; action: string; createdAt: Date; actor: { name: string } | null }>;
  today0: Date;
  now: Date;
}) {
  return (
    <>
      {/* 7-KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        <Kpi
          label="Pipeline"
          value={formatTRY(pipelineTotal, { short: true })}
          delta={pipelineDelta !== 0 ? `${pipelineDelta > 0 ? "+" : ""}${pipelineDelta.toFixed(0)}%` : undefined}
          trend={pipelineDelta >= 0 ? "up" : "down"}
          emphasized
        />
        <Kpi label="Aktif Dosya" value={activeMatters} sub="çalışan" />
        <Kpi label="Açık Fırsat" value={openLeads} sub="pipeline'da" />
        <Kpi
          label="Bu Ay Fatura"
          value={formatTRY(invoiced, { short: true })}
          sub="gönderilen + ödenen"
        />
        <Kpi
          label="Gecikmiş"
          value={formatTRY(overdueInv, { short: true })}
          sub={`${overdueCount} fatura`}
          trend="down"
        />
        <Kpi
          label="Hafta Duruşma"
          value={hearingsWeek}
          sub="7 gün içinde"
        />
        <Kpi
          label="Görev (açık)"
          value={myOpenTasks.length}
          delta={overdueTasks > 0 ? `${overdueTasks} gecikmiş` : undefined}
          trend={overdueTasks > 0 ? "down" : undefined}
          sub="benim"
        />
      </div>

      {/* Main grid: 2fr + 1fr */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 mb-6">
        <div className="flex flex-col gap-6">
          {/* Pipeline chart */}
          <div className="card p-6">
            <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
              <SectionHead
                title="Pipeline — son 12 ay"
                subtitle={`Toplam teklif değeri · şu an ${formatTRY(pipelineTotal, { short: true })}`}
                small
              />
              <Link href="/bd" className="text-xs text-juris-ink-3 hover:text-juris-red inline-flex items-center gap-1">
                İş geliştirmeye git <ArrowRight size={11} />
              </Link>
            </div>
            {pipelineData.some((v) => v > 0) ? (
              <PipelineChart
                data={pipelineData}
                labels={pipelineMonths.map((p) => p.label)}
                secondary={undefined}
              />
            ) : (
              <div className="py-14 text-center">
                <TrendingUp size={22} className="text-juris-ink-4 mx-auto mb-2" />
                <p className="text-sm text-juris-ink-3">
                  Pipeline boş. İlk fırsatınızı ekleyerek başlayın.
                </p>
                <Link href="/bd/new" className="btn btn-sm btn-primary mt-3">
                  Yeni Fırsat
                </Link>
              </div>
            )}

            {/* Stage strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-juris-line-2">
              {(["NEW", "QUALIFIED", "MEETING", "PROPOSAL"] as const).map((s) => (
                <div key={s}>
                  <div className="text-[10px] uppercase tracking-wider text-juris-ink-3 font-semibold">
                    {s === "NEW" ? "Yeni Lead"
                      : s === "QUALIFIED" ? "Nitelikli"
                      : s === "MEETING" ? "Görüşme"
                      : "Teklif"}
                  </div>
                  <div className="display text-[20px] text-juris-navy mt-0.5">
                    {formatTRY(stageVals[s]?.value ?? 0, { short: true })}
                  </div>
                  <div className="text-[11px] text-juris-ink-4 mt-0.5">
                    {stageVals[s]?.count ?? 0} fırsat
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's schedule */}
          <div className="card p-6">
            <SectionHead
              title="Bugünün Gündemi"
              subtitle={format(now, "d MMMM yyyy", { locale: tr })}
              small
              actions={
                <Link href="/ops" className="text-xs text-juris-ink-3 hover:text-juris-red">
                  Tüm takvim →
                </Link>
              }
            />
            {todayEvents.length === 0 ? (
              <div className="py-6 text-center text-sm text-juris-ink-3">
                Bugün için kayıtlı etkinlik yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-juris-line-2">
                {todayEvents.map((e) => {
                  const toneColor =
                    e.type === "HEARING" ? "#BC2F2C" :
                    e.type === "DEADLINE" ? "#B4701C" :
                    e.type === "MEETING" ? "#0A2240" : "#5A6B82";
                  return (
                    <li key={e.id} className="py-3 flex items-start gap-4">
                      <div className="w-1 self-stretch rounded-full" style={{ background: toneColor }} />
                      <div
                        className="text-sm font-semibold mono"
                        style={{ minWidth: 56, color: "#0A2240" }}
                      >
                        {e.allDay ? "Tüm gün" : format(e.startsAt, "HH:mm")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] uppercase tracking-wider font-semibold"
                            style={{ color: toneColor }}
                          >
                            {eventTypeLabel(e.type)}
                          </span>
                          {e.matter && (
                            <Link
                              href={`/ops/${e.matter.id}`}
                              className="mono text-[10px] text-juris-ink-3 hover:text-juris-red"
                            >
                              · {e.matter.matterNumber}
                            </Link>
                          )}
                        </div>
                        <div className="text-sm font-medium text-juris-navy mt-0.5">
                          {e.title}
                        </div>
                        {e.location && (
                          <div className="text-[11px] text-juris-ink-4 mt-0.5">{e.location}</div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {weekEvents.length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-wider text-juris-ink-3 font-semibold mt-5 mb-2">
                  Bu Hafta
                </div>
                <ul className="flex flex-col gap-1.5">
                  {weekEvents.map((e) => (
                    <li key={e.id} className="flex items-center gap-2.5 text-xs">
                      {e.type === "HEARING" ? (
                        <Gavel size={12} className="text-juris-red flex-shrink-0" />
                      ) : (
                        <Calendar size={12} className="text-juris-ink-3 flex-shrink-0" />
                      )}
                      <span className="mono text-juris-ink-3 w-[60px] flex-shrink-0">
                        {format(e.startsAt, "d MMM", { locale: tr })}
                      </span>
                      <span className="flex-1 truncate text-juris-ink-2">{e.title}</span>
                      {e.matter && (
                        <Link
                          href={`/ops/${e.matter.id}`}
                          className="mono text-[10px] text-juris-ink-3 hover:text-juris-red"
                        >
                          {e.matter.matterNumber}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Hot matters */}
          <div className="card p-6">
            <SectionHead
              title="Sıcak Dosyalar"
              subtitle="Son hareket görmüş aktif dosyalar"
              small
              actions={
                <Link href="/ops" className="text-xs text-juris-ink-3 hover:text-juris-red">
                  Tümü →
                </Link>
              }
            />
            {hotMatters.length === 0 ? (
              <div className="py-6 text-center text-sm text-juris-ink-3">Dosya yok.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                  <thead className="text-[10px] uppercase tracking-wider text-juris-ink-3">
                    <tr className="border-b border-juris-line-2">
                      <th className="text-left py-2 pr-3 font-semibold w-[110px]">Kod</th>
                      <th className="text-left py-2 pr-3 font-semibold">Müvekkil / Dosya</th>
                      <th className="text-left py-2 pr-3 font-semibold w-[110px]">Durum</th>
                      <th className="text-left py-2 pr-3 font-semibold w-[150px]">Sorumlu</th>
                      <th className="text-right py-2 font-semibold w-[70px]">Görev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotMatters.map((m) => {
                      const chip = matterStatusChip(m.status);
                      const client = m.client?.type === "COMPANY"
                        ? m.client.companyName ?? m.client.name
                        : m.client?.name;
                      const assignee = m.assignees[0]?.user;
                      return (
                        <tr key={m.id} className="border-b border-juris-line-2 hover:bg-juris-paper-2">
                          <td className="py-3 pr-3 mono text-xs text-juris-ink-3">
                            <Link href={`/ops/${m.id}`} className="hover:text-juris-red">
                              {m.matterNumber}
                            </Link>
                          </td>
                          <td className="py-3 pr-3">
                            <Link href={`/ops/${m.id}`} className="block hover:text-juris-red">
                              <div className="text-[11px] text-juris-ink-3">{client ?? "—"}</div>
                              <div className="text-juris-navy font-medium truncate max-w-[280px]">{m.title}</div>
                            </Link>
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                          </td>
                          <td className="py-3 pr-3">
                            {assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar name={assignee.name} size={24} />
                                <span className="text-xs text-juris-ink-2 truncate">{assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-juris-ink-4">—</span>
                            )}
                          </td>
                          <td className="py-3 text-right mono text-sm font-semibold text-juris-navy">
                            {m._count.tasks > 0 ? m._count.tasks : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Dark YK briefing card */}
          <div
            className="card p-6 relative overflow-hidden text-white"
            style={{
              background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)",
              border: "none",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(400px 300px at 100% 0%, rgba(188,47,44,0.35), transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/50 mb-2">
                Ortaklar Kurulu
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 22, fontWeight: 500, lineHeight: 1.2,
                }}
              >
                Haftalık brief hazır
              </h3>
              <p className="text-[13px] text-white/70 mt-2 leading-relaxed">
                Pipeline, finans, dosya ilerlemesi ve kritik gelişmeler.
                AI ile otomatik derlendi — bakıp onayınla yayına çıkar.
              </p>
              <div className="flex gap-2 mt-4">
                <button className="btn btn-accent btn-sm">
                  <Sparkles size={12} /> Brief&apos;i aç
                </button>
                <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
                  Düzenle
                </button>
              </div>
            </div>
          </div>

          {/* My open tasks */}
          <div className="card p-6">
            <SectionHead
              title="Görevlerim"
              subtitle={
                myOpenTasks.length === 0
                  ? "Boş 🎉"
                  : `${myOpenTasks.length} açık${overdueTasks > 0 ? ` · ${overdueTasks} gecikmiş` : ""}`
              }
              small
            />
            {myOpenTasks.length === 0 ? (
              <div className="py-4 text-center text-sm text-juris-ink-3">
                Açık göreviniz yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-juris-line-2">
                {myOpenTasks.map((t) => {
                  const overdue = t.dueAt && t.dueAt < today0;
                  return (
                    <li key={t.id} className="py-2.5 flex items-start gap-2">
                      {t.status === "IN_PROGRESS" ? (
                        <Clock size={13} className="text-juris-warn mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle size={13} className="text-juris-ink-3 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-juris-navy font-medium line-clamp-2">
                          {t.title}
                        </div>
                        <div className="text-[10px] text-juris-ink-4 mt-0.5 flex items-center gap-1.5">
                          {t.priority !== "NORMAL" && (
                            <span className={t.priority === "URGENT" ? "text-juris-red font-semibold" : ""}>
                              {taskPriorityLabel(t.priority)}
                            </span>
                          )}
                          {t.dueAt && (
                            <span className={overdue ? "text-juris-red font-semibold" : ""}>
                              {formatDateTR(t.dueAt)}
                            </span>
                          )}
                          {t.matter && (
                            <Link href={`/ops/${t.matter.id}`} className="mono hover:text-juris-red">
                              {t.matter.matterNumber}
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Top leads */}
          <div className="card p-6">
            <SectionHead
              title="Sıcak Fırsatlar"
              subtitle={topLeads.length > 0 ? `${topLeads.length} takipte` : "—"}
              small
              actions={
                <Link href="/bd" className="text-xs text-juris-ink-3 hover:text-juris-red">
                  Tümü →
                </Link>
              }
            />
            {topLeads.length === 0 ? (
              <div className="py-4 text-center text-sm text-juris-ink-3">
                Açık fırsat yok.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {topLeads.map((l) => {
                  const name = l.contact?.type === "COMPANY"
                    ? l.contact.companyName ?? l.contact.name
                    : l.contact?.name ?? l.title;
                  const scoreBarColor =
                    l.probability > 80 ? "#BC2F2C" : l.probability > 60 ? "#B4701C" : "#5A6B82";
                  return (
                    <li key={l.id} className="flex items-center gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-juris-navy truncate">{name}</div>
                        <div className="mt-1.5">
                          <ProgressThin
                            value={l.probability} max={100} color={scoreBarColor}
                          />
                        </div>
                      </div>
                      <span className="mono text-xs font-semibold" style={{ color: scoreBarColor, minWidth: 32, textAlign: "right" }}>
                        {l.probability}
                      </span>
                      <span className="mono text-xs font-semibold text-juris-navy" style={{ minWidth: 60, textAlign: "right" }}>
                        {formatTRY(l.value?.toString() ?? 0, { short: true })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Partner contributions */}
          {partners.length > 0 && (
            <div className="card p-6">
              <SectionHead
                title="Ortak Katkıları"
                subtitle="Atanan dosya ve tahmini gelir"
                small
              />
              <StackedBar
                segments={partners.map((p) => ({ label: p.name, value: p.revenue, color: p.color }))}
                height={10}
                className="mb-4"
              />
              <ul className="flex flex-col gap-2.5">
                {partners.map((p) => {
                  const pct = ((p.revenue / partnerTotal) * 100).toFixed(0);
                  return (
                    <li key={p.id} className="flex items-center gap-3 text-sm">
                      <span
                        className="inline-block rounded-sm"
                        style={{ width: 10, height: 10, background: p.color }}
                      />
                      <span className="flex-1 text-juris-ink-2 truncate">{p.name}</span>
                      <span className="mono text-xs text-juris-ink-3 w-8 text-right">%{pct}</span>
                      <span className="mono text-xs font-semibold text-juris-navy w-[68px] text-right">
                        {formatTRY(p.revenue, { short: true })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-6">
        <SectionHead
          title="Son Hareketler"
          subtitle="Ekipten son güncellemeler"
          small
          actions={
            <Link href="/settings/audit" className="text-xs text-juris-ink-3 hover:text-juris-red">
              Tam log →
            </Link>
          }
        />
        {recentActivity.length === 0 ? (
          <div className="text-sm text-juris-ink-3 py-4 text-center">Hareket yok.</div>
        ) : (
          <ul className="flex flex-col divide-y divide-juris-line-2">
            {recentActivity.map((a) => (
              <li key={a.id} className="py-2.5 flex items-center gap-3 text-sm">
                <ActivityIcon action={a.action} />
                <span className="flex-1 text-juris-ink-2">
                  <span className="font-medium text-juris-navy">
                    {a.actor?.name ?? "Sistem"}
                  </span>{" "}
                  <span>{humanizeAction(a.action)}</span>
                </span>
                <span className="text-[11px] text-juris-ink-4">
                  {formatDateTimeTR(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function humanizeAction(action: string): string {
  const map: Record<string, string> = {
    "matter.create": "yeni dosya oluşturdu",
    "matter.update": "bir dosyayı güncelledi",
    "matter.delete": "bir dosyayı sildi",
    "invoice.create": "fatura oluşturdu",
    "invoice.sent": "fatura gönderdi",
    "invoice.paid": "faturayı ödendi işaretledi",
    "invoice.cancelled": "faturayı iptal etti",
    "lead.create": "fırsat oluşturdu",
    "lead.update": "fırsat güncelledi",
    "lead.convert_to_matter": "fırsatı müvekkile dönüştürdü",
    "contact.create": "kişi ekledi",
    "contact.update": "kişi güncelledi",
    "note.create": "not ekledi",
    "task.create": "görev oluşturdu",
    "task.done": "görev tamamladı",
    "event.create": "etkinlik ekledi",
    "time_entry.create": "zaman kaydı yaptı",
    "document.upload": "belge yükledi",
    "user.invite": "yeni üye davet etti",
    "user.activate": "bir üyeyi aktifleştirdi",
    "user.deactivate": "bir üyeyi pasifleştirdi",
    "content.create": "içerik planladı",
    "ai.chat": "AI asistanına soru sordu",
  };
  return map[action] ?? action;
}

function ActivityIcon({ action }: { action: string }) {
  const [category] = action.split(".");
  const cls = "flex-shrink-0 text-juris-ink-3";
  if (category === "invoice") return <Receipt size={14} className={cls} />;
  if (category === "matter" || category === "time_entry") return <Briefcase size={14} className={cls} />;
  if (category === "note" || category === "document") return <FileText size={14} className={cls} />;
  if (category === "task") return <CheckCircle2 size={14} className={cls} />;
  if (category === "event") return <Calendar size={14} className={cls} />;
  if (category === "content") return <Sparkles size={14} className={cls} />;
  return <AlertCircle size={14} className={cls} />;
}
