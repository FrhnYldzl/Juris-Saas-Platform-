"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Linkedin, Instagram, Mail, FileText as BlogIcon, Copy, CheckCircle2,
  ArrowRight, Download, Eye, Palette, ExternalLink,
} from "lucide-react";
import type { ContentChannel } from "@prisma/client";

type TabKey = "blog" | "linkedin" | "newsletter" | "instagram";

const TABS: Array<{ key: TabKey; label: string; icon: typeof Linkedin; color: string }> = [
  { key: "blog",       label: "Blog",       icon: BlogIcon,  color: "#0A2240" },
  { key: "linkedin",   label: "LinkedIn",   icon: Linkedin,  color: "#0077B5" },
  { key: "newsletter", label: "Newsletter", icon: Mail,      color: "#1F7A4E" },
  { key: "instagram",  label: "Instagram",  icon: Instagram, color: "#E1306C" },
];

export function StageBicim({ item }: { item: {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  channel: ContentChannel;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  author: string | null;
  readMinutes: number | null;
} }) {
  const [tab, setTab] = useState<TabKey>("blog");
  const [copied, setCopied] = useState(false);

  const channelContent = buildChannelContent(tab, item);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(channelContent.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  // Visual preview URLs per channel — ? v= cache-bust so we re-render after saves
  const v = Date.now();
  const visualUrl =
    tab === "blog"       ? `/api/og/blog/${item.id}?v=${v}` :
    tab === "linkedin"   ? `/api/og/linkedin/${item.id}?v=${v}` :
    tab === "instagram"  ? `/api/og/instagram/${item.id}?v=${v}` :
                           null;

  const htmlUrl = tab === "newsletter" ? `/api/html/newsletter/${item.id}?v=${v}` : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
      {/* Left: preview */}
      <div className="card p-6 flex flex-col gap-4">
        <div>
          <h3
            className="leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#0A2240" }}
          >
            Kanala göre biçim
          </h3>
          <p className="text-[12px] text-juris-ink-3 mt-1">
            Her kanal için <strong className="text-juris-navy">hazır yayın formatı</strong> — metin + görsel + HTML. Kopyala, indir, paylaş.
          </p>
        </div>

        {/* Channel tabs */}
        <div className="flex gap-1 border-b border-juris-line-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="relative px-4 py-2.5 text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                style={{ color: isActive ? "#0A2240" : "#5A6B82" }}
              >
                <Icon size={12} style={{ color: isActive ? t.color : "#8895AB" }} />
                {t.label}
                {isActive && (
                  <span
                    className="absolute bottom-[-1px] inset-x-3 h-[2px] rounded-t"
                    style={{ background: t.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Text preview */}
        <div>
          <div className="flex items-center justify-between mb-2 text-[10.5px] text-juris-ink-4 uppercase tracking-wider font-semibold">
            <span>{channelContent.hint}</span>
            <span className="mono">
              {channelContent.text.length} / {channelContent.limit}
            </span>
          </div>
          <div
            className="rounded-md p-5 bg-white text-[13px] text-juris-ink-1 leading-relaxed whitespace-pre-wrap"
            style={{
              border: `1px solid ${channelContent.text.length > channelContent.limit ? "#BC2F2C" : "#E5E9F0"}`,
              fontFamily: tab === "blog" ? "'Playfair Display', Georgia, serif" : "inherit",
              background: tab === "instagram" ? "#FAFAFA" : "white",
              minHeight: 220,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {channelContent.text}
          </div>
          {channelContent.text.length > channelContent.limit && (
            <div className="mt-2 text-[11px] text-juris-red font-semibold">
              ! Limit aşıldı · {channelContent.text.length - channelContent.limit} karakter kısalt
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 flex-wrap" style={{ borderTop: "1px solid #EEF1F5" }}>
          <div className="flex items-center gap-3 text-[11px] text-juris-ink-3">
            {channelContent.tips.map((tip, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-juris-red" />
                {tip}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[11.5px] font-semibold text-juris-ink-2 transition-colors hover:bg-juris-paper-2"
            style={{ border: "1px solid #E5E9F0" }}
          >
            {copied ? <CheckCircle2 size={11} className="text-juris-success" /> : <Copy size={11} />}
            {copied ? "Kopyalandı" : "Metni kopyala"}
          </button>
        </div>
      </div>

      {/* Right: visual preview */}
      <div className="flex flex-col gap-4">
        {/* Visual preview card */}
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold inline-flex items-center gap-1.5">
              <Palette size={11} /> Görsel (hazır yayın formatı)
            </div>
            <span className="text-[10px] text-juris-ink-4 mono">
              {channelContent.visualSpec}
            </span>
          </div>

          {visualUrl ? (
            <div
              className="relative rounded-md overflow-hidden"
              style={{
                border: "1px solid #E5E9F0",
                background: "#F1F4F8",
                aspectRatio: channelContent.aspectRatio,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visualUrl}
                alt={`${channelContent.format} önizleme`}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>
          ) : htmlUrl ? (
            <div
              className="rounded-md overflow-hidden"
              style={{ border: "1px solid #E5E9F0", background: "#F4F6FA", height: 420 }}
            >
              <iframe
                src={htmlUrl}
                title="Newsletter önizleme"
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            </div>
          ) : null}

          {/* Download + Preview buttons */}
          <div className="flex items-center gap-2">
            {visualUrl && (
              <>
                <a
                  href={visualUrl}
                  download={`juris-${tab}-${item.id.slice(0, 8)}.png`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11.5px] font-semibold text-white transition-all hover:shadow-sm"
                  style={{ background: "#0A2240" }}
                >
                  <Download size={11} /> PNG İndir
                </a>
                <a
                  href={visualUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-[11.5px] font-semibold text-juris-ink-2 hover:bg-juris-paper-2"
                  style={{ border: "1px solid #E5E9F0" }}
                  title="Tam boyutta aç"
                >
                  <ExternalLink size={11} />
                </a>
              </>
            )}
            {htmlUrl && (
              <>
                <a
                  href={`${htmlUrl}&download=1`}
                  download={`juris-newsletter-${item.id.slice(0, 8)}.html`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11.5px] font-semibold text-white transition-all hover:shadow-sm"
                  style={{ background: "#0A2240" }}
                >
                  <Download size={11} /> HTML İndir
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(htmlUrl);
                    const html = await res.text();
                    await navigator.clipboard.writeText(html);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-[11.5px] font-semibold text-juris-ink-2 hover:bg-juris-paper-2"
                  style={{ border: "1px solid #E5E9F0" }}
                  title="HTML kopyala"
                >
                  {copied ? <CheckCircle2 size={11} className="text-juris-success" /> : <Copy size={11} />}
                </button>
                <a
                  href={htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-[11.5px] font-semibold text-juris-ink-2 hover:bg-juris-paper-2"
                  style={{ border: "1px solid #E5E9F0" }}
                  title="Tam ekran önizle"
                >
                  <Eye size={11} />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Channel meta */}
        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-3">
            Kanal Özellikleri
          </div>
          <dl className="grid grid-cols-[90px_1fr] gap-y-2 text-[12px]">
            <dt className="text-juris-ink-3">Format</dt>
            <dd className="text-juris-ink-2">{channelContent.format}</dd>
            <dt className="text-juris-ink-3">Limit</dt>
            <dd className="text-juris-ink-2 mono">
              {channelContent.limit.toLocaleString("tr-TR")} karakter
            </dd>
            <dt className="text-juris-ink-3">Ton</dt>
            <dd className="text-juris-ink-2">{channelContent.tone}</dd>
            <dt className="text-juris-ink-3">En iyi saat</dt>
            <dd className="text-juris-ink-2">{channelContent.bestTime}</dd>
          </dl>
        </div>

        {/* Next step */}
        <div
          className="rounded-xl p-4"
          style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
        >
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2">
            Sıradaki adım — Onay
          </div>
          <p className="text-[12px] text-juris-ink-2 mb-3 leading-relaxed">
            Hem metin hem görsel hazırsa, ortağa inceleme talebi gönder.
          </p>
          <Link
            href={`/marketing/${item.id}?stage=onay`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold text-white"
            style={{ background: "#0A2240" }}
          >
            Onaya git <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────

function buildChannelContent(
  tab: TabKey,
  item: {
    title: string; summary: string | null; body: string | null;
    metaTitle: string | null; metaDescription: string | null;
    author: string | null; readMinutes: number | null;
    keywords: string[];
  },
): {
  text: string; limit: number; hint: string; format: string; tone: string;
  bestTime: string; tips: string[];
  visualSpec: string; aspectRatio: string;
} {
  const body = item.body ?? "";
  const summary = item.summary ?? "";

  if (tab === "blog") {
    const text = `# ${item.metaTitle ?? item.title}\n\n${summary ? summary + "\n\n" : ""}${body}${
      item.author ? `\n\n— ${item.author}` : ""
    }${item.readMinutes ? ` · ${item.readMinutes} dk okuma` : ""}`;
    return {
      text, limit: 25_000,
      hint: "Blog post · SEO optimize, Markdown destekli",
      format: "Markdown + Hero PNG",
      tone: "Profesyonel, pedagojik",
      bestTime: "Salı 10:00 — Perşembe 14:00",
      tips: ["H2/H3 kullan", "8+ dk okuma hedefle"],
      visualSpec: "1200 × 630 · Open Graph",
      aspectRatio: "1200 / 630",
    };
  }

  if (tab === "linkedin") {
    const hook = summary || item.title;
    const take = body.split("\n").filter((l) => l.trim() && !l.startsWith("#")).slice(0, 5).join("\n\n");
    const tags = item.keywords.slice(0, 5).map((k) => `#${k.replace(/\s+/g, "")}`).join(" ");
    const text = `${hook}\n\n${take}\n\nDevamı → Juris blog üzerinde.\n\n${tags}${
      item.author ? `\n\n— ${item.author}` : ""
    }`;
    return {
      text, limit: 3_000,
      hint: "LinkedIn Post · 3 000 karakter limitli, profesyonel ağ",
      format: "Düz metin + 1200×627 PNG",
      tone: "Profesyonel + ilk satır kanca (hook)",
      bestTime: "Salı-Çarşamba 08:30-10:00",
      tips: ["İlk 2 satır kritik", "3-5 hashtag"],
      visualSpec: "1200 × 627 · LinkedIn",
      aspectRatio: "1200 / 627",
    };
  }

  if (tab === "newsletter") {
    const tldr = summary || (body.split("\n").find((l) => l.trim() && !l.startsWith("#")) ?? "");
    const text = `Merhaba,\n\n${tldr}\n\n━━━━━━━━━━━━━━━\n${item.title.toUpperCase()}\n━━━━━━━━━━━━━━━\n\n${body.slice(0, 1500)}${body.length > 1500 ? "\n\n…devamı için blog yazısını okuyun." : ""}\n\nSaygılarımızla,\n${item.author ?? "Juris Avukatlık Ortaklığı"}\n\n[Abonelikten çık] · [Arşiv]`;
    return {
      text, limit: 10_000,
      hint: "E-posta bülten · HTML + plain text birlikte",
      format: "Responsive HTML email (inline CSS)",
      tone: "Dostça, bilgilendirici",
      bestTime: "Salı 07:00 (sabah okuma)",
      tips: ["TL;DR ile başla", "CTA net olsun"],
      visualSpec: "600px genişlik · HTML",
      aspectRatio: "",
    };
  }

  if (tab === "instagram") {
    const hook = (summary || item.title).slice(0, 180);
    const lines = body.split("\n").filter((l) => l.trim() && !l.startsWith("#")).slice(0, 3);
    const tags = item.keywords.slice(0, 10).map((k) => `#${k.replace(/\s+/g, "")}`).join(" ");
    const text = `${hook}\n\n${lines.map((l) => `• ${l.replace(/^[-*]\s*/, "")}`).join("\n")}\n\n💬 Görüşlerinizi yorumlarda paylaşın.\n\n${tags}`;
    return {
      text, limit: 2_200,
      hint: "Instagram caption · 2 200 karakter · 10-30 hashtag",
      format: "1080×1350 PNG + caption",
      tone: "Samimi, görselle eşleşen",
      bestTime: "Hafta içi 11:00-13:00",
      tips: ["İlk satır kanca", "10+ hashtag"],
      visualSpec: "1080 × 1350 · 4:5 portre",
      aspectRatio: "1080 / 1350",
    };
  }

  return { text: "", limit: 0, hint: "", format: "", tone: "", bestTime: "", tips: [], visualSpec: "", aspectRatio: "1" };
}
