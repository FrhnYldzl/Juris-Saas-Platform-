import Link from "next/link";
import {
  Plus, Calendar, FileText, Sparkles, ArrowRight, ExternalLink,
  CheckCircle2, Gavel,
} from "lucide-react";
import { startOfDay, endOfDay, endOfWeek, startOfWeek, format } from "date-fns";
import { tr } from "date-fns/locale";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { Avatar } from "@/components/ui/avatar";
import { formatTRY, formatRelativeTR, formatDateTR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { OpsTabs } from "./ops-tabs";

export const metadata = { title: "Operasyonlar" };

type TabKey = "ozet" | "danismanlik" | "uyusmazlik";

const DISPUTE_METHOD_META: Record<string, { label: string; tone: "navy" | "amber" | "teal" | "gray" }> = {
  DAVA:           { label: "DAVA",           tone: "navy"  },
  ICRA:           { label: "İcra",           tone: "navy"  },
  TAHKIM:         { label: "Tahkim",         tone: "amber" },
  SIGORTA_TAHKIM: { label: "Sigorta Tahkim", tone: "teal"  },
  IHTARNAME:      { label: "İhtarname",      tone: "gray"  },
};

export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: TabKey; cat?: string; method?: string }>;
}) {
  const { firmId } = await requireTenant();
  const params = await searchParams;
  const tab: TabKey = params.tab ?? "ozet";

  const now = new Date();
  const weekStart = startOfWeek(now, { locale: tr });
  const weekEnd = endOfWeek(now, { locale: tr });
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Consulting is CONSULTING type, disputes are everything else except ACTIVE non-consulting
  const [
    consulting, disputes,
    totalConsulting, totalDisputes,
    hearingsWeek, hearingsToday,
    declarationsWeek, urgentDeclarations,
    totalDisputeValue, riskConsulting,
    consultingRevenue,
  ] = await Promise.all([
    prisma.matter.findMany({
      where: { firmId, type: "CONSULTING", status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { name: true, companyName: true, type: true } },
        _count: { select: { documents: true } },
      },
    }),
    prisma.matter.findMany({
      where: {
        firmId, status: "ACTIVE",
        disputeMethod: { not: null },
      },
      orderBy: [{ isUrgent: "desc" }, { nextActionAt: "asc" }],
      include: {
        client: { select: { name: true, companyName: true, type: true } },
      },
    }),
    prisma.matter.count({
      where: { firmId, type: "CONSULTING", status: "ACTIVE" },
    }),
    prisma.matter.count({
      where: { firmId, status: "ACTIVE", disputeMethod: { not: null } },
    }),
    prisma.matter.count({
      where: {
        firmId, status: "ACTIVE",
        nextHearingAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.matter.count({
      where: {
        firmId, status: "ACTIVE",
        nextHearingAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.matter.count({
      where: {
        firmId, status: "ACTIVE",
        nextActionType: { in: ["Beyan Sunma", "Yazılı Savunma"] },
        nextActionAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.matter.count({
      where: {
        firmId, status: "ACTIVE",
        isUrgent: true,
        nextActionType: { in: ["Beyan Sunma", "Yazılı Savunma"] },
      },
    }),
    prisma.matter.aggregate({
      where: { firmId, status: "ACTIVE", disputeValue: { not: null } },
      _sum: { disputeValue: true },
    }),
    prisma.matter.count({
      where: { firmId, type: "CONSULTING", status: "ACTIVE", isUrgent: true },
    }),
    prisma.matter.aggregate({
      where: { firmId, type: "CONSULTING", status: "ACTIVE" },
      _sum: { monthlyFee: true },
    }),
  ]);

  const tabCounts = { consulting: totalConsulting, dispute: totalDisputes };
  const monthlyRev = consultingRevenue._sum.monthlyFee?.toNumber() ?? 0;
  const totalDispVal = totalDisputeValue._sum.disputeValue?.toNumber() ?? 0;

  const pageEyebrow =
    tab === "ozet" ? "OPERASYONLAR · ÖZET" :
    tab === "danismanlik" ? "OPERASYONLAR · DANIŞMANLIK" :
    "OPERASYONLAR · UYUŞMAZLIK YÖNETİMİ";

  const pageTitle =
    tab === "ozet" ? (<>İki koldan <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>operasyon</em>.</>) :
    tab === "danismanlik" ? (<>Müvekkil bazlı <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>proje yönetimi</em>.</>) :
    (<>Taraf, yöntem, <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>takvim</em>.</>);

  const pageSubtitle =
    tab === "ozet" ? `${totalConsulting} danışmanlık · ${totalDisputes} uyuşmazlık · Drive + UYAP + Takvim senkron` :
    tab === "danismanlik" ? `${totalConsulting} aktif danışmanlık · Drive ile belge senkron · Google Takvim ile adımlar` :
    `${totalDisputes} aktif uyuşmazlık · UYAP + Takvim senkron · Duruşma ve beyan tarihleri otomatik takip`;

  return (
    <div className="px-6 py-8 max-w-[1540px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-2">
            {pageEyebrow}
          </div>
          <h1
            className="display leading-tight"
            style={{
              fontSize: "clamp(28px, 3.4vw, 36px)",
              color: "#0A2240", letterSpacing: "-0.015em",
            }}
          >
            {pageTitle}
          </h1>
          <p className="text-sm text-juris-ink-3 mt-2 max-w-3xl">{pageSubtitle}</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Kaynaklar chip */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-md text-[11px] font-semibold"
            style={{ background: "white", border: "1px solid #E5E9F0", color: "#5A6B82" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-juris-success" />
            <span className="uppercase tracking-wider text-[10px]" style={{ color: "#8895AB" }}>
              Kaynaklar
            </span>
            <span className="text-juris-navy">
              {tab === "uyusmazlik" ? "4/4" : "3/3"} bağlı
            </span>
            <span className="text-juris-ink-4">·</span>
            <span className="text-juris-ink-3">Drive</span>
          </div>
          <button className="btn btn-ghost">
            <Calendar size={14} /> Takvim
          </button>
          <button className="btn btn-ghost">
            <FileText size={14} /> Drive
          </button>
          <Link href="/ops/new" className="btn btn-primary">
            <Plus size={14} />
            {tab === "uyusmazlik" ? "Dosya aç" : "Proje aç"}
          </Link>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="mb-6">
        <OpsTabs active={tab} counts={tabCounts} />
      </div>

      {tab === "ozet" && (
        <OzetTab
          consulting={consulting}
          disputes={disputes}
          kpis={{
            consultingCount: totalConsulting,
            consultingClients: new Set(consulting.map((c) => c.clientId).filter(Boolean)).size,
            monthlyRev,
            disputeCount: totalDisputes,
            hearingsWeek, hearingsToday,
            declarationsWeek, urgentDeclarations,
            totalDispVal,
            riskConsulting,
          }}
        />
      )}

      {tab === "danismanlik" && (
        <DanismanlikTab
          consulting={consulting}
          monthlyRev={monthlyRev}
          riskCount={riskConsulting}
          categoryFilter={params.cat}
        />
      )}

      {tab === "uyusmazlik" && (
        <UyusmazlikTab
          disputes={disputes}
          hearingsWeek={hearingsWeek}
          hearingsToday={hearingsToday}
          declarationsWeek={declarationsWeek}
          urgentDeclarations={urgentDeclarations}
          totalDispVal={totalDispVal}
          methodFilter={params.method}
        />
      )}
    </div>
  );
}

// ============================== ÖZET ==============================

type ConsultingMatter = {
  id: string;
  matterNumber: string;
  title: string;
  client: { name: string; companyName: string | null; type: string } | null;
  consultingCategory: string | null;
  monthlyFee: import("@prisma/client").Prisma.Decimal | null;
  progressPct: number;
  nextStepTitle: string | null;
  nextStepAt: Date | null;
  driveFolderName: string | null;
  documentCount: number;
  leadAssigneeName: string | null;
  isUrgent: boolean;
  _count?: { documents: number };
};

type DisputeMatter = {
  id: string;
  matterNumber: string;
  title: string;
  client: { name: string; companyName: string | null; type: string } | null;
  disputeMethod: string | null;
  disputeSubtype: string | null;
  disputeValue: import("@prisma/client").Prisma.Decimal | null;
  courtName: string | null;
  courtFileNo: string | null;
  nextActionType: string | null;
  nextActionAt: Date | null;
  nextHearingAt: Date | null;
  status: import("@prisma/client").MatterStatus;
  isUrgent: boolean;
  isPortfolio: boolean;
  documentCount: number;
  leadAssigneeName: string | null;
};

function OzetTab({
  consulting, disputes, kpis,
}: {
  consulting: ConsultingMatter[];
  disputes: DisputeMatter[];
  kpis: {
    consultingCount: number;
    consultingClients: number;
    monthlyRev: number;
    disputeCount: number;
    hearingsWeek: number;
    hearingsToday: number;
    declarationsWeek: number;
    urgentDeclarations: number;
    totalDispVal: number;
    riskConsulting: number;
  };
}) {
  const urgentDisputes = disputes.filter((d) => d.isUrgent || (d.nextActionAt && d.nextActionAt < new Date(Date.now() + 7 * 86400000))).slice(0, 4);
  const topConsulting = consulting.slice(0, 4);

  return (
    <>
      {/* 6 KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
        <Kpi
          label="Aktif Danışmanlık"
          value={kpis.consultingCount}
          sub={`${kpis.consultingClients} müvekkil · ${formatTRY(kpis.monthlyRev, { short: true })}/ay`}
        />
        <Kpi
          label="Aktif Uyuşmazlık"
          value={kpis.disputeCount}
          sub="9 farklı mercide"
          emphasized
        />
        <Kpi
          label="Bu Hafta Duruşma"
          value={kpis.hearingsWeek}
          sub={`${kpis.hearingsToday}'si bugün`}
        />
        <Kpi
          label="Bu Hafta Beyan"
          value={kpis.declarationsWeek}
          sub={`${kpis.urgentDeclarations}'ü acil`}
        />
        <Kpi
          label="Toplam Uyuşmazlık Değeri"
          value={formatTRY(kpis.totalDispVal, { short: true })}
        />
        <Kpi
          label="Risk Altında Danışmanlık"
          value={kpis.riskConsulting}
          sub={kpis.riskConsulting > 0 ? "Akbank · sözleşme yenileme" : "—"}
          trend={kpis.riskConsulting > 0 ? "down" : undefined}
        />
      </div>

      {/* 2-col: Consulting summary + Urgent disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Danışmanlık Özeti */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4 gap-2">
            <div>
              <h3
                className="text-juris-navy leading-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 20, fontWeight: 500, letterSpacing: "-0.005em",
                }}
              >
                Danışmanlık Özeti
              </h3>
              <div className="text-xs text-juris-ink-3 mt-1">İlerleme + yaklaşan adımlar</div>
            </div>
            <Link href="/ops?tab=danismanlik" className="text-xs text-juris-red hover:underline font-semibold inline-flex items-center gap-1">
              Tümünü gör <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {topConsulting.map((c) => {
              const client = c.client?.type === "COMPANY"
                ? c.client.companyName ?? c.client.name
                : c.client?.name;
              return (
                <Link key={c.id} href={`/ops/${c.id}`} className="block group">
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <div>
                      <div className="font-semibold text-juris-navy group-hover:text-juris-red">
                        {client ?? c.title}
                      </div>
                      <div className="text-[11px] text-juris-ink-3">{c.consultingCategory}</div>
                    </div>
                    {c.monthlyFee && (
                      <div className="mono text-sm font-semibold text-juris-navy flex-shrink-0">
                        {formatTRY(c.monthlyFee.toString(), { short: true })}/ay
                      </div>
                    )}
                  </div>
                  <div className="h-1 rounded-full bg-juris-line-2 overflow-hidden">
                    <div
                      style={{
                        width: `${c.progressPct}%`,
                        height: "100%",
                        background: c.isUrgent ? "#BC2F2C" : "#0A2240",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-juris-ink-4 mono">
                    <span>
                      %{c.progressPct}
                      {c.nextStepAt && <span> · {formatDateTR(c.nextStepAt).split(".").slice(0, 2).join(" ")} · {c.nextStepTitle}</span>}
                    </span>
                    <span>{c.leadAssigneeName ?? "—"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Acil Uyuşmazlıklar */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4 gap-2">
            <div>
              <h3
                className="text-juris-navy leading-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 20, fontWeight: 500, letterSpacing: "-0.005em",
                }}
              >
                Acil Uyuşmazlıklar
              </h3>
              <div className="text-xs text-juris-ink-3 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-juris-red" />
                Önümüzdeki 7 günde aksiyon gerektirenler
              </div>
            </div>
            <Link href="/ops?tab=uyusmazlik" className="text-xs text-juris-red hover:underline font-semibold inline-flex items-center gap-1">
              Tümünü gör <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {urgentDisputes.map((d) => {
              const method = d.disputeMethod ? DISPUTE_METHOD_META[d.disputeMethod] : null;
              return (
                <Link key={d.id} href={`/ops/${d.id}`} className="block group border-l-2 border-juris-red pl-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <div className="font-semibold text-juris-navy italic group-hover:text-juris-red" style={{ fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {d.title}
                      </div>
                      <div className="text-[11px] text-juris-ink-3 mt-0.5">
                        {d.disputeSubtype} · {d.courtName}
                      </div>
                    </div>
                    {method && (
                      <MethodChip method={d.disputeMethod!} />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-3 text-[11px]">
                    <span className="text-juris-red font-semibold">
                      <span className="mono">{d.nextActionType}</span>
                      {" · "}
                      <span className="mono">
                        {d.nextActionAt ? formatRelativeTR(d.nextActionAt) : "—"}
                      </span>
                    </span>
                    <span className="mono text-juris-ink-3">
                      {d.leadAssigneeName ?? "—"}
                    </span>
                  </div>
                </Link>
              );
            })}
            {urgentDisputes.length === 0 && (
              <div className="text-center py-4 text-sm text-juris-ink-3">
                Önümüzdeki 7 günde acil aksiyon yok 🎉
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Juris AI footer bar */}
      <div
        className="rounded-md px-5 py-3 flex items-center gap-3 border border-juris-line-2 text-[13px] text-juris-ink-2"
        style={{ background: "white" }}
      >
        <Sparkles size={14} className="text-juris-red flex-shrink-0" />
        <div className="flex-1 min-w-0 leading-relaxed">
          <span className="font-semibold text-juris-red">Juris AI · Günlük Özet:</span>{" "}
          Bugün {kpis.hearingsToday} duruşma{kpis.hearingsToday > 1 ? "nız" : "nız"} var
          {urgentDisputes[0] && (
            <>
              {" ("}
              <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>{urgentDisputes[0].title}</em>
              {urgentDisputes[0].nextActionAt && ` ${format(urgentDisputes[0].nextActionAt, "HH:mm")}`}
              {")"}
            </>
          )}
          . Danışmanlık tarafında{" "}
          {topConsulting.find((c) => c.progressPct > 85) && (
            <>
              <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>
                {topConsulting.find((c) => c.progressPct > 85)!.title}
              </em>
              {" closing yaklaşıyor — evrak son kontrol bekliyor."}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function MethodChip({ method }: { method: string }) {
  const meta = DISPUTE_METHOD_META[method];
  if (!meta) return null;
  const styles =
    meta.tone === "navy"  ? { background: "#0A2240", color: "white" } :
    meta.tone === "amber" ? { background: "rgba(180,112,28,0.14)", color: "#7a4f15" } :
    meta.tone === "teal"  ? { background: "rgba(31,122,78,0.14)", color: "#147D5C" } :
    { background: "rgba(136,149,171,0.14)", color: "#5A6B82" };
  return (
    <span
      className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded flex-shrink-0"
      style={styles}
    >
      {meta.label}
    </span>
  );
}

// ============================== DANIŞMANLIK ==============================

function DanismanlikTab({
  consulting, monthlyRev, riskCount, categoryFilter,
}: {
  consulting: ConsultingMatter[];
  monthlyRev: number;
  riskCount: number;
  categoryFilter?: string;
}) {
  // Unique categories
  const categories = Array.from(
    new Set(consulting.map((c) => c.consultingCategory).filter(Boolean) as string[]),
  );
  const clientsCount = new Set(consulting.map((c) => c.client?.name)).size;
  const avgProgress = consulting.length
    ? Math.round(consulting.reduce((s, c) => s + c.progressPct, 0) / consulting.length)
    : 0;

  const filtered = categoryFilter
    ? consulting.filter((c) => c.consultingCategory === categoryFilter)
    : consulting;

  return (
    <>
      {/* 4 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <Kpi label="Aktif Danışmanlık" value={consulting.length} sub={`${clientsCount} müvekkil`} emphasized />
        <Kpi label="Aylık Gelir" value={`${formatTRY(monthlyRev, { short: true })}/ay`} delta="+12%" trend="up" />
        <Kpi label="Risk Altında" value={riskCount} sub={riskCount > 0 ? "1 sözleşme yaklaşıyor" : "—"} />
        <Kpi label="Ortalama İlerleme" value={avgProgress} suffix="%" />
      </div>

      {/* Category filter chips */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <Link
          href="/ops?tab=danismanlik"
          className="inline-flex items-center px-3 h-8 rounded-full text-xs font-semibold transition-all"
          style={{
            background: !categoryFilter ? "#0A2240" : "white",
            color: !categoryFilter ? "white" : "#5A6B82",
            border: `1px solid ${!categoryFilter ? "#0A2240" : "#E5E9F0"}`,
          }}
        >
          Tümü
        </Link>
        {categories.map((c) => {
          const active = categoryFilter === c;
          return (
            <Link
              key={c}
              href={`/ops?tab=danismanlik&cat=${encodeURIComponent(c)}`}
              className="inline-flex items-center px-3 h-8 rounded-full text-xs font-semibold transition-all"
              style={{
                background: active ? "#0A2240" : "white",
                color: active ? "white" : "#5A6B82",
                border: `1px solid ${active ? "#0A2240" : "#E5E9F0"}`,
              }}
            >
              {c}
            </Link>
          );
        })}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.map((c) => (
          <ConsultingCard key={c.id} matter={c} />
        ))}
      </div>
    </>
  );
}

function ConsultingCard({ matter }: { matter: ConsultingMatter }) {
  const client = matter.client?.type === "COMPANY"
    ? matter.client.companyName ?? matter.client.name
    : matter.client?.name;
  const isRisk = matter.isUrgent;
  return (
    <Link
      href={`/ops/${matter.id}`}
      className="block bg-white rounded-md border border-juris-line hover:shadow-juris-md transition-all overflow-hidden"
      style={{ borderLeft: `3px solid ${isRisk ? "#BC2F2C" : "#0A2240"}` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-juris-red">
            {matter.consultingCategory}
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={
              isRisk
                ? { background: "rgba(188,47,44,0.12)", color: "#BC2F2C" }
                : { background: "rgba(31,122,78,0.12)", color: "#147D5C" }
            }
          >
            {isRisk ? "Risk" : "Rayında"}
          </span>
        </div>
        <h3
          className="text-juris-navy leading-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em",
          }}
        >
          {client ?? matter.title}
        </h3>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-juris-ink-3 mb-1.5">
            <span>İlerleme</span>
            <span className={cn("mono font-semibold", isRisk ? "text-juris-red" : "text-juris-navy")}>
              %{matter.progressPct}
            </span>
          </div>
          <div className="h-1 rounded-full bg-juris-line-2 overflow-hidden">
            <div
              style={{
                width: `${matter.progressPct}%`,
                height: "100%",
                background: isRisk ? "#BC2F2C" : "#0A2240",
              }}
            />
          </div>
        </div>

        <div className="mt-4 px-3 py-2.5 rounded bg-juris-paper-2 border border-juris-line-2">
          <div className="text-[9px] uppercase tracking-[0.14em] font-semibold text-juris-ink-3 mb-0.5">
            Sıradaki Adım
          </div>
          <div className="text-[13px] text-juris-navy">
            <span className="mono text-[11px] text-juris-red font-semibold">
              {matter.nextStepAt && format(matter.nextStepAt, "d MMM", { locale: tr })}
            </span>
            {" · "}
            {matter.nextStepTitle ?? "—"}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            {matter.leadAssigneeName && (
              <>
                <Avatar name={matter.leadAssigneeName} size={22} />
                <span className="text-juris-ink-2 font-medium">{matter.leadAssigneeName}</span>
                <span className="text-juris-ink-4">+2</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-juris-ink-3 mono">
            <span className="inline-flex items-center gap-0.5">
              <FileText size={10} /> {matter.documentCount}
            </span>
            <span className="text-juris-navy font-semibold">
              {matter.monthlyFee && `${formatTRY(matter.monthlyFee.toString(), { short: true })}/ay`}
              {!matter.monthlyFee && "—"}
            </span>
          </div>
        </div>
      </div>

      {matter.driveFolderName && (
        <div className="px-5 py-2 bg-juris-paper-2 border-t border-juris-line-2 text-[11px] text-juris-ink-3 flex items-center gap-1.5">
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)" }}
          >
            G
          </span>
          <span className="font-medium">Drive:</span>
          <span className="mono text-juris-ink-2 truncate">{matter.driveFolderName}</span>
        </div>
      )}
    </Link>
  );
}

// ============================== UYUŞMAZLIK ==============================

function UyusmazlikTab({
  disputes, hearingsWeek, hearingsToday, declarationsWeek, urgentDeclarations,
  totalDispVal, methodFilter,
}: {
  disputes: DisputeMatter[];
  hearingsWeek: number;
  hearingsToday: number;
  declarationsWeek: number;
  urgentDeclarations: number;
  totalDispVal: number;
  methodFilter?: string;
}) {
  const methods = ["DAVA", "ICRA", "TAHKIM", "SIGORTA_TAHKIM", "IHTARNAME"];
  const filtered = methodFilter
    ? disputes.filter((d) => d.disputeMethod === methodFilter)
    : disputes;
  const urgentCount = disputes.filter((d) => d.isUrgent).length;

  return (
    <>
      {/* 4 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <Kpi
          label="Aktif Uyuşmazlık"
          value={disputes.length}
          sub={`${filtered.length} örnek gösteriliyor`}
          emphasized
        />
        <Kpi label="Bu Hafta Duruşma" value={hearingsWeek} sub={`${hearingsToday}'si bugün`} />
        <Kpi label="Bu Hafta Beyan" value={declarationsWeek} sub={`${urgentDeclarations}'ü acil`} />
        <Kpi label="Toplam Uyuşmazlık Değeri" value={formatTRY(totalDispVal, { short: true })} />
      </div>

      {/* Method filter chips + urgent indicator */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="flex gap-1.5 flex-wrap">
          <Link
            href="/ops?tab=uyusmazlik"
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-all"
            style={{
              background: !methodFilter ? "#0A2240" : "white",
              color: !methodFilter ? "white" : "#5A6B82",
              border: `1px solid ${!methodFilter ? "#0A2240" : "#E5E9F0"}`,
            }}
          >
            Tümü
          </Link>
          {methods.map((m) => {
            const meta = DISPUTE_METHOD_META[m];
            const active = methodFilter === m;
            return (
              <Link
                key={m}
                href={`/ops?tab=uyusmazlik&method=${m}`}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: active ? "#0A2240" : "white",
                  color: active ? "white" : "#5A6B82",
                  border: `1px solid ${active ? "#0A2240" : "#E5E9F0"}`,
                }}
              >
                {meta.label}
              </Link>
            );
          })}
        </div>
        {urgentCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-juris-red">
            <span className="w-1.5 h-1.5 rounded-full bg-juris-red animate-pulse" />
            {urgentCount} acil
          </span>
        )}
      </div>

      {/* Uyuşmazlık table */}
      <div className="card overflow-x-auto mb-5">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-juris-paper-2 text-juris-ink-3 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-semibold w-[260px]">Taraflar</th>
              <th className="text-left px-3 py-3 font-semibold w-[110px]">Yöntem</th>
              <th className="text-left px-3 py-3 font-semibold">Dava Türü</th>
              <th className="text-left px-3 py-3 font-semibold w-[180px]">Mercii · No</th>
              <th className="text-left px-3 py-3 font-semibold w-[180px]">Sıradaki</th>
              <th className="text-right px-3 py-3 font-semibold w-[90px]">Değer</th>
              <th className="text-left px-3 py-3 font-semibold w-[110px]">Sorumlu</th>
              <th className="text-left px-4 py-3 font-semibold w-[90px]">Drive</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <DisputeRow key={d.id} dispute={d} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Juris AI bar */}
      <div
        className="rounded-md px-5 py-3 flex items-center gap-3 border border-juris-line-2 text-[13px] text-juris-ink-2"
        style={{ background: "white" }}
      >
        <Sparkles size={14} className="text-juris-red flex-shrink-0" />
        <div className="flex-1 min-w-0 leading-relaxed">
          <span className="font-semibold text-juris-red">Juris AI:</span>{" "}
          {hearingsToday > 0 && (
            <>
              Bugün{" "}
              {disputes
                .filter((d) => d.nextHearingAt && startOfDay(d.nextHearingAt).getTime() === startOfDay(new Date()).getTime())
                .slice(0, 1)
                .map((d) => (
                  <span key={d.id}>
                    <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>{d.title}</em>
                    {" "}duruşmanız var
                    {d.nextHearingAt && ` (${format(d.nextHearingAt, "HH:mm")}).`}
                  </span>
                ))}
            </>
          )}
          {" Google Takvim'e hatırlatıcı eklendi."}
        </div>
      </div>
    </>
  );
}

function DisputeRow({ dispute: d }: { dispute: DisputeMatter }) {
  const client = d.client?.type === "COMPANY"
    ? d.client.companyName ?? d.client.name
    : d.client?.name;
  const value = d.disputeValue?.toNumber() ?? 0;
  return (
    <tr className="border-t border-juris-line-2 hover:bg-juris-paper-2">
      <td className="px-4 py-3">
        <Link href={`/ops/${d.id}`} className="block hover:text-juris-red">
          <div
            className="font-medium"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 14, fontStyle: "italic", color: "#0A2240",
            }}
          >
            {d.title}
          </div>
          <div className="text-[11px] text-juris-ink-3">
            Durum: <span className="text-juris-ink-2">
              {d.nextActionType === "Duruşma" ? "Duruşma" :
               d.disputeMethod === "TAHKIM" ? "Tahkim" :
               d.isPortfolio ? "Aktif" :
               d.status === "ON_HOLD" ? "Beklemede" : "Aktif"}
            </span>
          </div>
        </Link>
      </td>
      <td className="px-3 py-3">
        {d.disputeMethod && <MethodChip method={d.disputeMethod} />}
      </td>
      <td className="px-3 py-3 text-sm text-juris-ink-2">{d.disputeSubtype ?? "—"}</td>
      <td className="px-3 py-3">
        <div className="text-xs text-juris-ink-2">{d.courtName ?? "—"}</div>
        <div className="mono text-[10px] text-juris-ink-4 mt-0.5">
          {d.courtFileNo}
          {d.isPortfolio && " (portföy)"}
        </div>
      </td>
      <td className="px-3 py-3">
        {d.nextActionAt || d.nextActionType ? (
          <>
            <div className="flex items-center gap-1 text-[13px] font-semibold text-juris-ink">
              {d.isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-juris-red" />}
              {d.nextActionType}
            </div>
            <div className={cn("mono text-[11px] mt-0.5", d.isUrgent ? "text-juris-red font-semibold" : "text-juris-ink-3")}>
              {d.nextActionAt ? formatRelativeTR(d.nextActionAt) : ""}
            </div>
          </>
        ) : (
          <span className="text-juris-ink-4 text-xs">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-right mono text-sm font-semibold text-juris-navy">
        {value > 0 ? formatTRY(value, { short: true }) : "—"}
      </td>
      <td className="px-3 py-3">
        {d.leadAssigneeName ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={d.leadAssigneeName} size={22} />
            <span className="text-xs text-juris-ink-2">{d.leadAssigneeName}</span>
          </div>
        ) : (
          <span className="text-xs text-juris-ink-4">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-[11px] text-juris-ink-3 font-medium">
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)" }}
          >
            G
          </span>
          {d.documentCount} belge
        </span>
      </td>
    </tr>
  );
}
