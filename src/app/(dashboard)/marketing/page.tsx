import Link from "next/link";
import {
  Plus, Calendar, ExternalLink, FileEdit, Megaphone, Mail,
  Linkedin, Globe, Video, Hash, MessageCircle, Podcast, Sparkles, TrendingUp,
} from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { Kpi } from "@/components/ui/kpi";
import { formatDateTR } from "@/lib/utils";
import type { ContentStatus, ContentChannel } from "@prisma/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { tr } from "date-fns/locale";
import { SourcesButton } from "@/components/shell/sources-panel";

export const metadata = { title: "Pazarlama" };

const CHANNEL_META: Record<ContentChannel, { label: string; icon: typeof Hash; color: string }> = {
  BLOG: { label: "Blog", icon: Globe, color: "#0A2240" },
  LINKEDIN: { label: "LinkedIn", icon: Linkedin, color: "#0077B5" },
  INSTAGRAM: { label: "Instagram", icon: Hash, color: "#E4405F" },
  X: { label: "X (Twitter)", icon: MessageCircle, color: "#1F2937" },
  NEWSLETTER: { label: "Bülten", icon: Mail, color: "#B4701C" },
  PODCAST: { label: "Podcast", icon: Podcast, color: "#8338EC" },
  VIDEO: { label: "Video", icon: Video, color: "#BC2F2C" },
  OTHER: { label: "Diğer", icon: Hash, color: "#5A6B82" },
};

const STATUS_TONE: Record<ContentStatus, "green" | "blue" | "amber" | "red" | ""> = {
  IDEA: "",
  DRAFT: "",
  REVIEW: "amber",
  SCHEDULED: "blue",
  PUBLISHED: "green",
  ARCHIVED: "",
};

const STATUS_LABEL: Record<ContentStatus, string> = {
  IDEA: "Fikir",
  DRAFT: "Taslak",
  REVIEW: "Onay",
  SCHEDULED: "Zamanlı",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşiv",
};

export default async function MarketingPage() {
  const { firmId } = await requireTenant();
  const now = new Date();

  // Last 6 months for trend
  const monthRanges = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return {
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: format(d, "MMM", { locale: tr }),
      isCurrent: i === 5,
    };
  });

  const [items, statusCounts, byChannel, ...monthlyPublished] = await Promise.all([
    prisma.contentItem.findMany({
      where: { firmId },
      orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.contentItem.groupBy({
      by: ["status"],
      where: { firmId },
      _count: { _all: true },
    }),
    prisma.contentItem.groupBy({
      by: ["channel"],
      where: { firmId },
      _count: { _all: true },
    }),
    ...monthRanges.map((m) =>
      prisma.contentItem.count({
        where: {
          firmId,
          status: "PUBLISHED",
          publishedAt: { gte: m.start, lte: m.end },
        },
      }),
    ),
  ]);

  const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));
  const published = statusMap.PUBLISHED ?? 0;
  const scheduled = statusMap.SCHEDULED ?? 0;
  const inPipeline = (statusMap.IDEA ?? 0) + (statusMap.DRAFT ?? 0) + (statusMap.REVIEW ?? 0);

  const funnelStages: { status: ContentStatus; label: string; color: string }[] = [
    { status: "IDEA", label: "Fikir", color: "#5A6B82" },
    { status: "DRAFT", label: "Taslak", color: "#B4701C" },
    { status: "REVIEW", label: "Onay", color: "#1F5AA8" },
    { status: "SCHEDULED", label: "Zamanlı", color: "#BC2F2C" },
    { status: "PUBLISHED", label: "Yayında", color: "#1F7A4E" },
  ];
  const funnelMax = Math.max(...funnelStages.map((s) => statusMap[s.status] ?? 0), 1);

  const totalForChannel = byChannel.reduce((s, c) => s + c._count._all, 0) || 1;
  const monthlyMax = Math.max(...monthlyPublished as number[], 1);

  return (
    <div className="px-6 py-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-7 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="display text-[32px] text-juris-navy leading-tight">
            Hukuk biliminde sesinizi duyurun.
          </div>
          <div className="text-sm text-juris-ink-3 mt-1.5">
            İçerik takvimi, kanal performansı ve AI-destekli üretim
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SourcesButton moduleKey="marketing" />
          <button className="btn btn-ghost">
            <Sparkles size={14} /> AI ile Fikir
          </button>
          <Link href="/marketing/new" className="btn btn-primary">
            <Plus size={14} /> Yeni İçerik
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Kpi label="Yayında" value={published} sub="tüm zamanlar" emphasized />
        <Kpi
          label="Zamanlandı"
          value={scheduled}
          sub="yaklaşan"
          trend={scheduled > 0 ? "up" : undefined}
        />
        <Kpi label="Hazırlanıyor" value={inPipeline} sub="fikir+taslak+onay" />
        <Kpi label="Trafik 30g" value="—" sub="GA4 bağlanınca" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
        {/* Funnel */}
        <div className="card p-6">
          <SectionHead
            title="Üretim Funnel'ı"
            subtitle="Fikirden yayına — akış sağlığı"
            small
          />
          <div className="space-y-3 mt-2">
            {funnelStages.map((s, i) => {
              const count = statusMap[s.status] ?? 0;
              const pct = (count / funnelMax) * 100;
              const widthPct = 100 - i * 8;
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-juris-ink-3 text-right">{s.label}</div>
                  <div
                    className="relative h-10 rounded flex items-center"
                    style={{
                      width: `${widthPct}%`,
                      background: "rgba(10,34,64,0.04)",
                    }}
                  >
                    <div
                      className="h-full rounded transition-all flex items-center px-3"
                      style={{
                        width: `${Math.max(pct, count > 0 ? 8 : 0)}%`,
                        minWidth: count > 0 ? 48 : 0,
                        background: `linear-gradient(90deg, ${s.color} 0%, ${s.color}CC 100%)`,
                        color: "white",
                      }}
                    >
                      {count > 0 && (
                        <span className="mono text-xs font-semibold">{count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel mix */}
        <div className="card p-6">
          <SectionHead title="Kanal Dağılımı" small />
          {byChannel.length === 0 ? (
            <div className="py-6 text-center text-sm text-juris-ink-3">İçerik yok.</div>
          ) : (
            <ul className="flex flex-col gap-3">
              {byChannel.map((c) => {
                const meta = CHANNEL_META[c.channel] ?? CHANNEL_META.OTHER;
                const Icon = meta.icon;
                const pct = (c._count._all / totalForChannel) * 100;
                return (
                  <li key={c.channel} className="flex items-center gap-3 text-sm">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta.color}14`, color: meta.color }}
                    >
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-juris-navy truncate">{meta.label}</span>
                        <span className="mono text-[11px] text-juris-ink-3">
                          {c._count._all} · %{pct.toFixed(0)}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-juris-line-2 overflow-hidden">
                        <div style={{ width: `${pct}%`, height: "100%", background: meta.color }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Monthly trend */}
        <div className="card p-6 lg:col-span-3">
          <SectionHead
            title="Aylık Yayın Hızı"
            subtitle="Son 6 ay · yayınlanan içerik adedi"
            small
          />
          <div className="grid grid-cols-6 gap-2 items-end pt-2" style={{ height: 160 }}>
            {monthRanges.map((m, i) => {
              const count = (monthlyPublished as number[])[i] ?? 0;
              const h = (count / monthlyMax) * 120;
              return (
                <div key={m.label} className="flex flex-col items-center gap-1">
                  <div className="mono text-xs font-semibold text-juris-navy">
                    {count || "—"}
                  </div>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: Math.max(h, 4),
                      background: m.isCurrent ? "#BC2F2C" : "#D1DCE9",
                    }}
                  />
                  <span className={`text-[10px] uppercase ${m.isCurrent ? "text-juris-navy font-semibold" : "text-juris-ink-4"}`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SectionHead
        title="İçerik Takvimi"
        subtitle={`${items.length} kayıt · en yeniden eskiye`}
        actions={
          <Link href="/marketing/new" className="btn btn-sm btn-primary">
            <Plus size={12} /> Yeni
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <Megaphone size={28} className="text-juris-ink-3 mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">İçerik takvimi boş</h3>
          <p className="text-sm text-juris-ink-3 max-w-md mb-5">
            Blog yazısı, LinkedIn gönderisi, bülten — ilk fikirden yayına kadar tek yerden yönet.
          </p>
          <Link href="/marketing/new" className="btn btn-primary">
            <Plus size={14} /> İlk İçeriği Ekle
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Başlık</th>
                <th className="text-left px-4 py-3 font-semibold w-[140px]">Kanal</th>
                <th className="text-left px-4 py-3 font-semibold w-[120px]">Durum</th>
                <th className="text-left px-4 py-3 font-semibold w-[130px]">Yayın</th>
                <th className="text-left px-4 py-3 font-semibold w-[140px]">Yazar</th>
                <th className="w-[60px]" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const meta = CHANNEL_META[c.channel] ?? CHANNEL_META.OTHER;
                const Icon = meta.icon;
                return (
                  <tr key={c.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                    <td className="px-4 py-3">
                      <div className="font-medium text-juris-navy">{c.title}</div>
                      {c.summary && (
                        <div className="text-[11px] text-juris-ink-3 mt-0.5 line-clamp-1">
                          {c.summary}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Icon size={12} style={{ color: meta.color }} />
                        <span className="text-juris-ink-2">{meta.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`chip chip-${STATUS_TONE[c.status]}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-juris-ink-3">
                      {c.publishedAt
                        ? formatDateTR(c.publishedAt)
                        : c.publishAt
                        ? formatDateTR(c.publishAt)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-juris-ink-2">{c.author ?? "—"}</td>
                    <td className="px-4 py-3">
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-juris-ink-3 hover:text-juris-red"
                          aria-label="Yayını aç"
                        >
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-juris-ink-4">
                          <FileEdit size={14} />
                        </span>
                      )}
                    </td>
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
