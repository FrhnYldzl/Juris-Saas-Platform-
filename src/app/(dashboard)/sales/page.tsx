import Link from "next/link";
import {
  Plus, Filter, FileText, ExternalLink, RotateCw, Sparkles,
} from "lucide-react";
import { startOfMonth } from "date-fns";
import type { LeadStage, ProposalTemplateModel } from "@prisma/client";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { Avatar } from "@/components/ui/avatar";
import { formatTRY, formatRelativeTR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ViewToggle, AssigneeChips } from "./sales-controls";

export const metadata = { title: "Satış · Pipeline" };

type ViewKey = "kanban" | "huni" | "liste";

// Stage ordering + display labels matching design
const STAGE_ORDER: LeadStage[] = [
  "NEW", "QUALIFIED", "MEETING", "PROPOSAL",
  "NEGOTIATION", "CONTRACT", "SIGNING", "WON",
];
const STAGE_LABEL: Record<LeadStage, string> = {
  NEW: "Lead",
  QUALIFIED: "İlk Görüşme",
  MEETING: "Scope",
  PROPOSAL: "Teklif",
  NEGOTIATION: "Müzakere",
  CONTRACT: "Sözleşme",
  SIGNING: "İmza",
  WON: "Kazanıldı",
  LOST: "Kayıp",
};
// Column colors for kanban header + tapered bar
const STAGE_COLOR: Record<LeadStage, string> = {
  NEW: "#8895AB",         // gray cold
  QUALIFIED: "#5A6B82",   // gray-navy
  MEETING: "#2B5185",     // mid navy
  PROPOSAL: "#0A2240",    // dark navy
  NEGOTIATION: "#BC2F2C", // red
  CONTRACT: "#BC2F2C",
  SIGNING: "#BC2F2C",
  WON: "#147D5C",         // green
  LOST: "#8895AB",
};

const SOURCE_COLOR: Record<string, string> = {
  "Referans":  "#BC2F2C",
  "Network":   "#0A2240",
  "LinkedIn":  "#0077B5",
  "Web":       "#147D5C",
  "Etkinlik":  "#B4701C",
  "E-bülten":  "#8895AB",
};

const TEMPLATE_MODEL_LABEL: Record<ProposalTemplateModel, string> = {
  RETAINER: "RETAINER",
  FLAT_FEE: "SABİT ÜCRET",
  PROJECT: "PROJE",
  RETAINER_PLUS_PROJECT: "RETAINER + PROJE",
  FILE_BASED: "DOSYA BAZLI",
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: ViewKey; assignee?: string }>;
}) {
  const { firmId } = await requireTenant();
  const params = await searchParams;
  const view: ViewKey = params.view ?? "kanban";
  const assigneeFilter = params.assignee;

  const mStart = startOfMonth(new Date());

  const [leads, closedMonth, wonYtd, totalLeadsYtd, templates, assignees] = await Promise.all([
    prisma.lead.findMany({
      where: { firmId, stage: { not: "LOST" } },
      orderBy: [{ stage: "asc" }, { value: "desc" }],
    }),
    prisma.lead.aggregate({
      where: { firmId, stage: "WON", updatedAt: { gte: mStart } },
      _sum: { value: true },
    }),
    prisma.lead.count({ where: { firmId, stage: "WON" } }),
    prisma.lead.count({ where: { firmId } }),
    prisma.proposalTemplate.findMany({
      where: { firmId },
      orderBy: { usageCount: "desc" },
    }),
    prisma.lead.findMany({
      where: { firmId, assigneeName: { not: null } },
      select: { assigneeName: true },
      distinct: ["assigneeName"],
    }).then((rows) => rows.map((r) => r.assigneeName).filter(Boolean) as string[]),
  ]);

  const filteredLeads = assigneeFilter
    ? leads.filter((l) => l.assigneeName === assigneeFilter)
    : leads;

  // Open pipeline = everything except LOST and WON
  const openLeads = filteredLeads.filter((l) => l.stage !== "WON");
  const openTotal = openLeads.reduce((s, l) => s + (l.value?.toNumber() ?? 0), 0);
  const weightedTotal = openLeads.reduce(
    (s, l) => s + ((l.value?.toNumber() ?? 0) * l.probability) / 100, 0,
  );
  const closedMonthVal = closedMonth._sum.value?.toNumber() ?? 0;
  const winRate = totalLeadsYtd > 0 ? Math.round((wonYtd / totalLeadsYtd) * 100) : 0;

  return (
    <div className="px-6 py-8 max-w-[1540px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-2">
            Satış · Pipeline
          </div>
          <h1
            className="display leading-tight"
            style={{
              fontSize: "clamp(28px, 3.4vw, 36px)",
              color: "#0A2240", letterSpacing: "-0.015em",
            }}
          >
            Lead&apos;den{" "}
            <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>imzaya</em>, tek akışta.
          </h1>
          <p className="text-sm text-juris-ink-3 mt-2">
            {openLeads.length} aktif görüşme · {formatTRY(openTotal, { short: true })} toplam pipeline · Ağırlıklı {formatTRY(weightedTotal, { short: true })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-md text-[11px] font-semibold"
            style={{ background: "white", border: "1px solid #E5E9F0", color: "#5A6B82" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-juris-success" />
            <span className="uppercase tracking-wider text-[10px]" style={{ color: "#8895AB" }}>
              Kaynaklar
            </span>
            <span className="text-juris-navy">3/4 bağlı</span>
            <span className="text-juris-ink-4">·</span>
            <span className="text-juris-ink-3">Drive</span>
          </div>
          <button className="btn btn-ghost">
            <FileText size={14} /> Şablonlar
          </button>
          <button className="btn btn-ghost">
            <Filter size={14} /> Filtre
          </button>
          <Link href="/bd/new" className="btn btn-primary">
            <Plus size={14} /> Yeni lead
          </Link>
        </div>
      </div>

      {/* 5 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-7">
        <Kpi
          label="Açık Pipeline"
          value={formatTRY(openTotal, { short: true })}
          sub={`${openLeads.length} fırsat`}
          emphasized
        />
        <Kpi
          label="Ağırlıklı Pipeline"
          value={formatTRY(weightedTotal, { short: true })}
          sub="Kazanma olasılığı × değer"
        />
        <Kpi
          label="Bu Ay Kapatılan"
          value={formatTRY(closedMonthVal, { short: true })}
          delta="+32%"
          trend="up"
        />
        <Kpi
          label="Kazanma Oranı"
          value={winRate}
          suffix="%"
          sub="YTD · hedef 72%"
        />
        <Kpi
          label="Ort. Teklif→İmza"
          value="24"
          sub="gün · Geçen Q: 31"
        />
      </div>

      {/* View + filter row */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <ViewToggle active={view} />
        <AssigneeChips
          active={assigneeFilter ?? "all"}
          names={assignees}
          view={view}
        />
      </div>

      {view === "kanban" && <KanbanView leads={filteredLeads} />}
      {view === "huni" && <HuniView leads={filteredLeads} />}
      {view === "liste" && <ListeView leads={filteredLeads} />}

      {/* Lead Kaynak ROI + Kayıp Sebepleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
        <LeadKaynakROI />
        <KayipSebepleri />
      </div>

      {/* Teklif Şablonları */}
      <div className="mt-6">
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3
                className="text-juris-navy leading-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 22, fontWeight: 500,
                }}
              >
                Teklif Şablonları
              </h3>
              <div className="text-xs text-juris-ink-3 mt-1 flex items-center gap-1.5">
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)" }}
                >
                  G
                </span>
                Google Drive senkronize ·{" "}
                <span className="text-juris-success font-semibold">● Bağlı</span>
                <span>· son senkron 4 dk önce</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm">
                <RotateCw size={11} /> Şimdi senkronize et
              </button>
              <button className="btn btn-sm btn-primary">
                <Plus size={11} /> Drive&apos;dan ekle
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {templates.map((t) => (
              <div key={t.id} className="card p-4 relative hover:border-juris-navy-200 transition-all">
                <div
                  className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(66,133,244,0.08)", color: "#4285F4" }}
                >
                  <span
                    className="inline-flex items-center justify-center w-3 h-3 rounded text-[8px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)" }}
                  >
                    G
                  </span>
                  Drive
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-juris-red mb-2">
                  {TEMPLATE_MODEL_LABEL[t.model]}
                </div>
                <h4
                  className="text-juris-navy leading-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 16, fontWeight: 500,
                  }}
                >
                  {t.name}
                </h4>
                <div className="text-[11px] text-juris-ink-3 mt-2">
                  {t.sectionCount} bölüm · {t.usageCount} kez kullanıldı
                </div>
                <div className="text-[11px] text-juris-ink-4 mt-0.5">
                  Son kullanım:{" "}
                  {t.lastUsedAt ? formatRelativeTR(t.lastUsedAt) : "—"}
                </div>
                <a
                  href={t.driveUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-juris-red font-semibold mt-3 hover:underline"
                >
                  Drive&apos;da aç <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-juris-line-2 flex items-center justify-between text-[11px] text-juris-ink-3">
            <span>📂 Drive klasörü: <code className="mono">/Juris/Teklif Şablonları</code></span>
            <span>Değişiklikler otomatik senkronlanır · 5 üyenin düzenleme yetkisi var</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================== KANBAN ==============================

type LeadRow = {
  id: string;
  title: string;
  clientName: string | null;
  topic: string | null;
  pricingModel: string | null;
  stage: LeadStage;
  value: import("@prisma/client").Prisma.Decimal | null;
  probability: number;
  source: string | null;
  nextActionText: string | null;
  nextActionAt: Date | null;
  assigneeName: string | null;
};

function KanbanView({ leads }: { leads: LeadRow[] }) {
  const grouped: Record<LeadStage, LeadRow[]> = {
    NEW: [], QUALIFIED: [], MEETING: [], PROPOSAL: [],
    NEGOTIATION: [], CONTRACT: [], SIGNING: [], WON: [], LOST: [],
  };
  for (const l of leads) (grouped[l.stage] ??= []).push(l);

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <div className="flex gap-3" style={{ minWidth: "fit-content" }}>
        {STAGE_ORDER.map((stage) => {
          const items = grouped[stage] ?? [];
          const sum = items.reduce((s, l) => s + (l.value?.toNumber() ?? 0), 0);
          const color = STAGE_COLOR[stage];
          return (
            <div key={stage} className="flex-shrink-0 w-[220px]">
              {/* Column header */}
              <div
                className="rounded-t-md px-3 py-2.5 text-white"
                style={{ background: color }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.14em] font-semibold">
                    {STAGE_LABEL[stage]}
                  </span>
                  <span className="text-[10px] mono opacity-75">
                    {items.length}
                  </span>
                </div>
                <div className="mono text-[13px] font-semibold mt-0.5">
                  {formatTRY(sum, { short: true })}
                </div>
              </div>
              {/* Column body */}
              <div
                className="rounded-b-md pt-2 flex flex-col gap-2"
                style={{
                  background: "#F4F7FB",
                  border: "1px solid #E5E9F0",
                  borderTop: "none",
                  minHeight: 300,
                  paddingLeft: 8, paddingRight: 8, paddingBottom: 8,
                }}
              >
                {items.map((l) => {
                  const clientName = l.clientName ?? l.title.split(" — ")[0];
                  const topic = l.topic ?? l.title.split(" — ")[1];
                  return (
                    <Link
                      key={l.id}
                      href={`/bd/${l.id}`}
                      className="block bg-white rounded-md p-3 border border-juris-line hover:shadow-juris-md transition-all"
                      style={{ borderLeft: `2px solid ${color}` }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-juris-navy leading-tight">
                          {clientName}
                        </span>
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: SOURCE_COLOR[l.source ?? ""] ?? "#8895AB" }}
                        />
                      </div>
                      {topic && (
                        <div className="text-[11px] text-juris-ink-3 mt-0.5 line-clamp-1">
                          {topic}
                        </div>
                      )}
                      <div className="flex items-baseline justify-between mt-2">
                        <span className="mono text-[13px] font-semibold text-juris-navy">
                          {formatTRY(l.value?.toString() ?? 0, { short: true })}
                        </span>
                        <span className="mono text-[11px] text-juris-ink-3">
                          %{l.probability}
                        </span>
                      </div>
                      {l.source && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-juris-line-2 text-[10px] text-juris-ink-3">
                          <Avatar name={l.assigneeName ?? "?"} size={14} color={SOURCE_COLOR[l.source] ?? "#8895AB"} />
                          <span className="mono">
                            {Math.floor(Math.random() * 30) + 1}g · {l.source}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-[10px] text-juris-ink-4 text-center py-4">
                    Boş
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================== HUNİ GÖRSEL ==============================

function HuniView({ leads }: { leads: LeadRow[] }) {
  const stages = STAGE_ORDER.map((stage) => {
    const items = leads.filter((l) => l.stage === stage);
    const sum = items.reduce((s, l) => s + (l.value?.toNumber() ?? 0), 0);
    return { stage, label: STAGE_LABEL[stage], count: items.length, sum, color: STAGE_COLOR[stage] };
  });
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-3">
        {stages.map((s) => {
          // Width tapers from 100% (first stage) to ~35% (last stage)
          const idx = STAGE_ORDER.indexOf(s.stage);
          const widthPct = 100 - (idx * 8);
          const barWidth = Math.max((s.count / maxCount) * widthPct, s.count > 0 ? 18 : 0);
          return (
            <div key={s.stage} className="flex items-center gap-3">
              <div className="w-[120px] text-[12px] font-semibold text-juris-ink-2">
                {s.label}
              </div>
              <div className="relative flex-1 h-10">
                <div
                  className="h-full rounded flex items-center px-4 text-white text-[12px] font-semibold transition-all"
                  style={{
                    width: `${barWidth}%`,
                    background: s.color,
                    minWidth: s.count > 0 ? 60 : 0,
                  }}
                >
                  {s.count > 0 && `${s.count} fırsat`}
                </div>
              </div>
              <div className="mono text-[13px] font-semibold w-[80px] text-right" style={{ color: s.color }}>
                {formatTRY(s.sum, { short: true })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================== LİSTE ==============================

function ListeView({ leads }: { leads: LeadRow[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm min-w-[1100px]">
        <thead className="bg-juris-paper-2 text-juris-ink-3 text-[10px] uppercase tracking-wider">
          <tr>
            <th className="text-left px-5 py-3 font-semibold">Müvekkil · Konu</th>
            <th className="text-left px-4 py-3 font-semibold w-[170px]">Model</th>
            <th className="text-left px-3 py-3 font-semibold w-[130px]">Aşama</th>
            <th className="text-left px-3 py-3 font-semibold w-[130px]">Kaynak</th>
            <th className="text-left px-3 py-3 font-semibold w-[110px]">Sorumlu</th>
            <th className="text-left px-3 py-3 font-semibold w-[180px]">Sıradaki</th>
            <th className="text-right px-3 py-3 font-semibold w-[70px]">Olasılık</th>
            <th className="text-right px-5 py-3 font-semibold w-[100px]">Değer</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
              <td className="px-5 py-3">
                <Link href={`/bd/${l.id}`} className="block hover:text-juris-red">
                  <div className="font-semibold text-juris-navy">{l.clientName ?? "—"}</div>
                  <div className="text-[11px] text-juris-red">{l.topic ?? ""}</div>
                </Link>
              </td>
              <td className="px-4 py-3 text-xs text-juris-ink-3">{l.pricingModel ?? "—"}</td>
              <td className="px-3 py-3">
                <span
                  className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded"
                  style={{
                    background: STAGE_COLOR[l.stage],
                    color: l.stage === "WON" ? "white" : "white",
                  }}
                >
                  {STAGE_LABEL[l.stage]}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-juris-ink-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: SOURCE_COLOR[l.source ?? ""] ?? "#8895AB" }}
                  />
                  {l.source ?? "—"}
                </span>
              </td>
              <td className="px-3 py-3">
                {l.assigneeName ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar name={l.assigneeName} size={22} />
                    <span className="text-xs text-juris-ink-2">{l.assigneeName}</span>
                  </div>
                ) : (
                  <span className="text-xs text-juris-ink-4">—</span>
                )}
              </td>
              <td className="px-3 py-3 text-xs text-juris-red font-semibold">
                {l.nextActionText ?? "—"}
              </td>
              <td className="px-3 py-3 mono text-right text-sm font-semibold">
                %{l.probability}
              </td>
              <td className="px-5 py-3 mono text-right text-sm font-semibold text-juris-navy">
                {formatTRY(l.value?.toString() ?? 0, { short: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================== LEAD KAYNAK ROI ==============================

function LeadKaynakROI() {
  // Mocked stats per design
  const rows = [
    { name: "Referans", revenue: 4800000, won: 22, total: 42, winRate: 52, color: "#BC2F2C" },
    { name: "Network",  revenue: 3200000, won: 11, total: 28, winRate: 39, color: "#0A2240" },
    { name: "LinkedIn", revenue: 1900000, won: 8,  total: 34, winRate: 24, color: "#0077B5" },
    { name: "Web",      revenue: 1100000, won: 5,  total: 22, winRate: 23, color: "#147D5C" },
    { name: "Etkinlik", revenue: 800000,  won: 3,  total: 12, winRate: 25, color: "#B4701C" },
    { name: "E-bülten", revenue: 300000,  won: 1,  total: 4,  winRate: 25, color: "#8895AB" },
  ];
  const maxRevenue = Math.max(...rows.map((r) => r.revenue));
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-5">
        <h3
          className="text-juris-navy leading-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 500,
          }}
        >
          Lead Kaynak ROI
        </h3>
        <span className="text-[11px] text-juris-ink-3">Son 12 ay</span>
      </div>
      <ul className="flex flex-col gap-3.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 w-[90px]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
              <span className="text-[12px] text-juris-ink-2">{r.name}</span>
            </div>
            <div className="flex-1 h-1 rounded-full bg-juris-line-2 overflow-hidden">
              <div
                style={{
                  width: `${(r.revenue / maxRevenue) * 100}%`,
                  height: "100%",
                  background: r.color,
                }}
              />
            </div>
            <span className="mono text-[12px] font-semibold text-juris-navy w-[60px] text-right">
              {formatTRY(r.revenue, { short: true })}
            </span>
            <span className="mono text-[10px] text-juris-ink-3 w-[90px] text-right">
              {r.won}/{r.total} · %{r.winRate}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================== KAYIP SEBEPLERİ ==============================

function KayipSebepleri() {
  const rows = [
    { name: "Fiyat — rakip daha düşük",   count: 14, pct: 34, delta: 4,  width: 100 },
    { name: "Scope uyumsuzluğu",          count: 9,  pct: 22, delta: -2, width: 65 },
    { name: "Karar ertelendi",            count: 7,  pct: 18, delta: 1,  width: 52 },
    { name: "İç ekiple halledildi",       count: 5,  pct: 12, delta: 0,  width: 36 },
    { name: "Mevcut hukuk bürosuyla kaldı", count: 4, pct: 10, delta: -3, width: 30 },
    { name: "Diğer",                      count: 2,  pct: 4,  delta: 0,  width: 14 },
  ];
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-5">
        <h3
          className="text-juris-navy leading-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 500,
          }}
        >
          Kayıp Sebepleri
        </h3>
        <button className="text-[11px] text-juris-red font-semibold hover:underline">
          AI analiz
        </button>
      </div>
      <ul className="flex flex-col gap-3.5">
        {rows.map((r) => (
          <li key={r.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] text-juris-ink-2">{r.name}</span>
              <div className="flex items-center gap-3 mono text-[11px] text-juris-ink-3">
                <span className="font-semibold text-juris-red">{r.count}</span>
                <span>({r.pct}%)</span>
                <span
                  className={cn(
                    "w-[30px] text-right font-semibold",
                    r.delta > 0 ? "text-juris-red" : r.delta < 0 ? "text-juris-success" : "text-juris-ink-4",
                  )}
                >
                  {r.delta > 0 ? "+" : ""}
                  {r.delta === 0 ? "0" : r.delta}
                </span>
              </div>
            </div>
            <div className="h-1 rounded-full bg-juris-line-2 overflow-hidden">
              <div
                style={{
                  width: `${r.width}%`,
                  height: "100%",
                  background: "#BC2F2C",
                  opacity: 0.7,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div
        className="mt-5 rounded px-4 py-3 flex items-start gap-2 text-[12px] text-juris-ink-2"
        style={{ background: "#FFF9F0", borderLeft: "3px solid #B4701C" }}
      >
        <Sparkles size={12} className="text-juris-warn flex-shrink-0 mt-0.5" />
        <span>
          <span className="font-semibold text-juris-warn">AI önerisi:</span>{" "}
          Fiyat kayıpları %4 arttı. Retainer modelini pilot olarak 2-3 orta ölçekli
          teklifte dene.
        </span>
      </div>
    </div>
  );
}
