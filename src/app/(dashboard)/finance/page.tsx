import Link from "next/link";
import {
  Wallet, Plus, TrendingUp, TrendingDown, AlertCircle,
  Download, Receipt, Landmark, Calendar,
} from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format, startOfYear, endOfYear } from "date-fns";
import { tr } from "date-fns/locale";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { invoiceStatusChip } from "@/lib/labels";
import { formatTRY, formatDateTR } from "@/lib/utils";
import { FinanceTabs } from "./finance-tabs";
import { SourcesButton } from "@/components/shell/sources-panel";

export const metadata = { title: "Finans" };

type TabKey = "ozet" | "nakit" | "gelirgider" | "tahsilat" | "faturalar";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: TabKey }>;
}) {
  const { firmId } = await requireTenant();
  const params = await searchParams;
  const tab: TabKey = params.tab ?? "ozet";

  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);
  const yStart = startOfYear(now);
  const yEnd = endOfYear(now);

  // Last 7 months history (for özet balance trend) + 12 months nakit flow
  const nakitMonths = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return {
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: format(d, "MMM", { locale: tr }),
      isCurrent: i === 11,
    };
  });

  const [
    paidMonth, sentMonth, overdueAgg, ytdInvoiced, ytdPaid,
    statusCounts, recentInvoices,
    ...monthlyAggs
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { firmId, status: "PAID", paidAt: { gte: mStart, lte: mEnd } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      where: {
        firmId,
        status: { in: ["SENT", "PAID"] },
        issuedAt: { gte: mStart, lte: mEnd },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      where: { firmId, status: "SENT", dueAt: { lt: mStart } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      where: {
        firmId,
        status: { in: ["SENT", "PAID"] },
        issuedAt: { gte: yStart, lte: yEnd },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      where: { firmId, status: "PAID", paidAt: { gte: yStart, lte: yEnd } },
      _sum: { total: true },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { firmId },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.invoice.findMany({
      where: { firmId },
      orderBy: { issuedAt: "desc" },
      take: 60,
      include: {
        client: { select: { name: true, companyName: true, type: true } },
        matter: { select: { matterNumber: true, title: true } },
      },
    }),
    // 12 monthly aggregates — both issued + paid
    ...nakitMonths.map((m) =>
      prisma.$transaction([
        prisma.invoice.aggregate({
          where: {
            firmId,
            status: { in: ["SENT", "PAID"] },
            issuedAt: { gte: m.start, lte: m.end },
          },
          _sum: { total: true },
        }),
        prisma.invoice.aggregate({
          where: { firmId, status: "PAID", paidAt: { gte: m.start, lte: m.end } },
          _sum: { total: true },
        }),
      ]),
    ),
  ]);

  const paidM = paidMonth._sum.total?.toNumber() ?? 0;
  const sentM = sentMonth._sum.total?.toNumber() ?? 0;
  const overdueSum = overdueAgg._sum.total?.toNumber() ?? 0;
  const ytdInv = ytdInvoiced._sum.total?.toNumber() ?? 0;
  const ytdPd = ytdPaid._sum.total?.toNumber() ?? 0;
  const collectionRate = ytdInv > 0 ? (ytdPd / ytdInv) * 100 : 0;

  // Monthly cash flow data — kesim vs tahsilat
  const monthly = (monthlyAggs as Array<[{ _sum: { total: unknown } }, { _sum: { total: unknown } }]>).map((pair, i) => {
    const issued = pair[0]._sum.total;
    const paid = pair[1]._sum.total;
    const toNum = (v: unknown) =>
      v && typeof (v as { toNumber?: () => number }).toNumber === "function"
        ? (v as { toNumber: () => number }).toNumber()
        : Number(v) || 0;
    return {
      ...nakitMonths[i],
      issued: toNum(issued),
      paid: toNum(paid),
    };
  });

  return (
    <div className="px-6 py-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-7 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="display text-[32px] text-juris-navy leading-tight">
            Ay başı, ay ortası, kapanış.
          </div>
          <div className="text-sm text-juris-ink-3 mt-1.5 flex items-center gap-2">
            {format(now, "d MMMM yyyy · EEEE", { locale: tr })}
            <span className="inline-flex items-center gap-1 text-juris-success">
              <span className="w-1.5 h-1.5 rounded-full bg-juris-success animate-pulse" />
              Gerçek zamanlı
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SourcesButton moduleKey="finance" />
          <button className="btn btn-ghost">
            <Download size={14} /> Excel&apos;e aktar
          </button>
          <Link href="/finance/new" className="btn btn-primary">
            <Plus size={14} /> Yeni Fatura
          </Link>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <Kpi
          label="Bu Ay Tahsilat"
          value={formatTRY(paidM, { short: true })}
          sub={`${paidMonth._count._all} fatura`}
          emphasized
        />
        <Kpi
          label="Bu Ay Kesim"
          value={formatTRY(sentM, { short: true })}
          sub={`${sentMonth._count._all} fatura`}
        />
        <Kpi
          label="Geciken Alacak"
          value={formatTRY(overdueSum, { short: true })}
          sub={`${overdueAgg._count._all} fatura`}
          trend={overdueSum > 0 ? "down" : undefined}
        />
        <Kpi
          label="YTD Fatura"
          value={formatTRY(ytdInv, { short: true })}
          sub={`${ytdInvoiced._count._all} adet`}
        />
        <Kpi
          label="Tahsilat Oranı"
          value={`%${collectionRate.toFixed(0)}`}
          sub={`${formatTRY(ytdPd, { short: true })} / ${formatTRY(ytdInv, { short: true })}`}
          trend={collectionRate >= 80 ? "up" : "down"}
        />
      </div>

      <FinanceTabs active={tab} />

      {tab === "ozet" && <OzetTab monthly={monthly} statusCounts={statusCounts} />}
      {tab === "nakit" && <NakitTab monthly={monthly} />}
      {tab === "gelirgider" && <GelirGiderTab ytdInv={ytdInv} ytdPaid={ytdPd} />}
      {tab === "tahsilat" && <TahsilatTab invoices={recentInvoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE")} />}
      {tab === "faturalar" && <FaturalarTab invoices={recentInvoices} />}
    </div>
  );
}

// ============================== TAB: ÖZET ==============================

function OzetTab({
  monthly, statusCounts,
}: {
  monthly: { label: string; issued: number; paid: number; isCurrent: boolean }[];
  statusCounts: { status: string; _count: { _all: number }; _sum: { total: unknown } }[];
}) {
  const max = Math.max(...monthly.map((m) => Math.max(m.issued, m.paid)), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
      {/* Balance trend */}
      <div className="card p-6">
        <SectionHead
          title="Son 12 Ay — Kesim & Tahsilat"
          subtitle="Aylık fatura akışı"
          small
        />
        <div className="grid grid-cols-12 gap-1.5 items-end pt-4" style={{ height: 180 }}>
          {monthly.map((m) => {
            const issuedH = (m.issued / max) * 140;
            const paidH = (m.paid / max) * 140;
            return (
              <div key={m.label} className="flex flex-col items-center gap-1">
                <div className="flex gap-0.5 items-end" style={{ height: 140 }}>
                  <div
                    className="rounded-t"
                    style={{
                      width: 8,
                      height: Math.max(issuedH, 2),
                      background: m.isCurrent ? "#0A2240" : "#D1DCE9",
                    }}
                    title={`Kesim: ${formatTRY(m.issued, { short: true })}`}
                  />
                  <div
                    className="rounded-t"
                    style={{
                      width: 8,
                      height: Math.max(paidH, 2),
                      background: m.isCurrent ? "#BC2F2C" : "rgba(188,47,44,0.35)",
                    }}
                    title={`Tahsilat: ${formatTRY(m.paid, { short: true })}`}
                  />
                </div>
                <span className={`text-[9px] mono ${m.isCurrent ? "text-juris-navy font-semibold" : "text-juris-ink-3"}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-5 mt-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-juris-ink-3">
            <span className="w-2.5 h-2.5 rounded-sm bg-juris-navy" /> Kesim
          </span>
          <span className="flex items-center gap-1.5 text-juris-ink-3">
            <span className="w-2.5 h-2.5 rounded-sm bg-juris-red" /> Tahsilat
          </span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="card p-6">
        <SectionHead title="Fatura Durumu" subtitle="Mevcut dağılım" small />
        {statusCounts.length === 0 ? (
          <div className="py-6 text-center text-sm text-juris-ink-3">Fatura yok.</div>
        ) : (
          <ul className="flex flex-col divide-y divide-juris-line-2">
            {statusCounts.map((s) => {
              const chip = invoiceStatusChip(s.status as never);
              const sum = typeof s._sum.total === "object" && s._sum.total
                ? (s._sum.total as { toNumber?: () => number }).toNumber?.() ?? 0
                : Number(s._sum.total) || 0;
              return (
                <li key={s.status} className="py-3 flex items-center gap-3">
                  <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                  <span className="flex-1 text-sm text-juris-ink-3">{s._count._all} fatura</span>
                  <span className="mono text-sm font-semibold text-juris-navy">
                    {formatTRY(sum, { short: true })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Alerts */}
      <div className="card p-6 lg:col-span-2">
        <SectionHead title="Dikkat Gerektirenler" small />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AlertCard
            tone="amber"
            title="GİB e-Fatura entegrasyonu bekliyor"
            body="Foriba veya Paraşüt bağlantısı kurulunca tüm faturalar otomatik GİB'e gider."
            cta="Entegrasyonlara git"
            href="/integrations"
          />
          <AlertCard
            tone="red"
            title="Kamu borcu 200K ₺"
            body="Sosyal güvenlik + KDV borç yapılandırması Nisan ayına kadar kapatılmalı."
            cta="Detay"
            href="/finance?tab=gelirgider"
          />
          <AlertCard
            tone="blue"
            title="Stripe abonelik aktif değil"
            body="SaaS faturalandırma için Stripe Variables tamamlanmalı."
            cta="Ayarları aç"
            href="/settings/billing"
          />
        </div>
      </div>
    </div>
  );
}

function AlertCard({
  tone, title, body, cta, href,
}: {
  tone: "amber" | "red" | "blue";
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  const borderColor =
    tone === "red" ? "#BC2F2C" :
    tone === "amber" ? "#B4701C" : "#1F5AA8";
  return (
    <div
      className="rounded-md p-4 border bg-white"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="text-sm font-semibold text-juris-navy">{title}</div>
      <p className="text-xs text-juris-ink-2 mt-1 leading-relaxed">{body}</p>
      <Link href={href} className="text-xs font-semibold mt-2 inline-block hover:text-juris-red" style={{ color: borderColor }}>
        {cta} →
      </Link>
    </div>
  );
}

// ============================== TAB: NAKİT ==============================

function NakitTab({ monthly }: { monthly: { label: string; issued: number; paid: number; isCurrent: boolean }[] }) {
  const max = Math.max(...monthly.map((m) => Math.max(m.issued, m.paid)), 1);
  let cumulative = 0;
  const cumulativeSeries = monthly.map((m) => {
    cumulative += m.paid - m.issued * 0.15; // rough: assume 15% opex assumption
    return cumulative;
  });

  const yearTotal = monthly.reduce((s, m) => s + m.paid, 0);
  const avg = yearTotal / 12;
  const bestMonth = [...monthly].sort((a, b) => b.paid - a.paid)[0];

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card p-6">
        <SectionHead
          title="Nakit Akışı"
          subtitle="Aylık tahsilat detayı + birikimli bakiye"
          small
        />
        <div className="grid grid-cols-12 gap-2 items-end pt-2" style={{ height: 220 }}>
          {monthly.map((m) => {
            const h = (m.paid / max) * 170;
            return (
              <div key={m.label} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: Math.max(h, 2),
                    background: m.isCurrent
                      ? "linear-gradient(180deg, #BC2F2C 0%, #8A1F1D 100%)"
                      : "linear-gradient(180deg, #D1DCE9 0%, #A8B7CC 100%)",
                  }}
                />
                <span className={`mono text-[10px] ${m.isCurrent ? "text-juris-navy font-semibold" : "text-juris-ink-3"}`}>
                  {formatTRY(m.paid, { short: true })}
                </span>
                <span className={`text-[9px] uppercase ${m.isCurrent ? "text-juris-navy font-semibold" : "text-juris-ink-4"}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi
          label="YTD Tahsilat"
          value={formatTRY(yearTotal, { short: true })}
          emphasized
        />
        <Kpi
          label="Aylık Ortalama"
          value={formatTRY(avg, { short: true })}
        />
        <Kpi
          label="En İyi Ay"
          value={bestMonth.label}
          sub={formatTRY(bestMonth.paid, { short: true })}
        />
        <Kpi
          label="Birikimli"
          value={formatTRY(cumulative, { short: true })}
          sub="tahmini net"
          trend={cumulative > 0 ? "up" : "down"}
        />
      </div>
    </div>
  );
}

// ============================== TAB: GELİR-GİDER ==============================

function GelirGiderTab({ ytdInv, ytdPaid }: { ytdInv: number; ytdPaid: number }) {
  // Placeholder expense data — v0.8: hook to a proper Expense schema
  const expenses = [
    { label: "Personel & Bordro", amount: 212000, category: "sabit" },
    { label: "Ofis kirası", amount: 100000, category: "sabit" },
    { label: "Ortak geri alımı", amount: 200000, category: "sabit" },
    { label: "Yazılım & SaaS", amount: 18500, category: "değişken" },
    { label: "Yemek & ağırlama", amount: 45000, category: "değişken" },
    { label: "Kamu borcu (SGK+KDV)", amount: 200000, category: "alert" },
  ];
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const net = ytdPaid - totalExpense;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gelir */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <SectionHead title="Gelir" subtitle="Yıl içi tahsilat" small />
            <span className="display text-[22px] text-juris-success">
              {formatTRY(ytdPaid)}
            </span>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <IncomeRow label="Fatura tahsilatı" tone="güçlü" amount={ytdPaid} total={ytdPaid} color="#1F7A4E" />
            <IncomeRow label="Danışmanlık retainer" tone="düzenli" amount={ytdPaid * 0.4} total={ytdPaid} color="#1F5AA8" hint="tahmini dağılım" />
            <IncomeRow label="Dava ücretleri" tone="değişken" amount={ytdPaid * 0.35} total={ytdPaid} color="#B4701C" hint="tahmini dağılım" />
            <IncomeRow label="Diğer" tone="değişken" amount={ytdPaid * 0.25} total={ytdPaid} color="#5A6B82" hint="tahmini dağılım" />
          </div>
        </div>

        {/* Gider */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <SectionHead title="Gider" subtitle="Sabit + değişken" small />
            <span className="display text-[22px] text-juris-red">
              {formatTRY(totalExpense)}
            </span>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            {expenses.map((e) => (
              <ExpenseRow
                key={e.label}
                label={e.label}
                category={e.category}
                amount={e.amount}
                total={totalExpense}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Net */}
      <div
        className="rounded-xl p-7 relative overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(600px 400px at 100% 0%, rgba(188,47,44,0.30), transparent 60%)",
          }}
        />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/50 font-semibold mb-2">
              YTD Net Sonuç
            </div>
            <div
              className="display text-[40px] leading-none"
              style={{ color: net >= 0 ? "#6FBF90" : "#F4A4A1" }}
            >
              {net >= 0 ? "+" : ""}{formatTRY(net, { short: true })}
            </div>
            <div className="text-sm text-white/60 mt-2">
              {net >= 0 ? "Kâr" : "Zarar"} · %{ytdPaid > 0 ? ((net / ytdPaid) * 100).toFixed(1) : "0"} net marj
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/50 font-semibold mb-2">
              Gelir
            </div>
            <div className="display text-[22px] text-white">
              {formatTRY(ytdPaid)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/50 font-semibold mb-2">
              Gider
            </div>
            <div className="display text-[22px] text-white">
              {formatTRY(totalExpense)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncomeRow({
  label, tone, amount, total, color, hint,
}: {
  label: string;
  tone: string;
  amount: number;
  total: number;
  color: string;
  hint?: string;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-juris-ink-2">{label}</span>
          <span className="chip" style={{ height: 18, fontSize: 9 }}>{tone}</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-juris-line-2 overflow-hidden">
          <div style={{ width: `${pct}%`, height: "100%", background: color }} />
        </div>
        {hint && <div className="text-[10px] text-juris-ink-4 mt-1">{hint}</div>}
      </div>
      <span className="mono text-sm font-semibold text-juris-success whitespace-nowrap">
        {formatTRY(amount, { short: true })}
      </span>
    </div>
  );
}

function ExpenseRow({
  label, category, amount, total,
}: {
  label: string;
  category: string;
  amount: number;
  total: number;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  const isAlert = category === "alert";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-juris-ink-2">{label}</span>
          <span className={`chip ${isAlert ? "chip-red" : ""}`} style={{ height: 18, fontSize: 9 }}>
            {isAlert ? "acil" : category}
          </span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-juris-line-2 overflow-hidden">
          <div style={{ width: `${pct}%`, height: "100%", background: isAlert ? "#BC2F2C" : "#8895AB" }} />
        </div>
      </div>
      <span className={`mono text-sm font-semibold whitespace-nowrap ${isAlert ? "text-juris-red" : "text-juris-ink-2"}`}>
        {formatTRY(amount, { short: true })}
      </span>
    </div>
  );
}

// ============================== TAB: TAHSİLAT ==============================

function TahsilatTab({
  invoices,
}: {
  invoices: Array<{
    id: string; invoiceNumber: string; total: unknown; dueAt: Date | null;
    client: { name: string; companyName: string | null; type: string } | null;
  }>;
}) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return (
    <div className="card p-6">
      <SectionHead
        title="Bekleyen Tahsilat"
        subtitle={`${invoices.length} açık fatura · vade sırasına göre`}
        small
      />
      {invoices.length === 0 ? (
        <div className="py-8 text-center text-sm text-juris-ink-3">
          Tüm faturalar ödendi 🎉
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-juris-line-2">
          {invoices.map((inv) => {
            const total = typeof (inv.total as { toNumber?: () => number })?.toNumber === "function"
              ? (inv.total as { toNumber: () => number }).toNumber()
              : Number(inv.total) || 0;
            const overdue = inv.dueAt && inv.dueAt < todayStart;
            const name = inv.client?.type === "COMPANY"
              ? inv.client.companyName ?? inv.client.name
              : inv.client?.name ?? "—";
            const daysOverdue = inv.dueAt
              ? Math.max(0, Math.floor((todayStart.getTime() - inv.dueAt.getTime()) / 86400000))
              : 0;
            return (
              <li key={inv.id} className="py-3 flex items-center gap-3">
                <div
                  className="w-1 self-stretch rounded-full"
                  style={{ background: overdue ? "#BC2F2C" : "#B4701C" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/finance/${inv.id}`}
                      className="mono text-xs text-juris-ink-3 hover:text-juris-red"
                    >
                      {inv.invoiceNumber}
                    </Link>
                    <span className="text-sm font-medium text-juris-navy">{name}</span>
                  </div>
                  <div className="text-[11px] text-juris-ink-4 mt-0.5">
                    Vade {formatDateTR(inv.dueAt)}
                    {overdue && (
                      <span className="text-juris-red font-semibold ml-1.5">
                        · {daysOverdue} gün gecikti
                      </span>
                    )}
                  </div>
                </div>
                <div className="mono text-sm font-semibold text-juris-navy">
                  {formatTRY(total, { short: true })}
                </div>
                <button className="btn btn-sm btn-ghost">
                  Hatırlat
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ============================== TAB: FATURALAR ==============================

function FaturalarTab({
  invoices,
}: {
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" | string;
    total: unknown;
    issuedAt: Date | null;
    dueAt: Date | null;
    client: { name: string; companyName: string | null; type: string } | null;
    matter: { matterNumber: string; title: string } | null;
  }>;
}) {
  return (
    <div className="card overflow-hidden">
      {invoices.length === 0 ? (
        <div className="p-12 flex flex-col items-center text-center">
          <Receipt size={28} className="text-juris-ink-3 mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">Fatura yok</h3>
          <p className="text-sm text-juris-ink-3 max-w-md mb-4">
            İlk faturanızı oluşturduğunuzda burada listelenecek.
          </p>
          <Link href="/finance/new" className="btn btn-primary">
            <Plus size={14} /> Yeni Fatura
          </Link>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">No</th>
              <th className="text-left px-4 py-3 font-semibold">Müvekkil</th>
              <th className="text-left px-4 py-3 font-semibold">Dosya</th>
              <th className="text-right px-4 py-3 font-semibold">Tutar</th>
              <th className="text-left px-4 py-3 font-semibold">Durum</th>
              <th className="text-left px-4 py-3 font-semibold">Vade</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const chip = invoiceStatusChip(inv.status as never);
              const client = inv.client?.type === "COMPANY"
                ? inv.client.companyName ?? inv.client.name
                : inv.client?.name;
              const total = typeof (inv.total as { toNumber?: () => number })?.toNumber === "function"
                ? (inv.total as { toNumber: () => number }).toNumber()
                : Number(inv.total) || 0;
              return (
                <tr key={inv.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                  <td className="px-4 py-3 mono font-semibold text-juris-navy text-xs">
                    <Link href={`/finance/${inv.id}`} className="hover:text-juris-red">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-juris-ink-2">{client ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-juris-ink-3 mono">
                    {inv.matter?.matterNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                    {formatTRY(total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-juris-ink-3">
                    {formatDateTR(inv.dueAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
