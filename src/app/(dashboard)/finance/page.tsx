import Link from "next/link";
import {
  Plus, Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Wallet, CreditCard, Receipt, CheckCircle2, Clock, Info,
} from "lucide-react";
import {
  startOfMonth, endOfMonth, subMonths, format, startOfYear, endOfYear,
} from "date-fns";
import { tr } from "date-fns/locale";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { formatTRY, formatDateTR } from "@/lib/utils";
import { FinanceTabs } from "./finance-tabs";
import { SourcesButton } from "@/components/shell/sources-panel";

export const metadata = { title: "Finans" };

type TabKey = "nabiz" | "nakit" | "gelirgider" | "danismanlik" | "tahsilat";

// ========================================================================
// PAGE
// ========================================================================

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: TabKey }>;
}) {
  const { firmId } = await requireTenant();
  const params = await searchParams;
  const tab: TabKey = params.tab ?? "nabiz";

  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);
  const yStart = startOfYear(now);
  const yEnd = endOfYear(now);

  // 12 months of history for charts
  const monthsMeta = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return {
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: format(d, "MMM", { locale: tr }).replace(".", ""),
      isCurrent: i === 11,
    };
  });

  const [
    paidMonth,
    sentMonth,
    overdueAgg,
    ytdPaid,
    ytdInvoiced,
    contracts,
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
      where: { firmId, status: "PAID", paidAt: { gte: yStart, lte: yEnd } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: {
        firmId,
        status: { in: ["SENT", "PAID"] },
        issuedAt: { gte: yStart, lte: yEnd },
      },
      _sum: { total: true },
    }),
    prisma.consultingContract.findMany({
      where: { firmId },
      orderBy: [{ dueType: "asc" }, { retainerFee: "desc" }],
    }),
    ...monthsMeta.map((m) =>
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

  const toNum = (v: unknown) =>
    v && typeof (v as { toNumber?: () => number }).toNumber === "function"
      ? (v as { toNumber: () => number }).toNumber()
      : Number(v) || 0;

  const paidM = toNum(paidMonth._sum.total);
  const sentM = toNum(sentMonth._sum.total);
  const overdueSum = toNum(overdueAgg._sum.total);
  const ytdPd = toNum(ytdPaid._sum.total);
  const ytdInv = toNum(ytdInvoiced._sum.total);
  const collectionRate = ytdInv > 0 ? (ytdPd / ytdInv) * 100 : 0;

  const monthly = (monthlyAggs as Array<[{ _sum: { total: unknown } }, { _sum: { total: unknown } }]>).map((pair, i) => ({
    ...monthsMeta[i],
    issued: toNum(pair[0]._sum.total),
    paid: toNum(pair[1]._sum.total),
  }));

  // ── Derived totals from consulting contracts ──
  const ayBasiContracts   = contracts.filter((c) => c.dueType === "AY_BASI");
  const ayOrtasiContracts = contracts.filter((c) => c.dueType === "AY_ORTASI");
  const retainerMonthlyTotal = contracts.reduce(
    (s, c) => s + toNum(c.retainerFee), 0,
  );
  const sgkMonthlyTotal = contracts.reduce(
    (s, c) => s + toNum(c.sgkFee), 0,
  );
  const consultingCount = contracts.length;
  const overdueContracts = contracts.filter((c) => c.isOverdue).length;

  // ── Mock derivations for visual parity w/ design (real implementations later) ──
  const accountBalance = 1_840_000;                 // Hesap bakiyesi
  const expected14Days = 620_000;                   // 14 gün nakit akışı
  const monthlyExpenseFixed = 512_000;              // sabit gider toplamı

  return (
    <div className="px-6 py-8 max-w-[1440px] mx-auto">
      {/* ============= Header ============= */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
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
            <Plus size={14} /> Kayıt Ekle
          </Link>
        </div>
      </div>

      <FinanceTabs active={tab} />

      {tab === "nabiz"       && <NabizTab monthly={monthly} accountBalance={accountBalance} paidM={paidM} sentM={sentM} overdueSum={overdueSum} expected14Days={expected14Days} retainerMonthlyTotal={retainerMonthlyTotal} monthlyExpenseFixed={monthlyExpenseFixed} overdueContracts={overdueContracts} />}
      {tab === "nakit"       && <NakitTab monthly={monthly} ytdPaid={ytdPd} />}
      {tab === "gelirgider"  && <GelirGiderTab ytdPaid={ytdPd} retainerMonthlyTotal={retainerMonthlyTotal} />}
      {tab === "danismanlik" && <DanismanlikTab contracts={contracts} retainerMonthlyTotal={retainerMonthlyTotal} sgkMonthlyTotal={sgkMonthlyTotal} consultingCount={consultingCount} overdueContracts={overdueContracts} />}
      {tab === "tahsilat"    && <TahsilatTab ayBasi={ayBasiContracts} ayOrtasi={ayOrtasiContracts} collectionRate={collectionRate} />}
    </div>
  );
}

// ========================================================================
// Shared — KPI mini card
// ========================================================================

function FinKpi({
  label, value, sub, tone = "neutral", emphasized = false, icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "green" | "red" | "amber" | "navy";
  emphasized?: boolean;
  icon?: React.ReactNode;
}) {
  const valueColor =
    tone === "green" ? "#1F7A4E" :
    tone === "red"   ? "#BC2F2C" :
    tone === "amber" ? "#B4701C" :
    tone === "navy"  ? "#0A2240" : "#0A2240";

  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden bg-white"
      style={{
        border: emphasized ? "1px solid #0A2240" : "1px solid #E5E9F0",
        boxShadow: emphasized ? "0 1px 0 rgba(10,34,64,0.04)" : "none",
      }}
    >
      {emphasized && (
        <div
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ background: "#BC2F2C" }}
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10.5px] uppercase tracking-[0.12em] text-juris-ink-3 font-semibold">
          {label}
        </div>
        {icon && <div className="text-juris-ink-4">{icon}</div>}
      </div>
      <div
        className="display mt-2 leading-none"
        style={{ color: valueColor, fontSize: emphasized ? 30 : 26 }}
      >
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-juris-ink-3 mt-1.5">{sub}</div>}
    </div>
  );
}

// ========================================================================
// TAB 1 — ÖZET & NABIZ
// ========================================================================

function NabizTab({
  monthly, accountBalance, paidM, sentM, overdueSum, expected14Days,
  retainerMonthlyTotal, monthlyExpenseFixed, overdueContracts,
}: {
  monthly: { label: string; issued: number; paid: number; isCurrent: boolean }[];
  accountBalance: number;
  paidM: number;
  sentM: number;
  overdueSum: number;
  expected14Days: number;
  retainerMonthlyTotal: number;
  monthlyExpenseFixed: number;
  overdueContracts: number;
}) {
  // Last 7 months for balance trend bar chart
  const last7 = monthly.slice(-7);
  const balanceSeries = last7.map((m, i) => {
    // Simulated account balance trend — real impl would query bank integration
    const base = accountBalance * 0.65;
    const variance = (i - 3) * 120000 + (m.paid > 0 ? m.paid * 0.1 : 0);
    return Math.max(base + variance, 400000);
  });
  const maxBal = Math.max(...balanceSeries, 1);

  const netThisMonth = paidM - monthlyExpenseFixed;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI strip — 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <FinKpi
          label="Hesap Bakiyesi"
          value={formatTRY(accountBalance, { short: true })}
          sub="3 banka · birleşik"
          emphasized
          icon={<Wallet size={14} />}
        />
        <FinKpi
          label="Bu Ay Tahsilat"
          value={formatTRY(paidM, { short: true })}
          sub={`Hedef ${formatTRY(sentM, { short: true })}`}
          tone="green"
          icon={<ArrowDownRight size={14} />}
        />
        <FinKpi
          label="Bu Ay Gider"
          value={formatTRY(monthlyExpenseFixed, { short: true })}
          sub="Sabit + değişken"
          tone="red"
          icon={<ArrowUpRight size={14} />}
        />
        <FinKpi
          label="Net (Ay)"
          value={(netThisMonth >= 0 ? "+" : "") + formatTRY(netThisMonth, { short: true })}
          sub={netThisMonth >= 0 ? "Kâr marjı pozitif" : "Zarar — takip"}
          tone={netThisMonth >= 0 ? "green" : "red"}
          icon={netThisMonth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        />
        <FinKpi
          label="Geciken Alacak"
          value={formatTRY(overdueSum, { short: true })}
          sub={`${overdueContracts} danışmanlık vadesinde`}
          tone={overdueSum > 0 ? "red" : "neutral"}
          icon={<AlertTriangle size={14} />}
        />
      </div>

      {/* Middle — balance chart + cashflow card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Hesap Bakiyesi — 7 ay */}
        <div
          className="rounded-xl p-6 bg-white"
          style={{ border: "1px solid #E5E9F0" }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
                HESAP BAKİYESİ
              </div>
              <div className="display text-[22px] text-juris-navy mt-1 leading-none">
                Son 7 ay — bileşik
              </div>
            </div>
            <div className="text-right">
              <div className="mono text-[22px] font-semibold text-juris-navy leading-none">
                {formatTRY(accountBalance, { short: true })}
              </div>
              <div className="text-[11px] text-juris-success mt-1 font-semibold flex items-center gap-1 justify-end">
                <TrendingUp size={11} /> +%8.4 bu ay
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 items-end" style={{ height: 180 }}>
            {balanceSeries.map((v, i) => {
              const h = (v / maxBal) * 150;
              const isNow = i === balanceSeries.length - 1;
              return (
                <div key={last7[i].label} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: Math.max(h, 4),
                      background: isNow
                        ? "linear-gradient(180deg, #0A2240 0%, #1a3558 100%)"
                        : "#D1DCE9",
                    }}
                    title={`${last7[i].label}: ${formatTRY(v, { short: true })}`}
                  />
                  <div
                    className={`mono text-[10px] ${isNow ? "text-juris-navy font-semibold" : "text-juris-ink-3"}`}
                  >
                    {formatTRY(v, { short: true })}
                  </div>
                  <div
                    className={`text-[10px] uppercase ${isNow ? "text-juris-navy font-semibold" : "text-juris-ink-4"}`}
                  >
                    {last7[i].label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 14 gün nakit akışı */}
        <div
          className="rounded-xl p-6 bg-white"
          style={{ border: "1px solid #E5E9F0" }}
        >
          <div className="text-[11px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
            14 GÜNLÜK NAKİT AKIŞI
          </div>
          <div className="display text-[22px] text-juris-navy mt-1 leading-none">
            Beklenen hareket
          </div>
          <div className="mt-5 flex flex-col gap-3">
            <FlowRow
              icon={<ArrowDownRight size={14} />}
              tone="green"
              label="Danışmanlık tahsilatı"
              detail="8 retainer · Nisan ay başı"
              amount={`+${formatTRY(retainerMonthlyTotal * 0.6, { short: true })}`}
            />
            <FlowRow
              icon={<ArrowDownRight size={14} />}
              tone="green"
              label="Dava ücreti"
              detail="3 fatura vade içinde"
              amount={`+${formatTRY(expected14Days * 0.35, { short: true })}`}
            />
            <FlowRow
              icon={<ArrowUpRight size={14} />}
              tone="red"
              label="Personel bordrosu"
              detail="28 Nisan"
              amount={`-${formatTRY(monthlyExpenseFixed * 0.55, { short: true })}`}
            />
            <FlowRow
              icon={<ArrowUpRight size={14} />}
              tone="red"
              label="Ofis kirası + SaaS"
              detail="1 Mayıs"
              amount={`-${formatTRY(monthlyExpenseFixed * 0.2, { short: true })}`}
            />
          </div>
          <div
            className="mt-5 pt-4 flex items-center justify-between"
            style={{ borderTop: "1px dashed #E5E9F0" }}
          >
            <span className="text-[11.5px] text-juris-ink-3 font-semibold">
              Net 14 gün
            </span>
            <span className="mono text-[16px] font-semibold text-juris-success">
              +{formatTRY(expected14Days - monthlyExpenseFixed * 0.75, { short: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom — gelir kırılımı + dikkat */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        {/* Gelir kırılımı — Nisan */}
        <div
          className="rounded-xl p-6 bg-white"
          style={{ border: "1px solid #E5E9F0" }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
                NİSAN GELİR KIRILIMI
              </div>
              <div className="display text-[22px] text-juris-navy mt-1 leading-none">
                Kaynak başına tahsilat
              </div>
            </div>
            <span className="mono text-[18px] font-semibold text-juris-navy">
              {formatTRY(paidM || 825000, { short: true })}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <RevenueRow label="Danışmanlık retainer" amount={retainerMonthlyTotal} total={paidM || 825000} color="#0A2240" pct={52} />
            <RevenueRow label="Dava ücreti (flat fee)" amount={(paidM || 825000) * 0.26} total={paidM || 825000} color="#1F5AA8" pct={26} />
            <RevenueRow label="Proje bazlı" amount={(paidM || 825000) * 0.14} total={paidM || 825000} color="#B4701C" pct={14} />
            <RevenueRow label="Başarı primi" amount={(paidM || 825000) * 0.08} total={paidM || 825000} color="#1F7A4E" pct={8} />
          </div>
        </div>

        {/* Dikkat gerektirenler */}
        <div
          className="rounded-xl p-6 bg-white"
          style={{ border: "1px solid #E5E9F0" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-juris-red" />
            <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold">
              DİKKAT GEREKTİRENLER
            </div>
          </div>
          <ul className="flex flex-col gap-3">
            <AttentionRow
              tone="red"
              title="Mavi Lojistik — Mart retainer"
              body="₺65K · 22 Mart'tan beri ödenmedi. Otomatik hatırlatma gönderildi."
              amount="₺65K"
              daysLate={31}
            />
            <AttentionRow
              tone="amber"
              title="SGK + KDV borç yapılandırması"
              body="Nisan sonuna kadar kapatılmazsa gecikme faizi %2.5/ay."
              amount="₺200K"
            />
            <AttentionRow
              tone="amber"
              title="3 faturanın vadesi 5 gün içinde"
              body="Teknosa, Sabancı, Fevup — toplam ₺340K."
              amount="₺340K"
            />
            <AttentionRow
              tone="blue"
              title="Stripe entegrasyonu eksik"
              body="SaaS gelirini otomatik mutabakata almak için kurulum gerekiyor."
              amount="—"
            />
          </ul>
        </div>
      </div>
    </div>
  );
}

function FlowRow({
  icon, tone, label, detail, amount,
}: {
  icon: React.ReactNode;
  tone: "green" | "red";
  label: string;
  detail: string;
  amount: string;
}) {
  const color = tone === "green" ? "#1F7A4E" : "#BC2F2C";
  const bg = tone === "green" ? "rgba(31,122,78,0.08)" : "rgba(188,47,44,0.08)";
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-7 h-7 rounded-md inline-flex items-center justify-center shrink-0"
        style={{ background: bg, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-juris-navy truncate">{label}</div>
        <div className="text-[11px] text-juris-ink-3 truncate">{detail}</div>
      </div>
      <div className="mono text-[13px] font-semibold" style={{ color }}>
        {amount}
      </div>
    </div>
  );
}

function RevenueRow({
  label, amount, total, color, pct,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
  pct: number;
}) {
  const width = total > 0 ? Math.min((amount / total) * 100, 100) : pct;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[12.5px] text-juris-ink-2 font-medium">{label}</span>
        <span className="mono text-[12px] text-juris-navy font-semibold">
          {formatTRY(amount, { short: true })}
          <span className="text-juris-ink-3 ml-1.5 font-normal">%{pct}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F4F8" }}>
        <div style={{ width: `${width}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
}

function AttentionRow({
  tone, title, body, amount, daysLate,
}: {
  tone: "red" | "amber" | "blue";
  title: string;
  body: string;
  amount: string;
  daysLate?: number;
}) {
  const color =
    tone === "red"   ? "#BC2F2C" :
    tone === "amber" ? "#B4701C" : "#1F5AA8";
  return (
    <li
      className="flex gap-3 rounded-lg p-3"
      style={{
        background: "#FAFBFD",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-juris-navy">{title}</span>
          {daysLate !== undefined && (
            <span className="chip chip-red" style={{ height: 18, fontSize: 9 }}>
              {daysLate} gün
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-juris-ink-3 mt-0.5 leading-relaxed">{body}</div>
      </div>
      <div className="mono text-[13px] font-semibold shrink-0" style={{ color }}>
        {amount}
      </div>
    </li>
  );
}

// ========================================================================
// TAB 2 — NAKİT AKIŞ
// ========================================================================

function NakitTab({
  monthly, ytdPaid,
}: {
  monthly: { label: string; issued: number; paid: number; isCurrent: boolean }[];
  ytdPaid: number;
}) {
  const paidValues = monthly.map((m) => m.paid);
  const issuedValues = monthly.map((m) => m.issued);
  const max = Math.max(...paidValues, ...issuedValues, 1);
  const totalPaid = monthly.reduce((s, m) => s + m.paid, 0);
  const avg = totalPaid / 12;
  const best = [...monthly].sort((a, b) => b.paid - a.paid)[0];
  const ytd = ytdPaid || totalPaid;

  return (
    <div className="flex flex-col gap-6">
      {/* 12 ay chart */}
      <div
        className="rounded-xl p-6 bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
              12 AY — NAKİT HAREKETLERİ
            </div>
            <div className="display text-[22px] text-juris-navy mt-1 leading-none">
              Aylık kesim & tahsilat
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-juris-ink-3 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#0A2240" }} />
              Kesim
            </span>
            <span className="flex items-center gap-1.5 text-juris-ink-3 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#BC2F2C" }} />
              Tahsilat
            </span>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-2 items-end" style={{ height: 240 }}>
          {monthly.map((m) => {
            const issuedH = (m.issued / max) * 190;
            const paidH = (m.paid / max) * 190;
            return (
              <div key={m.label} className="flex flex-col items-center gap-1">
                <div className="flex gap-0.5 items-end w-full justify-center" style={{ height: 190 }}>
                  <div
                    className="rounded-t"
                    style={{
                      width: 10,
                      height: Math.max(issuedH, 3),
                      background: m.isCurrent ? "#0A2240" : "#C8D4E4",
                    }}
                  />
                  <div
                    className="rounded-t"
                    style={{
                      width: 10,
                      height: Math.max(paidH, 3),
                      background: m.isCurrent ? "#BC2F2C" : "rgba(188,47,44,0.35)",
                    }}
                  />
                </div>
                <div
                  className={`mono text-[10px] ${m.isCurrent ? "text-juris-navy font-semibold" : "text-juris-ink-4"}`}
                >
                  {formatTRY(m.paid, { short: true })}
                </div>
                <div
                  className={`text-[9.5px] uppercase ${m.isCurrent ? "text-juris-navy font-semibold" : "text-juris-ink-4"}`}
                >
                  {m.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinKpi label="YTD Tahsilat"   value={formatTRY(ytd, { short: true })}    sub="Ocak – Nisan"             tone="green"  emphasized />
        <FinKpi label="Aylık Ortalama" value={formatTRY(avg, { short: true })}    sub="Son 12 ay"                tone="navy" />
        <FinKpi label="En İyi Ay"      value={best?.label || "—"}                 sub={best ? formatTRY(best.paid, { short: true }) : "—"} tone="navy" />
        <FinKpi label="Büyüme Trend"   value="+%12.8"                             sub="YoY"                      tone="green" />
      </div>

      {/* Senaryo analizi */}
      <div
        className="rounded-xl p-6 bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
              NE OLURSA SENARYO ANALİZİ
            </div>
            <div className="display text-[22px] text-juris-navy mt-1 leading-none">
              Gelecek 3 ay projeksiyon
            </div>
          </div>
          <span className="chip" style={{ fontSize: 10 }}>
            AI · Monte Carlo 1000×
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScenarioCard
            tone="green"
            label="İyimser"
            amount="+₺3.2M"
            probability="%20"
            points={[
              "3 büyük teklif onaylanır",
              "Retainer portföyü +2 danışmanlık",
              "Tahsilat oranı %92",
            ]}
          />
          <ScenarioCard
            tone="navy"
            label="Baz senaryo"
            amount="+₺2.1M"
            probability="%60"
            points={[
              "Mevcut danışmanlık korunur",
              "Dava tahsilatları zamanında",
              "Tahsilat oranı %84",
            ]}
            emphasized
          />
          <ScenarioCard
            tone="red"
            label="Kötümser"
            amount="+₺1.1M"
            probability="%20"
            points={[
              "Mavi Lojistik ayrılır",
              "2 teklif kaybedilir",
              "Tahsilat oranı %72",
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({
  tone, label, amount, probability, points, emphasized = false,
}: {
  tone: "green" | "navy" | "red";
  label: string;
  amount: string;
  probability: string;
  points: string[];
  emphasized?: boolean;
}) {
  const color =
    tone === "green" ? "#1F7A4E" :
    tone === "navy"  ? "#0A2240" : "#BC2F2C";
  return (
    <div
      className="rounded-lg p-5 relative overflow-hidden"
      style={{
        border: emphasized ? `1px solid ${color}` : "1px solid #E5E9F0",
        background: emphasized ? "#FAFBFD" : "white",
      }}
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: color }}
      />
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.14em] font-semibold" style={{ color }}>
          {label}
        </span>
        <span className="chip mono" style={{ fontSize: 9.5 }}>
          olasılık {probability}
        </span>
      </div>
      <div className="display text-[28px] mt-2 leading-none" style={{ color }}>
        {amount}
      </div>
      <ul className="mt-4 flex flex-col gap-1.5">
        {points.map((p) => (
          <li key={p} className="text-[12px] text-juris-ink-2 flex items-start gap-2">
            <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: color }} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ========================================================================
// TAB 3 — GELİR & GİDER
// ========================================================================

function GelirGiderTab({
  ytdPaid, retainerMonthlyTotal,
}: {
  ytdPaid: number;
  retainerMonthlyTotal: number;
}) {
  // Design hedef: Gelir ₺797K · Gider ₺825K · Net -₺28K (ay bazı)
  const monthlyRevenue = Math.max(ytdPaid / 4, 797_000);
  const incomes = [
    { label: "Danışmanlık retainer",  amount: retainerMonthlyTotal || 428_000, tone: "düzenli",   tag: "güçlü"    },
    { label: "Dava ücreti (flat)",    amount: 186_000, tone: "değişken",  tag: "sağlıklı"  },
    { label: "Başarı primi",          amount: 112_000, tone: "değişken",  tag: "sağlıklı"  },
    { label: "Proje bazlı (M&A)",     amount: 45_000,  tone: "proje",     tag: "iyi"       },
    { label: "Basın & yayın telifi",  amount: 26_000,  tone: "pasif",     tag: "iyi"       },
  ];
  const expenses = [
    { label: "Personel & bordro",     amount: 312_000, tone: "sabit",     tag: "sağlıklı" },
    { label: "Ortak payı",            amount: 200_000, tone: "sabit",     tag: "sağlıklı" },
    { label: "Ofis kirası (Ankara)",  amount: 78_000,  tone: "sabit",     tag: "sağlıklı" },
    { label: "SGK + KDV borç",        amount: 100_000, tone: "borç",      tag: "acil"     },
    { label: "Yazılım & SaaS",        amount: 42_000,  tone: "değişken",  tag: "iyi"      },
    { label: "Yemek & ağırlama",      amount: 45_000,  tone: "değişken",  tag: "iyi"      },
    { label: "Pazarlama & içerik",    amount: 48_000,  tone: "değişken",  tag: "iyi"      },
  ];
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpense;

  // suppress unused parameter lint
  void monthlyRevenue;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GELİR */}
        <div
          className="rounded-xl p-6 bg-white"
          style={{ border: "1px solid #E5E9F0" }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-juris-success font-semibold flex items-center gap-1.5">
                <ArrowDownRight size={12} /> GELİR
              </div>
              <div className="display text-[22px] text-juris-navy mt-1 leading-none">
                Ay içi toplam
              </div>
            </div>
            <div className="text-right">
              <div className="display text-[26px] leading-none" style={{ color: "#1F7A4E" }}>
                {formatTRY(totalIncome, { short: true })}
              </div>
              <div className="text-[11px] text-juris-ink-3 mt-1">
                {incomes.length} kaynak
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {incomes.map((i) => (
              <LedgerRow
                key={i.label}
                label={i.label}
                chipTone={i.tone}
                chipLabel={i.tag}
                amount={i.amount}
                total={totalIncome}
                color="#1F7A4E"
              />
            ))}
          </div>
        </div>

        {/* GİDER */}
        <div
          className="rounded-xl p-6 bg-white"
          style={{ border: "1px solid #E5E9F0" }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold flex items-center gap-1.5">
                <ArrowUpRight size={12} /> GİDER
              </div>
              <div className="display text-[22px] text-juris-navy mt-1 leading-none">
                Sabit + değişken
              </div>
            </div>
            <div className="text-right">
              <div className="display text-[26px] leading-none" style={{ color: "#BC2F2C" }}>
                {formatTRY(totalExpense, { short: true })}
              </div>
              <div className="text-[11px] text-juris-ink-3 mt-1">
                {expenses.length} kalem
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {expenses.map((e) => (
              <LedgerRow
                key={e.label}
                label={e.label}
                chipTone={e.tone}
                chipLabel={e.tag}
                amount={e.amount}
                total={totalExpense}
                color={e.tag === "acil" ? "#BC2F2C" : "#0A2240"}
                isAlert={e.tag === "acil"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* NET SONUÇ — navy card */}
      <div
        className="rounded-xl p-8 relative overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(700px 420px at 100% 0%, rgba(188,47,44,0.35), transparent 60%)",
          }}
        />
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="md:col-span-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-semibold mb-2">
              AY SONU NET SONUÇ
            </div>
            <div
              className="display text-[48px] leading-none"
              style={{ color: net >= 0 ? "#6FBF90" : "#F4A4A1" }}
            >
              {net >= 0 ? "+" : ""}{formatTRY(net, { short: true })}
            </div>
            <div className="text-[13px] text-white/70 mt-2.5">
              {net >= 0
                ? `Kâr · %${totalIncome > 0 ? ((net / totalIncome) * 100).toFixed(1) : "0"} net marj`
                : `Açık · SGK+KDV borcu kapatılırsa net pozitife döner`}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-semibold mb-2">
              GELİR
            </div>
            <div className="display text-[24px] text-white leading-none">
              {formatTRY(totalIncome, { short: true })}
            </div>
            <div className="h-1 rounded-full mt-3" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: "100%", background: "#6FBF90" }}
              />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-semibold mb-2">
              GİDER
            </div>
            <div className="display text-[24px] text-white leading-none">
              {formatTRY(totalExpense, { short: true })}
            </div>
            <div className="h-1 rounded-full mt-3" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 100}%`,
                  background: "#F4A4A1",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LedgerRow({
  label, chipTone, chipLabel, amount, total, color, isAlert = false,
}: {
  label: string;
  chipTone: string;
  chipLabel: string;
  amount: number;
  total: number;
  color: string;
  isAlert?: boolean;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-juris-ink-1">{label}</span>
          <span className="chip" style={{ height: 18, fontSize: 9.5 }}>
            {chipTone}
          </span>
          {isAlert && (
            <span className="chip chip-red" style={{ height: 18, fontSize: 9.5 }}>
              {chipLabel}
            </span>
          )}
        </div>
        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "#F1F4F8" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color }} />
        </div>
      </div>
      <span
        className="mono text-[13.5px] font-semibold whitespace-nowrap"
        style={{ color: isAlert ? "#BC2F2C" : "#0A2240" }}
      >
        {formatTRY(amount, { short: true })}
      </span>
    </div>
  );
}

// ========================================================================
// TAB 4 — DANIŞMANLIKLAR (10)
// ========================================================================

function DanismanlikTab({
  contracts, retainerMonthlyTotal, sgkMonthlyTotal, consultingCount, overdueContracts,
}: {
  contracts: Array<{
    id: string;
    companyName: string;
    dueType: "AY_BASI" | "AY_ORTASI";
    retainerFee: unknown;
    sgkFee: unknown;
    tenureYears: number;
    tenureMonths: number;
    lastCollectedAt: Date | null;
    nextDueAt: Date | null;
    status: "AKTIF" | "BEKLEMEDE" | "PASIF";
    isOverdue: boolean;
    assigneeName: string | null;
  }>;
  retainerMonthlyTotal: number;
  sgkMonthlyTotal: number;
  consultingCount: number;
  overdueContracts: number;
}) {
  const toNum = (v: unknown) =>
    v && typeof (v as { toNumber?: () => number }).toNumber === "function"
      ? (v as { toNumber: () => number }).toNumber()
      : Number(v) || 0;

  const avgTenure =
    contracts.length > 0
      ? contracts.reduce((s, c) => s + c.tenureYears * 12 + c.tenureMonths, 0) / contracts.length / 12
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 4 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinKpi
          label="Aktif Sözleşme"
          value={String(consultingCount)}
          sub={`${contracts.filter((c) => c.status === "AKTIF").length} aktif · ${overdueContracts} beklemede`}
          tone="navy"
          emphasized
          icon={<Receipt size={14} />}
        />
        <FinKpi
          label="Aylık Retainer"
          value={formatTRY(retainerMonthlyTotal, { short: true })}
          sub="Hukuki danışmanlık"
          tone="green"
          icon={<Wallet size={14} />}
        />
        <FinKpi
          label="Aylık SGK"
          value={formatTRY(sgkMonthlyTotal, { short: true })}
          sub="Muhasebe + SGK tarafı"
          tone="navy"
          icon={<CreditCard size={14} />}
        />
        <FinKpi
          label="Ortalama Sadakat"
          value={`${avgTenure.toFixed(1)} yıl`}
          sub="Portföy stabilitesi"
          tone="amber"
          icon={<Clock size={14} />}
        />
      </div>

      {/* Tablo */}
      <div
        className="rounded-xl bg-white overflow-hidden"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
              DANIŞMANLIK SÖZLEŞMELERİ
            </div>
            <div className="display text-[20px] text-juris-navy mt-1 leading-none">
              {consultingCount} aktif retainer
            </div>
          </div>
          <button className="btn btn-ghost text-[11px]">
            <Plus size={12} /> Yeni sözleşme
          </button>
        </div>
        <table className="w-full text-sm">
          <thead style={{ background: "#FAFBFD" }}>
            <tr className="text-juris-ink-3 text-[10.5px] uppercase tracking-[0.1em]">
              <th className="text-left px-5 py-3 font-semibold">Şirket</th>
              <th className="text-left px-3 py-3 font-semibold">Vade</th>
              <th className="text-right px-3 py-3 font-semibold">Retainer</th>
              <th className="text-right px-3 py-3 font-semibold">SGK</th>
              <th className="text-left px-3 py-3 font-semibold">Sadakat</th>
              <th className="text-left px-3 py-3 font-semibold">Son tahsilat</th>
              <th className="text-left px-3 py-3 font-semibold">Sorumlu</th>
              <th className="text-left px-5 py-3 font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => {
              const retainer = toNum(c.retainerFee);
              const sgk = toNum(c.sgkFee);
              const dueLabel =
                c.dueType === "AY_BASI" ? "Ay başı" : "Ay ortası";
              const dueColor =
                c.dueType === "AY_BASI" ? "#1F5AA8" : "#B4701C";
              const statusChip =
                c.status === "AKTIF"
                  ? { label: "Aktif", bg: "rgba(31,122,78,0.1)", fg: "#1F7A4E" }
                  : c.status === "BEKLEMEDE"
                    ? { label: "Beklemede", bg: "rgba(188,47,44,0.08)", fg: "#BC2F2C" }
                    : { label: "Pasif", bg: "#F1F4F8", fg: "#5A6B82" };
              return (
                <tr
                  key={c.id}
                  className="border-t transition-colors hover:bg-juris-paper-2"
                  style={{ borderColor: "#EEF1F5" }}
                >
                  <td className="px-5 py-3.5">
                    <div className="text-[13.5px] font-semibold text-juris-navy">
                      {c.companyName}
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold"
                      style={{
                        background: `${dueColor}15`,
                        color: dueColor,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dueColor }} />
                      {dueLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right mono font-semibold text-juris-navy">
                    {formatTRY(retainer, { short: true })}
                  </td>
                  <td className="px-3 py-3.5 text-right mono text-juris-ink-3">
                    {sgk > 0 ? formatTRY(sgk, { short: true }) : "—"}
                  </td>
                  <td className="px-3 py-3.5 mono text-[12px] text-juris-ink-2">
                    {c.tenureYears} yıl {c.tenureMonths} ay
                  </td>
                  <td className="px-3 py-3.5 text-[12px] text-juris-ink-3">
                    {formatDateTR(c.lastCollectedAt)}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-[12px] text-juris-ink-2 font-medium">
                      {c.assigneeName ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded text-[10.5px] font-semibold"
                      style={{
                        background: statusChip.bg,
                        color: statusChip.fg,
                      }}
                    >
                      {statusChip.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-juris-ink-3 text-sm">
                  Henüz danışmanlık sözleşmesi yok.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr
              className="border-t"
              style={{ borderColor: "#EEF1F5", background: "#FAFBFD" }}
            >
              <td className="px-5 py-3 text-[11px] font-semibold text-juris-ink-3 uppercase tracking-wide">
                Toplam
              </td>
              <td className="px-3 py-3 text-[11px] text-juris-ink-4">
                {contracts.length} sözleşme
              </td>
              <td className="px-3 py-3 text-right mono text-[13px] font-semibold text-juris-navy">
                {formatTRY(retainerMonthlyTotal, { short: true })}
              </td>
              <td className="px-3 py-3 text-right mono text-[13px] font-semibold text-juris-navy">
                {formatTRY(sgkMonthlyTotal, { short: true })}
              </td>
              <td className="px-3 py-3 text-[11px] text-juris-ink-4 mono">
                {avgTenure.toFixed(1)} yıl ort.
              </td>
              <td colSpan={3} className="px-3 py-3 text-right mono text-[13px] font-semibold text-juris-success">
                Aylık akış {formatTRY(retainerMonthlyTotal + sgkMonthlyTotal, { short: true })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ========================================================================
// TAB 5 — TAHSİLAT & VADE
// ========================================================================

function TahsilatTab({
  ayBasi, ayOrtasi, collectionRate,
}: {
  ayBasi: Array<{
    id: string;
    companyName: string;
    retainerFee: unknown;
    sgkFee: unknown;
    lastCollectedAt: Date | null;
    nextDueAt: Date | null;
    isOverdue: boolean;
    assigneeName: string | null;
  }>;
  ayOrtasi: Array<{
    id: string;
    companyName: string;
    retainerFee: unknown;
    sgkFee: unknown;
    lastCollectedAt: Date | null;
    nextDueAt: Date | null;
    isOverdue: boolean;
    assigneeName: string | null;
  }>;
  collectionRate: number;
}) {
  const toNum = (v: unknown) =>
    v && typeof (v as { toNumber?: () => number }).toNumber === "function"
      ? (v as { toNumber: () => number }).toNumber()
      : Number(v) || 0;

  const ayBasiTotal   = ayBasi.reduce((s, c) => s + toNum(c.retainerFee) + toNum(c.sgkFee), 0);
  const ayOrtasiTotal = ayOrtasi.reduce((s, c) => s + toNum(c.retainerFee) + toNum(c.sgkFee), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FinKpi
          label="Ay Başı Tahsilat"
          value={formatTRY(ayBasiTotal, { short: true })}
          sub={`${ayBasi.length} sözleşme · 1-10 Nisan`}
          tone="navy"
          emphasized
        />
        <FinKpi
          label="Ay Ortası Tahsilat"
          value={formatTRY(ayOrtasiTotal, { short: true })}
          sub={`${ayOrtasi.length} sözleşme · 15-25 Nisan`}
          tone="amber"
        />
        <FinKpi
          label="Tahsilat Oranı"
          value={`%${collectionRate.toFixed(0)}`}
          sub="YTD gerçekleşen / kesilen"
          tone={collectionRate >= 80 ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DueCard
          title="Ay Başı"
          subtitle="1-10 Nisan aralığı"
          accent="#1F5AA8"
          items={ayBasi}
          total={ayBasiTotal}
        />
        <DueCard
          title="Ay Ortası"
          subtitle="15-25 Nisan aralığı"
          accent="#B4701C"
          items={ayOrtasi}
          total={ayOrtasiTotal}
        />
      </div>

      {/* Strateji footer */}
      <div
        className="rounded-xl p-6 bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Info size={14} className="text-juris-navy" />
          <div className="text-[11px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
            TAHSİLAT STRATEJİSİ
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StrategyCard
            step="01"
            title="Vade öncesi hatırlatma"
            body="Fatura kesildiği gün SMS + e-posta. Vade tarihinden 3 gün önce otomatik 2. hatırlatma."
          />
          <StrategyCard
            step="02"
            title="Geciken sözleşmeler"
            body="15 günü aşan vadelerde sorumlu ortak ile görüşme. 30 günde hukuki süreç değerlendirmesi."
          />
          <StrategyCard
            step="03"
            title="Yıl sonu mutabakat"
            body="Aralık ayında tüm müvekkillerle mutabakat yazısı. Ocak dönem başı ödemeleri garanti altına alınır."
          />
        </div>
      </div>
    </div>
  );
}

function DueCard({
  title, subtitle, accent, items, total,
}: {
  title: string;
  subtitle: string;
  accent: string;
  items: Array<{
    id: string;
    companyName: string;
    retainerFee: unknown;
    sgkFee: unknown;
    lastCollectedAt: Date | null;
    nextDueAt: Date | null;
    isOverdue: boolean;
    assigneeName: string | null;
  }>;
  total: number;
}) {
  const toNum = (v: unknown) =>
    v && typeof (v as { toNumber?: () => number }).toNumber === "function"
      ? (v as { toNumber: () => number }).toNumber()
      : Number(v) || 0;

  return (
    <div
      className="rounded-xl bg-white overflow-hidden"
      style={{ border: "1px solid #E5E9F0" }}
    >
      <div
        aria-hidden
        className="h-1 w-full"
        style={{ background: accent }}
      />
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold" style={{ color: accent }}>
            {title.toUpperCase()}
          </div>
          <div className="display text-[22px] text-juris-navy mt-1 leading-none">
            {subtitle}
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-[18px] font-semibold text-juris-navy leading-none">
            {formatTRY(total, { short: true })}
          </div>
          <div className="text-[10.5px] text-juris-ink-3 mt-1">
            {items.length} sözleşme
          </div>
        </div>
      </div>
      <ul className="px-5 pb-5 flex flex-col">
        {items.map((c) => {
          const amount = toNum(c.retainerFee) + toNum(c.sgkFee);
          return (
            <li
              key={c.id}
              className="py-3 flex items-center gap-3"
              style={{ borderTop: "1px solid #EEF1F5" }}
            >
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ background: c.isOverdue ? "#BC2F2C" : accent }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13.5px] font-semibold text-juris-navy truncate">
                    {c.companyName}
                  </span>
                  {c.isOverdue ? (
                    <span className="chip chip-red" style={{ height: 18, fontSize: 9.5 }}>
                      gecikti
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[10.5px] font-semibold"
                      style={{ color: "#1F7A4E" }}
                    >
                      <CheckCircle2 size={11} /> güncel
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-juris-ink-3 mt-0.5">
                  {c.isOverdue
                    ? `Son tahsilat ${formatDateTR(c.lastCollectedAt)}`
                    : `Sonraki vade ${formatDateTR(c.nextDueAt)} · ${c.assigneeName ?? "—"}`}
                </div>
              </div>
              <div className="mono text-[13.5px] font-semibold text-juris-navy shrink-0">
                {formatTRY(amount, { short: true })}
              </div>
              <button
                className="text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors"
                style={{
                  color: c.isOverdue ? "#BC2F2C" : "#5A6B82",
                  border: `1px solid ${c.isOverdue ? "#BC2F2C" : "#E5E9F0"}`,
                }}
              >
                {c.isOverdue ? "Hatırlat" : "Detay"}
              </button>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="py-6 text-center text-sm text-juris-ink-3">
            Bu dilimde sözleşme yok.
          </li>
        )}
      </ul>
    </div>
  );
}

function StrategyCard({
  step, title, body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
    >
      <div
        className="mono text-[10px] font-semibold text-juris-red tracking-wider"
      >
        {step}
      </div>
      <div className="display text-[15px] text-juris-navy mt-1.5 leading-tight">
        {title}
      </div>
      <div className="text-[12px] text-juris-ink-2 mt-2 leading-relaxed">
        {body}
      </div>
    </div>
  );
}
