import Link from "next/link";
import { Plus, TrendingUp, LayoutGrid, List, Filter } from "lucide-react";
import { LeadStage } from "@prisma/client";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { Avatar } from "@/components/ui/avatar";
import { leadStageLabel } from "@/lib/labels";
import { formatTRY, formatDateTR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "İş Geliştirme · Pipeline" };

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: "NEW", label: "Yeni", color: "#5A6B82" },
  { key: "QUALIFIED", label: "Nitelikli", color: "#1F5AA8" },
  { key: "MEETING", label: "Görüşme", color: "#B4701C" },
  { key: "PROPOSAL", label: "Teklif", color: "#BC2F2C" },
  { key: "NEGOTIATION", label: "Müzakere", color: "#0A2240" },
  { key: "WON", label: "Kazanıldı", color: "#1F7A4E" },
];

export default async function BdPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: "kanban" | "list" }>;
}) {
  const { firmId } = await requireTenant();
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "kanban";

  const [leads, openCount, totalValue, wonCount, lostCount] = await Promise.all([
    prisma.lead.findMany({
      where: { firmId },
      orderBy: [{ probability: "desc" }, { updatedAt: "desc" }],
      take: 120,
      include: {
        contact: { select: { name: true, companyName: true, type: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.lead.count({ where: { firmId, stage: { notIn: ["WON", "LOST"] } } }),
    prisma.lead.aggregate({
      where: { firmId, stage: { notIn: ["WON", "LOST"] } },
      _sum: { value: true },
    }),
    prisma.lead.count({ where: { firmId, stage: "WON" } }),
    prisma.lead.count({ where: { firmId, stage: "LOST" } }),
  ]);

  const pipelineValue = totalValue._sum.value?.toNumber() ?? 0;
  const decisionTotal = wonCount + lostCount;
  const conversionRate = decisionTotal > 0 ? (wonCount / decisionTotal) * 100 : 0;

  // Group by stage for kanban
  const byStage: Record<string, typeof leads> = {};
  for (const s of STAGES) byStage[s.key] = [];
  for (const l of leads) {
    if (!byStage[l.stage]) byStage[l.stage] = [];
    byStage[l.stage].push(l);
  }

  const stageSum = (stage: LeadStage) =>
    (byStage[stage] ?? []).reduce((s, l) => s + (l.value?.toNumber() ?? 0), 0);

  return (
    <div className="px-6 py-8 max-w-[1600px] mx-auto">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <Kpi label="Açık Fırsat" value={openCount} emphasized />
        <Kpi label="Pipeline" value={formatTRY(pipelineValue, { short: true })} sub="ağırlıksız toplam" />
        <Kpi label="Kazanılan" value={wonCount} sub="tüm zamanlar" />
        <Kpi
          label="Dönüşüm"
          value={decisionTotal === 0 ? "—" : `%${conversionRate.toFixed(0)}`}
          sub={`${wonCount}W · ${lostCount}L`}
          trend={conversionRate >= 30 ? "up" : decisionTotal > 0 ? "down" : undefined}
        />
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <SectionHead
          title="Fırsatlar"
          subtitle="Müvekkil adayı pipeline'ı"
          small
        />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-juris-line overflow-hidden bg-white">
            <Link
              href="/bd"
              className={cn(
                "px-3 h-9 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors",
                view === "kanban" ? "bg-juris-navy text-white" : "text-juris-ink-2 hover:bg-juris-paper-2",
              )}
            >
              <LayoutGrid size={13} /> Kanban
            </Link>
            <Link
              href="/bd?view=list"
              className={cn(
                "px-3 h-9 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors border-l border-juris-line",
                view === "list" ? "bg-juris-navy text-white" : "text-juris-ink-2 hover:bg-juris-paper-2",
              )}
            >
              <List size={13} /> Liste
            </Link>
          </div>
          <button className="btn btn-ghost btn-sm hidden md:inline-flex">
            <Filter size={12} /> Filtre
          </button>
          <Link href="/bd/new" className="btn btn-primary btn-sm">
            <Plus size={13} /> Yeni Fırsat
          </Link>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <TrendingUp size={28} className="text-juris-ink-3 mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">İlk fırsatınızı ekleyin</h3>
          <p className="text-sm text-juris-ink-3 max-w-md mb-5">
            LinkedIn, referans ya da web üzerinden gelen potansiyel müvekkilleri burada takip edin —
            fikirden kapanışa kadar görünürlükle.
          </p>
          <Link href="/bd/new" className="btn btn-primary">
            <Plus size={14} /> İlk Fırsatı Oluştur
          </Link>
        </div>
      ) : view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
          {STAGES.map((s) => {
            const stageLeads = byStage[s.key] ?? [];
            const sum = stageSum(s.key);
            return (
              <div
                key={s.key}
                className="flex-shrink-0 w-[300px] flex flex-col gap-2"
              >
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-md"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    borderLeft: `3px solid ${s.color}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: s.color }}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-juris-ink-3 mono">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="mono text-[11px] font-semibold text-juris-navy">
                    {sum > 0 ? formatTRY(sum, { short: true }) : "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-2 min-h-[120px]">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-juris-ink-4">
                      Boş
                    </div>
                  ) : (
                    stageLeads.map((l) => {
                      const name = l.contact?.type === "COMPANY"
                        ? l.contact.companyName ?? l.contact.name
                        : l.contact?.name ?? "—";
                      const probColor = l.probability >= 80 ? "#BC2F2C" : l.probability >= 60 ? "#B4701C" : "#5A6B82";
                      return (
                        <Link
                          key={l.id}
                          href={`/bd/${l.id}`}
                          className="bg-white rounded-md p-3 border border-juris-line hover:border-juris-navy-200 hover:shadow-juris-md transition-all block"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm text-juris-navy line-clamp-1">{l.title}</div>
                            <span
                              className="mono text-[10px] font-semibold flex-shrink-0"
                              style={{ color: probColor }}
                            >
                              {l.probability}
                            </span>
                          </div>
                          <div className="text-[11px] text-juris-ink-3 mt-0.5 truncate">{name}</div>
                          <div className="flex items-center justify-between mt-2.5 gap-2">
                            <div className="mono text-xs font-semibold text-juris-navy">
                              {l.value ? formatTRY(l.value.toString(), { short: true }) : "—"}
                            </div>
                            {l.owner && (
                              <Avatar name={l.owner.name} size={20} />
                            )}
                          </div>
                          {l.source && (
                            <div className="mt-2 text-[10px] text-juris-ink-4 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-juris-ink-4" />
                              {l.source}
                            </div>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Başlık</th>
                <th className="text-left px-4 py-3 font-semibold">Aday</th>
                <th className="text-left px-4 py-3 font-semibold w-[110px]">Aşama</th>
                <th className="text-left px-4 py-3 font-semibold w-[70px]">Skor</th>
                <th className="text-right px-4 py-3 font-semibold w-[100px]">Değer</th>
                <th className="text-left px-4 py-3 font-semibold w-[130px]">Sahip</th>
                <th className="text-left px-4 py-3 font-semibold w-[110px]">Güncelleme</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const name = l.contact?.type === "COMPANY"
                  ? l.contact.companyName ?? l.contact.name
                  : l.contact?.name ?? "—";
                const probColor = l.probability >= 80 ? "#BC2F2C" : l.probability >= 60 ? "#B4701C" : "#5A6B82";
                return (
                  <tr key={l.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                    <td className="px-4 py-3 font-medium text-juris-navy">
                      <Link href={`/bd/${l.id}`} className="hover:text-juris-red">
                        {l.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-juris-ink-2">{name}</td>
                    <td className="px-4 py-3">
                      <span className="chip">{leadStageLabel(l.stage)}</span>
                    </td>
                    <td className="px-4 py-3 mono font-semibold" style={{ color: probColor }}>
                      {l.probability}
                    </td>
                    <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                      {l.value ? formatTRY(l.value.toString(), { short: true }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {l.owner ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={l.owner.name} size={22} />
                          <span className="text-juris-ink-2 text-xs">{l.owner.name}</span>
                        </div>
                      ) : (
                        <span className="text-juris-ink-4 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-juris-ink-3">{formatDateTR(l.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
