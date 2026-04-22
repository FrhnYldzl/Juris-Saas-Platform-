import Link from "next/link";
import {
  Plus, Calendar, Sparkles, ArrowRight, ExternalLink,
  Globe, Linkedin, Mail, Youtube, FileText, Hash,
  RotateCw, Send, Wand2, GitBranch, CheckCircle2, Clock, Circle,
} from "lucide-react";
import type { ContentChannel, ContentStatus, ContentItem } from "@prisma/client";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTR, formatRelativeTR } from "@/lib/utils";
import { MarketingTabs } from "./marketing-tabs";
import { NewContentButton } from "./new-content-button";
import { startOfMonth, endOfMonth, addDays, isSameDay, format } from "date-fns";
import { tr } from "date-fns/locale";

export const metadata = { title: "Pazarlama" };

type TabKey = "ozet" | "plan" | "icerik" | "trafik";

const CHANNEL_META: Record<ContentChannel | "OTHER", { label: string; color: string; icon: typeof Globe }> = {
  BLOG:        { label: "Blog",       color: "#0A2240", icon: Globe },
  LINKEDIN:    { label: "LinkedIn",   color: "#0077B5", icon: Linkedin },
  INSTAGRAM:   { label: "Instagram",  color: "#E4405F", icon: Hash },
  X:           { label: "X",          color: "#1F2937", icon: Hash },
  NEWSLETTER:  { label: "E-Bülten",   color: "#B4701C", icon: Mail },
  PODCAST:     { label: "Podcast",    color: "#8338EC", icon: Hash },
  VIDEO:       { label: "Video",      color: "#BC2F2C", icon: Youtube },
  OTHER:       { label: "Diğer",      color: "#5A6B82", icon: FileText },
};

const STATUS_META: Record<ContentStatus, { label: string; tone: "green" | "amber" | "" }> = {
  IDEA:      { label: "Fikir",   tone: "" },
  DRAFT:     { label: "Taslak",  tone: "" },
  REVIEW:    { label: "İnceleme", tone: "amber" },
  SCHEDULED: { label: "Zamanlı", tone: "" },
  PUBLISHED: { label: "Yayında", tone: "green" },
  ARCHIVED:  { label: "Arşiv",   tone: "" },
};

// Mocked channel performance matching design
const CHANNEL_STATS: { key: string; name: string; icon: typeof Globe; reach: number; leads: number; delta: number }[] = [
  { key: "web",       name: "Web Sitesi", icon: Globe,    reach: 28400, leads: 14, delta: 18 },
  { key: "linkedin",  name: "LinkedIn",   icon: Linkedin, reach: 12800, leads: 8,  delta: 34 },
  { key: "bulten",    name: "E-Bülten",   icon: Mail,     reach: 4200,  leads: 5,  delta: 6  },
  { key: "youtube",   name: "YouTube",    icon: Youtube,  reach: 2100,  leads: 2,  delta: 42 },
  { key: "medium",    name: "Medium",     icon: FileText, reach: 1800,  leads: 1,  delta: 12 },
  { key: "instagram", name: "Instagram",  icon: Hash,     reach: 3400,  leads: 0,  delta: 8  },
];

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: TabKey; id?: string }>;
}) {
  const { firmId } = await requireTenant();
  const params = await searchParams;
  const tab: TabKey = params.tab ?? "ozet";

  const items = await prisma.contentItem.findMany({
    where: { firmId },
    orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });

  const activeItemId = params.id ?? items.find((i) => i.status === "PUBLISHED")?.id ?? items[0]?.id;
  const activeItem = items.find((i) => i.id === activeItemId);

  return (
    <div className="px-6 py-8 max-w-[1540px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-2">
            Pazarlama · İçerik & Trafik
          </div>
          <h1
            className="display leading-tight"
            style={{
              fontSize: "clamp(28px, 3.4vw, 36px)",
              color: "#0A2240", letterSpacing: "-0.015em",
            }}
          >
            Bilgiyi{" "}
            <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>trafiğe</em>,{" "}
            trafiği{" "}
            <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>lead</em>
            &apos;e çevirin.
          </h1>
          <p className="text-sm text-juris-ink-3 mt-2 max-w-3xl">
            İçerik stüdyosu · funnel analizi · kanal performansı · AI konu önerisi
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
            <span className="text-juris-navy">4/5 bağlı</span>
            <span className="text-juris-ink-4">·</span>
            <span className="text-juris-ink-3">Drive</span>
          </div>
          <Link href="/marketing?tab=plan" className="btn btn-ghost">
            <Calendar size={14} /> Ay Planı
          </Link>
          <NewContentButton kind="accent" label="Yeni akış başlat" />
          <button className="btn btn-ghost">
            <Sparkles size={14} /> AI içerik üret
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="mb-6">
        <MarketingTabs active={tab} />
      </div>

      {tab === "ozet" && <OzetTab items={items} />}
      {tab === "plan" && <PlanTab items={items} />}
      {tab === "icerik" && <IcerikTab items={items} activeItem={activeItem ?? null} />}
      {tab === "trafik" && <TrafikTab />}
    </div>
  );
}

// ============================== ÖZET ==============================

function OzetTab({ items }: { items: ContentItem[] }) {
  const published = items.filter((i) => i.status === "PUBLISHED");
  const totalReach = CHANNEL_STATS.reduce((s, c) => s + c.reach, 0);
  const totalLeads = CHANNEL_STATS.reduce((s, c) => s + c.leads, 0);

  // Top 4 recent content
  const top = [...items]
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, 4);

  return (
    <>
      {/* 6 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
        <Kpi
          label="Aylık Erişim"
          value={`${(totalReach / 1000).toFixed(1)}K`}
          delta="+28%"
          trend="up"
          sub="Tüm kanallar"
          emphasized
        />
        <Kpi
          label="Bu Ay Yayın"
          value={published.length}
          delta="+3"
          trend="up"
          sub="6 kanalda"
        />
        <Kpi
          label="Lead"
          value={totalLeads + 112}
          delta="+18%"
          trend="up"
          sub="Pazarlama kaynaklı"
        />
        <Kpi label="Dönüşüm" value="2.4" suffix="%" sub="Hedef 3.5%" />
        <Kpi label="Maliyet / Lead" value="₺340" sub="Geçen ay ₺420" />
        <Kpi
          label="SEO Pozisyon (ort.)"
          value="#12"
          delta="-4"
          trend="up"
          sub="34 keyword takipte"
        />
      </div>

      {/* 2-col: content summary + channel performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* İçerik Özeti */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4 gap-2">
            <div>
              <h3
                className="text-juris-navy leading-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 22, fontWeight: 500, letterSpacing: "-0.005em",
                }}
              >
                İçerik Özeti
              </h3>
              <div className="text-xs text-juris-ink-3 mt-1">
                Yayında + taslak · son 30 gün
              </div>
            </div>
            <Link
              href="/marketing?tab=icerik"
              className="text-xs text-juris-red hover:underline font-semibold"
            >
              İçerik Stüdyosu →
            </Link>
          </div>
          <ul className="flex flex-col gap-5">
            {top.map((c) => {
              const stat = STATUS_META[c.status];
              const reach = c.viewCount;
              const leads = c.leadCount;
              return (
                <li key={c.id}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={
                          stat.tone === "green"
                            ? { background: "rgba(31,122,78,0.12)", color: "#147D5C" }
                            : stat.tone === "amber"
                            ? { background: "rgba(180,112,28,0.12)", color: "#7a4f15" }
                            : { background: "rgba(136,149,171,0.14)", color: "#5A6B82" }
                        }
                      >
                        {stat.label}
                      </span>
                      {c.contentType && (
                        <span className="text-[11px] text-juris-red font-semibold">
                          {c.contentType}
                        </span>
                      )}
                    </div>
                    {reach > 0 && (
                      <div className="text-right flex-shrink-0">
                        <div className="mono text-sm font-semibold text-juris-navy">
                          {reach >= 1000 ? `${(reach / 1000).toFixed(1)}K` : reach}
                        </div>
                        <div className="text-[10px] text-juris-ink-4 mono">{leads} lead</div>
                      </div>
                    )}
                    {reach === 0 && c.draftVersion && (
                      <span className="text-xs text-juris-ink-4 mono">Taslak v{c.draftVersion}</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-juris-navy leading-snug">
                    {c.title}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Kanal Performansı */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4 gap-2">
            <div>
              <h3
                className="text-juris-navy leading-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 22, fontWeight: 500, letterSpacing: "-0.005em",
                }}
              >
                Kanal Performansı
              </h3>
              <div className="text-xs text-juris-ink-3 mt-1">
                Erişim / Lead · son 30 gün
              </div>
            </div>
            <Link
              href="/marketing?tab=trafik"
              className="text-xs text-juris-red hover:underline font-semibold"
            >
              Trafik Stüdyosu →
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-juris-line-2">
            {CHANNEL_STATS.map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.key} className="py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded flex items-center justify-center text-juris-ink-3">
                    <Icon size={14} />
                  </span>
                  <span className="flex-1 text-sm font-medium text-juris-navy">{c.name}</span>
                  <span className="mono text-sm text-juris-navy font-semibold w-[60px] text-right">
                    {c.reach >= 1000 ? `${(c.reach / 1000).toFixed(1)}K` : c.reach}
                  </span>
                  <span className="text-xs text-juris-red font-semibold w-[60px] text-right">
                    {c.leads} lead
                  </span>
                  <span className="text-xs text-juris-success font-semibold w-[50px] text-right">
                    +{c.delta}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Juris AI weekly summary */}
      <div
        className="rounded-md px-5 py-3 flex items-center gap-3 border border-juris-line-2"
        style={{ background: "white" }}
      >
        <Sparkles size={14} className="text-juris-red flex-shrink-0" />
        <div className="flex-1 min-w-0 leading-relaxed text-[13px] text-juris-ink-2">
          <span className="font-semibold text-juris-red">Juris AI · Haftalık Özet:</span>{" "}
          YouTube erişimi +%42 arttı — yeni video serisi çalışıyor. LinkedIn lead
          başına maliyet düşüyor (₺340). &ldquo;Değerlendirme → Lead&rdquo; geçiş
          oranı düşük; CTA revizyonu öneriyorum.{" "}
          <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>
            Yapay zeka hukuk düzenlemesi
          </em>{" "}
          trendi +%310 — whitepaper fırsatı.
        </div>
        <button className="btn btn-sm btn-ghost flex-shrink-0">İçerik üret</button>
      </div>
    </>
  );
}

// ============================== İÇERİK STÜDYOSU ==============================

function IcerikTab({
  items, activeItem,
}: {
  items: ContentItem[];
  activeItem: ContentItem | null;
}) {
  const counts = {
    published: items.filter((i) => i.status === "PUBLISHED").length,
    review: items.filter((i) => i.status === "REVIEW").length,
    draft: items.filter((i) => i.status === "DRAFT").length,
  };

  return (
    <>
      {/* 4 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <Kpi label="Bu Ay Yayın" value={counts.published} delta="+3" trend="up" sub="6 kanalda" />
        <Kpi
          label="Erişim (Ay)"
          value="52.6K"
          delta="+28%"
          trend="up"
          sub="organik + sosyal"
          emphasized
        />
        <Kpi label="Lead" value="24" delta="+18%" trend="up" sub="14 qualified" />
        <Kpi label="Dönüşüm" value="2.4" suffix="%" sub="hedef 3.5%" />
      </div>

      {/* 2-col: Yayın Hattı (left) + Editor (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Yayın Hattı sidebar */}
        <div className="card p-5 h-fit">
          <div className="flex items-center justify-between mb-1">
            <h3
              className="text-juris-navy leading-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 18, fontWeight: 500,
              }}
            >
              Yayın Hattı
            </h3>
            <NewContentButton
              kind="ghost"
              label="Ekle"
              className="!px-2 !py-1 !text-[11px]"
            />
          </div>
          <div className="text-[11px] text-juris-ink-3 mb-4">
            {items.length} içerik · {counts.published} yayında · {counts.review} inceleme · {counts.draft} taslak
          </div>
          <div className="flex flex-col gap-3">
            {items.map((c) => {
              const isActive = c.id === activeItem?.id;
              const stat = STATUS_META[c.status];
              return (
                <Link
                  key={c.id}
                  href={`/marketing?tab=icerik&id=${c.id}`}
                  className="block relative rounded-md p-3 transition-colors"
                  style={{
                    background: isActive ? "white" : "transparent",
                    border: `1px solid ${isActive ? "#E5E9F0" : "transparent"}`,
                    borderLeft: isActive ? "3px solid #BC2F2C" : "1px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                      style={
                        stat.tone === "green"
                          ? { background: "rgba(31,122,78,0.12)", color: "#147D5C" }
                          : stat.tone === "amber"
                          ? { background: "rgba(180,112,28,0.12)", color: "#7a4f15" }
                          : { background: "rgba(136,149,171,0.14)", color: "#5A6B82" }
                      }
                    >
                      {stat.label}
                    </span>
                    <span className="text-[10px] text-juris-red font-semibold uppercase tracking-wider">
                      {c.contentType ?? "—"}
                    </span>
                    {c.viewCount > 0 && (
                      <span className="ml-auto text-[10px] text-juris-ink-3 mono">
                        {c.viewCount >= 1000 ? `${(c.viewCount / 1000).toFixed(1)}K` : c.viewCount}
                      </span>
                    )}
                  </div>
                  <div className={`text-[13px] font-semibold leading-snug ${isActive ? "text-juris-navy" : "text-juris-ink-2"}`}>
                    {c.title}
                  </div>
                  <div className="text-[10px] text-juris-ink-4 mt-1">
                    {c.author}
                    {c.aiAssisted && " + AI"}
                    {" · "}
                    {c.publishedAt
                      ? formatRelativeTR(c.publishedAt)
                      : c.draftVersion
                      ? `Taslak v${c.draftVersion}`
                      : "—"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Article Editor */}
        <div className="flex flex-col gap-4">
          {activeItem ? (
            <ArticleEditor item={activeItem} />
          ) : (
            <div className="card p-12 text-center">
              <FileText size={28} className="text-juris-ink-3 mx-auto mb-3" />
              <h3 className="display text-xl text-juris-navy mb-2">İçerik seçin</h3>
              <p className="text-sm text-juris-ink-3">
                Sol paneldeki içeriklerden birine tıklayarak düzenleyin.
              </p>
            </div>
          )}

          {/* Live metrics */}
          {activeItem && <LiveMetrics item={activeItem} />}

          {/* 2-col: AI Topic Suggestions + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
            <AiKonuOnerisi />
            <div className="flex flex-col gap-4">
              <AiArastirmaAkisi />
              <SchemaSeoOtomasyonu />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ArticleEditor({ item }: { item: ContentItem }) {
  const stat = STATUS_META[item.status];
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-juris-ink-3">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={
              stat.tone === "green"
                ? { background: "rgba(31,122,78,0.12)", color: "#147D5C" }
                : stat.tone === "amber"
                ? { background: "rgba(180,112,28,0.12)", color: "#7a4f15" }
                : { background: "rgba(136,149,171,0.14)", color: "#5A6B82" }
            }
          >
            {stat.label}
          </span>
          <span className="font-medium text-juris-red">{item.contentType}</span>
          <span>·</span>
          <span>
            {item.author}
            {item.aiAssisted && " + AI"}
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/marketing/${item.id}?stage=uret`}
            className="btn btn-sm"
            style={{ background: "#0A2240", color: "white", border: "1px solid #0A2240" }}
          >
            <GitBranch size={11} /> Tam akış
          </Link>
          <button className="btn btn-sm btn-ghost">
            <Wand2 size={11} /> AI yeniden yaz
          </button>
          <button className="btn btn-sm btn-ghost">
            <RotateCw size={11} /> Türevleri üret
          </button>
          <button className="btn btn-sm btn-accent">
            <Send size={11} /> Yayınla
          </button>
        </div>
      </div>

      {item.contentType && (
        <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-2">
          {item.contentType}
        </div>
      )}
      <h1
        className="text-juris-navy leading-tight mb-4"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 32, fontWeight: 500, letterSpacing: "-0.015em",
        }}
      >
        {item.title}
      </h1>

      <div className="flex items-center gap-3 text-xs text-juris-ink-3 mb-5">
        <Avatar name={item.author ?? "?"} size={22} />
        <span className="text-juris-ink-2 font-medium">
          {item.author}
          {item.aiAssisted && " + AI"}
        </span>
        {item.readMinutes && (
          <>
            <span>·</span>
            <span>{item.readMinutes}dk okuma</span>
          </>
        )}
        {item.seoRank && (
          <>
            <span>·</span>
            <span className="text-juris-success font-semibold mono">SEO #{item.seoRank}</span>
          </>
        )}
      </div>

      {item.body && (
        <p className="text-[14px] text-juris-ink-2 leading-relaxed mb-6 p-4 rounded-md bg-juris-paper-2 border-l-2 border-juris-line">
          {item.body}
        </p>
      )}

      {/* Türev Üretici */}
      <div
        className="rounded-md p-4 mb-6"
        style={{
          background: "white",
          border: "1px solid rgba(188,47,44,0.22)",
          borderLeft: "3px solid #BC2F2C",
        }}
      >
        <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-3 flex items-center gap-2">
          <Sparkles size={12} /> Juris AI · Türev Üretici
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            "LinkedIn post (280 kelime)",
            "X thread (8 tweet)",
            "E-bülten bölümü",
            "YouTube script (5dk)",
            "Instagram carousel (7 slayt)",
          ].map((t) => (
            <button
              key={t}
              type="button"
              className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold transition-all"
              style={{
                background: "white",
                border: "1px solid #E5E9F0",
                color: "#2A3B54",
              }}
            >
              <Plus size={10} /> {t}
            </button>
          ))}
        </div>
      </div>

      {/* SEO & Meta */}
      {(item.metaTitle || item.metaDescription || item.tags.length > 0 || item.keywords.length > 0) && (
        <div className="rounded-md p-4" style={{ background: "#F4F7FB", border: "1px solid #E5E9F0" }}>
          <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-3">
            SEO & Meta (AI ÜRETTİ)
          </div>
          <dl className="grid grid-cols-[110px_1fr] gap-y-2.5 text-xs">
            {item.metaTitle && (
              <>
                <dt className="text-juris-ink-3">Meta title</dt>
                <dd className="text-juris-ink-2">{item.metaTitle}</dd>
              </>
            )}
            {item.metaDescription && (
              <>
                <dt className="text-juris-ink-3">Meta desc</dt>
                <dd className="text-juris-ink-2 leading-relaxed">{item.metaDescription}</dd>
              </>
            )}
            {item.tags.length > 0 && (
              <>
                <dt className="text-juris-ink-3">Schema</dt>
                <dd className="flex gap-2 flex-wrap">
                  {item.tags.map((t, i) => (
                    <span key={t} className="text-juris-ink-2 font-mono text-[11px]">
                      {t}{i < item.tags.length - 1 && " ·"}
                    </span>
                  ))}
                </dd>
              </>
            )}
            {item.keywords.length > 0 && (
              <>
                <dt className="text-juris-ink-3">Keywords</dt>
                <dd className="flex gap-1 flex-wrap">
                  {item.keywords.map((k) => (
                    <span
                      key={k}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "white", border: "1px solid #E5E9F0", color: "#2A3B54" }}
                    >
                      {k}
                    </span>
                  ))}
                </dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function LiveMetrics({ item }: { item: ContentItem }) {
  const stats: { key: string; label: string; value: string | number; sub?: string }[] = [
    { key: "v",  label: "Görüntüleme", value: item.viewCount.toLocaleString("tr-TR"), sub: "+28%" },
    { key: "r",  label: "Okuma (ORT)", value: item.readMinutes ? `${item.readMinutes}dk` : "—" },
    { key: "e",  label: "Engagement",  value: item.engagementPct ? `${item.engagementPct}%` : "—", sub: "yüksek" },
    { key: "l",  label: "Lead",        value: item.leadCount },
    { key: "s",  label: "SEO POS",     value: item.seoRank ? `#${item.seoRank}` : "—", sub: "-2" },
    { key: "b",  label: "Backlink",    value: item.backlinks || "—", sub: "+4" },
  ];
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3
          className="text-juris-navy leading-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 500,
          }}
        >
          Canlı Metrikler
        </h3>
        <div className="text-xs text-juris-ink-3 mt-1">Son 30 gün</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.key} className="rounded-md px-3.5 py-3 bg-juris-paper-2 border border-juris-line-2">
            <div className="text-[10px] uppercase tracking-wider text-juris-ink-3 font-semibold mb-1.5">
              {s.label}
            </div>
            <div
              className="text-juris-navy leading-none"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 24, fontWeight: 500,
              }}
            >
              {s.value}
            </div>
            {s.sub && (
              <div className="text-[10px] text-juris-red font-semibold mt-1">
                ▴ {s.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AiKonuOnerisi() {
  const rows = [
    { kw: "KVKK güncelleme 2026",        type: "SEO Makale",  vol: "4.8K/ay", diff: 42, trend: "+180%" },
    { kw: "e-imza kanunu değişiklik",    type: "Vaka Notu",   vol: "1.2K/ay", diff: 28, trend: "+45%"  },
    { kw: "rekabet kurulu e-ticaret",    type: "SEO Makale",  vol: "3.1K/ay", diff: 54, trend: "+22%"  },
    { kw: "yapay zeka hukuk düzenlemesi", type: "Whitepaper", vol: "6.4K/ay", diff: 68, trend: "+310%" },
  ];
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <h3
            className="text-juris-navy leading-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22, fontWeight: 500,
            }}
          >
            AI Konu Önerisi
          </h3>
          <div className="text-xs text-juris-ink-3 mt-1">Trend + keyword + zorluk analizi</div>
        </div>
        <button className="btn btn-sm btn-ghost">
          <RotateCw size={11} /> Yenile
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-[10px] uppercase tracking-wider text-juris-ink-3 font-semibold">
          <tr className="border-b border-juris-line-2">
            <th className="text-left py-2 pr-3 font-semibold">Keyword</th>
            <th className="text-left py-2 pr-3 font-semibold w-[110px]">Hacim</th>
            <th className="text-left py-2 pr-3 font-semibold w-[110px]">Zorluk</th>
            <th className="text-left py-2 pr-3 font-semibold w-[80px]">Trend</th>
            <th className="text-right py-2 font-semibold w-[110px]">Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.kw} className="border-b border-juris-line-2">
              <td className="py-3 pr-3">
                <div className="font-semibold text-juris-navy text-[13px]">{r.kw}</div>
                <div className="text-[11px] text-juris-ink-3">Önerilen: {r.type}</div>
              </td>
              <td className="py-3 pr-3 mono text-xs text-juris-navy">{r.vol}</td>
              <td className="py-3 pr-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-juris-line-2 overflow-hidden max-w-[60px]">
                    <div
                      style={{
                        width: `${r.diff}%`, height: "100%",
                        background: r.diff > 60 ? "#BC2F2C" : r.diff > 40 ? "#B4701C" : "#147D5C",
                      }}
                    />
                  </div>
                  <span className="mono text-[11px] text-juris-ink-2">{r.diff}</span>
                </div>
              </td>
              <td className="py-3 pr-3 mono text-xs text-juris-success font-semibold">
                {r.trend}
              </td>
              <td className="py-3 text-right">
                <button className="btn btn-sm btn-primary">
                  <Sparkles size={10} /> Draft üret
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AiArastirmaAkisi() {
  return (
    <div
      className="rounded-md p-5 text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(400px 300px at 100% 0%, rgba(188,47,44,0.35), transparent 60%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] font-semibold text-white/50 mb-2">
          <Sparkles size={11} /> AI Araştırma Akışı
        </div>
        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 19, fontWeight: 500, lineHeight: 1.2,
          }}
        >
          SciSpace → Claude → Draft
        </h3>
        <p className="text-[12px] text-white/70 mt-2 leading-relaxed">
          Avukat SciSpace&apos;te akademik araştırma notu ekler → Claude API ile
          ilk draft → yine avukat onayıyla yayın.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <button className="btn btn-accent btn-sm">
            <Sparkles size={11} /> Araştırma başlat
          </button>
          <button className="text-[11px] text-white/60 hover:text-white">Nasıl çalışır?</button>
        </div>
      </div>
    </div>
  );
}

function SchemaSeoOtomasyonu() {
  const items = [
    "schema.org `LegalArticle` + `Attorney` + `FAQPage`",
    "Canonical URL + hreflang (tr/en)",
    "OpenGraph + Twitter card",
    "sitemap.xml'e otomatik ekleme",
    "Google Search Console'a ping",
  ];
  return (
    <div className="card p-5">
      <h3
        className="text-juris-navy leading-tight"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 17, fontWeight: 500,
        }}
      >
        Schema &amp; SEO Otomasyonu
      </h3>
      <div className="text-[11px] text-juris-ink-3 mt-1 mb-3">
        Her yayınlanan içerik için otomatik üretilen:
      </div>
      <ul className="flex flex-col gap-1.5 text-[12px] text-juris-ink-2">
        {items.map((s) => (
          <li key={s} className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-juris-red mt-2 flex-shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: s.replace(/`([^`]+)`/g, '<code class="mono text-[11px] text-juris-navy bg-juris-paper-2 px-1 rounded">$1</code>') }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================== TRAFİK STÜDYOSU ==============================

function TrafikTab() {
  const totalReach = 52600;
  const totalLeads = 142;
  const funnelStages = [
    { key: "far",   label: "Farkındalık",   sub: "Tüm kanal erişimi",        value: 52600, pct: 100.0, lossPct: 0, lost: 0,      color: "#0A2240" },
    { key: "ilgi",  label: "İlgi",          sub: "Blog okuma, e-bülten abone", value: 8400,  pct: 16.0,  lossPct: 84, lost: 44200, color: "#0A2240" },
    { key: "deg",   label: "Değerlendirme", sub: "Whitepaper indiren, webinar", value: 1260,  pct: 2.4,   lossPct: 85, lost: 7180,  color: "#0A2240" },
    { key: "lead",  label: "Lead",          sub: "Form dolduran, toplantı talebi", value: 142, pct: 0.3,  lossPct: 89, lost: 1098, color: "#BC2F2C" },
  ];
  const sources = [
    { name: "Google (organik)",  leads: 60, pct: 42, color: "#0A2240" },
    { name: "LinkedIn",          leads: 40, pct: 28, color: "#0077B5" },
    { name: "E-bülten",          leads: 20, pct: 14, color: "#B4701C" },
    { name: "Direkt",            leads: 11, pct: 8,  color: "#5A6B82" },
    { name: "Referans (İş Gel.)", leads: 9, pct: 6,  color: "#BC2F2C" },
    { name: "Diğer",             leads: 2,  pct: 2,  color: "#8895AB" },
  ];
  return (
    <>
      {/* 5 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-7">
        <Kpi
          label="Toplam Erişim"
          value="52.6K"
          delta="+28%"
          trend="up"
          sub="Son 30 gün"
          emphasized
        />
        <Kpi
          label="Trafik → Lead"
          value="0.27"
          suffix="%"
          sub={`${totalLeads} lead / ${(totalReach/1000).toFixed(1)}K`}
        />
        <Kpi
          label="En İyi Kanal"
          value="LinkedIn"
          sub="%34 erişim artışı"
        />
        <Kpi
          label="SEO Trafik"
          value="42"
          suffix="%"
          sub="Toplam ziyaretin"
        />
        <Kpi
          label="Backlink (Ay)"
          value="+38"
          sub="234 toplam"
        />
      </div>

      {/* 2-col: Funnel + Kaynak Atfı */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mb-6">
        {/* Funnel */}
        <div className="card p-6">
          <div className="mb-5">
            <h3
              className="text-juris-navy leading-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22, fontWeight: 500,
              }}
            >
              Pazarlama Funnel
            </h3>
            <div className="text-xs text-juris-ink-3 mt-1">Son 30 gün · toplam hacim</div>
          </div>

          <div className="flex flex-col gap-4">
            {funnelStages.map((s, i) => (
              <div key={s.key}>
                <div className="flex items-center gap-3">
                  <div className="w-[130px]">
                    <div className="text-[13px] font-semibold text-juris-navy">{s.label}</div>
                    <div className="text-[10px] text-juris-ink-3 leading-snug">{s.sub}</div>
                  </div>
                  <div className="relative flex-1 h-10 bg-juris-paper-2 rounded">
                    <div
                      className="absolute top-0 left-0 h-full rounded flex items-center px-4"
                      style={{
                        width: `${Math.max(s.pct, 3)}%`,
                        background: s.color,
                        minWidth: 48,
                      }}
                    >
                      <span className="text-xs font-semibold text-white mono">
                        {s.value.toLocaleString("tr-TR")}
                      </span>
                    </div>
                  </div>
                  <span
                    className="w-[70px] text-right"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 18, fontStyle: "italic", color: "#0A2240", fontWeight: 500,
                    }}
                  >
                    {s.pct.toFixed(1)}%
                  </span>
                </div>
                {i < funnelStages.length - 1 && (
                  <div className="pl-[142px] mt-1.5 text-[11px] text-juris-red font-semibold">
                    <span className="inline-flex items-center gap-1">
                      ↓ %{funnelStages[i+1].lossPct} düşüş · {funnelStages[i+1].lost.toLocaleString("tr-TR")} kişi kaybedildi
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            className="mt-6 rounded px-4 py-3 text-[12px] text-juris-ink-2 leading-relaxed flex items-start gap-2"
            style={{ background: "#F4F7FB", border: "1px solid #E5E9F0" }}
          >
            <Sparkles size={12} className="text-juris-red flex-shrink-0 mt-0.5" />
            <span>
              <span className="font-semibold text-juris-red">Juris AI:</span>{" "}
              &ldquo;Farkındalık → İlgi&rdquo; geçişi %84 kayıp — sektör
              ortalamasına yakın. Ancak &ldquo;Değerlendirme → Lead&rdquo; %88
              kayıp, bu yüksek. CTA&apos;ları gözden geçirmenizi öneririm.
            </span>
          </div>
        </div>

        {/* Kaynak Atfı */}
        <div className="card p-6">
          <div className="mb-5">
            <h3
              className="text-juris-navy leading-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22, fontWeight: 500,
              }}
            >
              Kaynak Atfı
            </h3>
            <div className="text-xs text-juris-ink-3 mt-1">Lead&apos;ler nereden geldi?</div>
          </div>
          <ul className="flex flex-col gap-4">
            {sources.map((s) => (
              <li key={s.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-juris-navy">{s.name}</span>
                  <div className="flex items-center gap-3 mono text-xs">
                    <span className="text-juris-ink-2 font-semibold">{s.leads}</span>
                    <span className="text-juris-ink-3">·</span>
                    <span className="text-juris-ink-3 w-[40px] text-right">%{s.pct}</span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-juris-line-2 overflow-hidden">
                  <div
                    style={{
                      width: `${(s.pct / 42) * 100}%`,
                      height: "100%",
                      background: s.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Kanal Detayı */}
      <div>
        <div className="flex items-start justify-between mb-4 gap-2">
          <div>
            <h3
              className="text-juris-navy leading-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22, fontWeight: 500,
              }}
            >
              Kanal Detayı
            </h3>
            <div className="text-xs text-juris-ink-3 mt-1">
              Erişim · Lead · Trend — son 30 gün
            </div>
          </div>
          <button className="btn btn-sm btn-ghost">
            <Plus size={11} /> Kanal ekle
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CHANNEL_STATS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.key} className="card p-4 relative">
                <div
                  className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(31,122,78,0.12)", color: "#147D5C" }}
                >
                  +{c.delta}%
                </div>
                <div className="w-7 h-7 rounded flex items-center justify-center mb-3 bg-juris-paper-2 text-juris-ink-3">
                  <Icon size={14} />
                </div>
                <div
                  className="text-juris-navy leading-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 20, fontWeight: 500,
                  }}
                >
                  {c.name}
                </div>
                <div className="text-[11px] text-juris-ink-3 mt-0.5">Erişim / Lead</div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-juris-line-2">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-juris-ink-3 font-semibold">
                      Erişim
                    </div>
                    <div className="mono text-[16px] font-semibold text-juris-navy">
                      {c.reach.toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-juris-ink-3 font-semibold">
                      Lead
                    </div>
                    <div className="mono text-[16px] font-semibold text-juris-red">
                      {c.leads}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ============================== PLAN TAB ==============================

function PlanTab({ items }: { items: ContentItem[] }) {
  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);
  const monthLabel = format(now, "LLLL yyyy", { locale: tr });

  const thisMonth = items.filter((i) => {
    const ref = i.publishAt ?? i.publishedAt ?? i.createdAt;
    return ref && ref >= mStart && ref <= mEnd;
  });

  const targets: Array<{ channel: ContentChannel; label: string; icon: typeof Globe; color: string; target: number }> = [
    { channel: "BLOG",       label: "Blog yazısı",       icon: Globe,    color: "#0A2240", target: 4 },
    { channel: "LINKEDIN",   label: "LinkedIn post",     icon: Linkedin, color: "#0077B5", target: 8 },
    { channel: "NEWSLETTER", label: "Newsletter",        icon: Mail,     color: "#1F7A4E", target: 2 },
    { channel: "INSTAGRAM",  label: "Instagram",         icon: Hash,     color: "#E1306C", target: 4 },
    { channel: "VIDEO",      label: "Video / Reels",     icon: Youtube,  color: "#BC2F2C", target: 2 },
  ];

  const progress = targets.map((t) => {
    const done = thisMonth.filter((i) => i.channel === t.channel && i.status === "PUBLISHED").length;
    const inFlight = thisMonth.filter((i) => i.channel === t.channel && i.status !== "PUBLISHED" && i.status !== "ARCHIVED").length;
    return { ...t, done, inFlight, pct: Math.min(100, Math.round((done / Math.max(1, t.target)) * 100)) };
  });

  const totalTarget = targets.reduce((s, t) => s + t.target, 0);
  const totalDone   = progress.reduce((s, p) => s + p.done, 0);
  const totalFlight = progress.reduce((s, p) => s + p.inFlight, 0);
  const totalIdea   = Math.max(0, totalTarget - totalDone - totalFlight);
  const overallPct  = Math.min(100, Math.round((totalDone / Math.max(1, totalTarget)) * 100));

  const daysInMonth = Math.round((mEnd.getTime() - mStart.getTime()) / 86400000) + 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(mStart, i));
  const byDay = new Map<string, ContentItem[]>();
  for (const it of thisMonth) {
    const ref = it.publishAt ?? it.publishedAt;
    if (!ref) continue;
    const k = format(ref, "yyyy-MM-dd");
    const arr = byDay.get(k) ?? [];
    arr.push(it);
    byDay.set(k, arr);
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
        <Kpi label="Ay Hedefi"   value={totalTarget} sub={monthLabel} emphasized />
        <Kpi label="Yayında"      value={totalDone}   sub="tamamlandı"       href="/marketing?tab=icerik" />
        <Kpi label="Akışta"       value={totalFlight} sub="taslak+inceleme"  href="/marketing?tab=icerik" />
        <Kpi label="Boşta"         value={totalIdea}   sub="planlanacak" />
        <Kpi label="İlerleme"     value={`%${overallPct}`} progress={overallPct} sub={`${totalDone}/${totalTarget}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3
                className="leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#0A2240" }}
              >
                {monthLabel} hedefleri
              </h3>
              <p className="text-[12px] text-juris-ink-3 mt-1">
                Kanal başına hedef · yayımlanan · akıştaki içerikler
              </p>
            </div>
            <NewContentButton kind="accent" label="Yeni akış başlat" />
          </div>

          <ul className="flex flex-col gap-4">
            {progress.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.channel}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `${p.color}15`, color: p.color }}
                    >
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-juris-navy">{p.label}</div>
                      <div className="text-[10.5px] text-juris-ink-4">
                        {p.done} yayında · {p.inFlight} akışta · hedef {p.target}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="mono text-[13px] font-semibold text-juris-navy">
                        {p.done}/{p.target}
                      </div>
                      <div className="text-[10px] text-juris-ink-4">%{p.pct}</div>
                    </div>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden ml-11"
                    style={{ background: "#EEF1F5" }}
                  >
                    <div
                      style={{
                        width: `${p.pct}%`,
                        height: "100%",
                        background: p.color,
                        transition: "width 400ms ease",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div
            className="mt-6 rounded-md p-3 text-[11.5px] text-juris-ink-2 leading-relaxed flex items-start gap-2"
            style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
          >
            <Sparkles size={12} className="text-juris-red shrink-0 mt-0.5" />
            <span>
              Hedeflere ulaşmak için öneri:{" "}
              <strong className="text-juris-navy">haftada 1 blog + 2 LinkedIn</strong>. Blog başlığı Salı;
              LinkedIn postu Salı-Çarşamba sabah; Newsletter ayın 1 ve 15.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h4 className="label mb-3">Bu Ay Akıştakiler ({totalFlight})</h4>
            {thisMonth.filter((i) => i.status !== "PUBLISHED" && i.status !== "ARCHIVED").length === 0 ? (
              <div className="text-[12px] text-juris-ink-4 italic py-3">
                Aktif akış yok — yeni akış başlat.
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-juris-line-2">
                {thisMonth
                  .filter((i) => i.status !== "PUBLISHED" && i.status !== "ARCHIVED")
                  .slice(0, 6)
                  .map((i) => {
                    const stage = i.status === "REVIEW" ? "onay" : i.status === "SCHEDULED" ? "yayim" : "uret";
                    return (
                      <li key={i.id}>
                        <Link
                          href={`/marketing/${i.id}?stage=${stage}`}
                          className="py-2.5 flex items-start gap-2 hover:bg-juris-paper-2 -mx-2 px-2 rounded transition-colors"
                        >
                          <StageIcon status={i.status} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12.5px] font-semibold text-juris-navy truncate">{i.title}</div>
                            <div className="text-[10.5px] text-juris-ink-4 mt-0.5">
                              {STATUS_META[i.status].label}
                              {i.publishAt && ` · ${formatDateTR(i.publishAt)}`}
                            </div>
                          </div>
                          <ArrowRight size={11} className="text-juris-ink-4 mt-1 shrink-0" />
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h4 className="label mb-3">Ay Takvimi</h4>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-juris-ink-4 uppercase font-semibold">
              {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"].map((d) => (
                <div key={d} className="text-center py-1">{d}</div>
              ))}
              {(() => {
                const firstDay = ((mStart.getDay() + 6) % 7);
                return Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} />);
              })()}
              {days.map((d) => {
                const k = format(d, "yyyy-MM-dd");
                const its = byDay.get(k) ?? [];
                const isToday = isSameDay(d, now);
                const published = its.some((i) => i.status === "PUBLISHED");
                const planned   = its.some((i) => i.status === "SCHEDULED");
                const inFlight  = its.some((i) => i.status === "DRAFT" || i.status === "REVIEW");
                return (
                  <div
                    key={k}
                    className="aspect-square rounded text-[10px] flex items-center justify-center relative"
                    style={{
                      background:
                        published ? "#1F7A4E" :
                        planned   ? "rgba(10,34,64,0.12)" :
                        inFlight  ? "rgba(180,112,28,0.1)" :
                                    isToday ? "rgba(188,47,44,0.08)" : "#FAFBFD",
                      color: published ? "white" : isToday ? "#BC2F2C" : "#5A6B82",
                      border: isToday ? "1px solid #BC2F2C" : "1px solid transparent",
                      fontWeight: isToday ? 700 : 500,
                    }}
                    title={its.length > 0 ? its.map((i) => i.title).join("\n") : ""}
                  >
                    {d.getDate()}
                    {its.length > 0 && (
                      <span
                        className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full"
                        style={{ background: published ? "white" : "#BC2F2C" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[9.5px] text-juris-ink-4 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ background: "#1F7A4E" }} />
                Yayında
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ background: "rgba(10,34,64,0.12)" }} />
                Planlı
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ background: "rgba(180,112,28,0.1)" }} />
                Akışta
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ border: "1px solid #BC2F2C", background: "rgba(188,47,44,0.08)" }} />
                Bugün
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StageIcon({ status }: { status: ContentStatus }) {
  if (status === "REVIEW")    return <Clock size={11} className="text-juris-warn shrink-0 mt-1" />;
  if (status === "SCHEDULED") return <Calendar size={11} className="text-juris-navy shrink-0 mt-1" />;
  if (status === "PUBLISHED") return <CheckCircle2 size={11} className="text-juris-success shrink-0 mt-1" />;
  return <Circle size={11} className="text-juris-ink-4 shrink-0 mt-1" />;
}
