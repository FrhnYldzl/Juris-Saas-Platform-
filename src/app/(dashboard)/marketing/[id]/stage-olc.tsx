"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  BarChart3, Save, CheckCircle2, AlertCircle, Eye, Users as UsersIcon,
  TrendingUp, Link2, ExternalLink,
} from "lucide-react";
import { saveMetrics, type StageState } from "./actions";

export function StageOlc({ item }: { item: {
  id: string;
  title: string;
  status: string;
  publishedAt: Date | null;
  url: string | null;
  viewCount: number;
  leadCount: number;
  engagementPct: number | null;
  seoRank: number | null;
  backlinks: number;
  keywords: string[];
} }) {
  const [state, formAction, pending] = useActionState<StageState, FormData>(
    (prev, fd) => saveMetrics(item.id, prev, fd),
    null,
  );
  const errs = state && !state.ok ? (state.errors ?? {}) : {};
  const isPublished = item.status === "PUBLISHED";

  const daysSincePublish = item.publishedAt
    ? Math.floor((Date.now() - item.publishedAt.getTime()) / 86400000)
    : null;

  return (
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
      {/* Left: metrics form + summary KPIs */}
      <div className="flex flex-col gap-5">
        {/* Top KPI strip (mirrors saved metrics) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricKpi label="Görüntülenme"   value={item.viewCount.toLocaleString("tr-TR")} icon={<Eye size={11} />} accent="#0A2240" emphasized />
          <MetricKpi label="Lead"           value={item.leadCount.toString()}                icon={<UsersIcon size={11} />} accent="#BC2F2C" />
          <MetricKpi label="Etkileşim"       value={item.engagementPct != null ? `%${item.engagementPct}` : "—"} icon={<TrendingUp size={11} />} accent="#B4701C" />
          <MetricKpi label="SEO Pozisyon"    value={item.seoRank != null ? `#${item.seoRank}` : "—"} icon={<BarChart3 size={11} />} accent="#1F7A4E" />
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div>
            <h3
              className="leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#0A2240" }}
            >
              Performans güncelle
            </h3>
            <p className="text-[12px] text-juris-ink-3 mt-1">
              Yayım sonrası metrikleri manuel gir — GA4 / Search Console entegrasyonu etkinse otomatik senkronlanır.
              {isPublished && daysSincePublish != null && (
                <span className="ml-1 text-juris-ink-2">· {daysSincePublish} gün geçti</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumField label="Görüntülenme"
                      name="viewCount"
                      defaultValue={item.viewCount}
                      error={errs.viewCount}
                      hint="Benzersiz okuma · 30 gün pencere" />
            <NumField label="Lead Sayısı"
                      name="leadCount"
                      defaultValue={item.leadCount}
                      error={errs.leadCount}
                      hint="İçerikten gelen form doldurma / iletişim" />
            <NumField label="Etkileşim Oranı (%)"
                      name="engagementPct"
                      defaultValue={item.engagementPct ?? ""}
                      error={errs.engagementPct}
                      hint="LinkedIn / Newsletter için CTR" max={100} />
            <NumField label="SEO Pozisyon"
                      name="seoRank"
                      defaultValue={item.seoRank ?? ""}
                      error={errs.seoRank}
                      hint="Hedef kelimede Google sıralaması"
                      max={200} />
            <NumField label="Backlink Sayısı"
                      name="backlinks"
                      defaultValue={item.backlinks}
                      error={errs.backlinks}
                      hint="Dış referans linkleri" />
            <div>
              <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
                Canlı URL
              </label>
              <input
                name="url"
                type="url"
                defaultValue={item.url ?? ""}
                placeholder="https://juris.com.tr/blog/..."
                className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none mono"
                style={{ border: `1px solid ${errs.url ? "#BC2F2C" : "#E5E9F0"}` }}
              />
            </div>
          </div>

          {state?.message && (
            <div
              className="rounded-md p-3 text-[12px] flex items-start gap-2"
              style={{
                background: state.ok ? "rgba(31,122,78,0.08)" : "rgba(188,47,44,0.08)",
                color: state.ok ? "#1F7A4E" : "#BC2F2C",
                border: `1px solid ${state.ok ? "#1F7A4E33" : "#BC2F2C33"}`,
              }}
            >
              {state.ok
                ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
                : <AlertCircle size={13} className="shrink-0 mt-0.5" />}
              <span className="font-medium">{state.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: "1px solid #EEF1F5" }}>
            <div className="text-[11px] text-juris-ink-4">
              {isPublished
                ? "Tavsiye: 24sa / 7gün / 30gün periyotlarında güncelle"
                : "İçerik henüz yayımlanmadı — Yayım aşamasına geç"}
            </div>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white disabled:opacity-60"
              style={{ background: "#1F7A4E" }}
            >
              <Save size={12} />
              {pending ? "Kaydediliyor…" : "Metrikleri Kaydet"}
            </button>
          </div>
        </div>

        {/* Keywords table */}
        {item.keywords.length > 0 && (
          <div className="card p-6">
            <h3
              className="leading-tight mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: "#0A2240" }}
            >
              Anahtar Sözcük İzleme
            </h3>
            <p className="text-[11.5px] text-juris-ink-3 mb-3">
              Search Console bağlandığında her kelime için pozisyon + trafik grafiği burada görünür.
            </p>
            <div className="rounded-md overflow-hidden" style={{ border: "1px solid #E5E9F0" }}>
              <table className="w-full text-[12.5px]">
                <thead
                  className="text-juris-ink-3 text-[10px] uppercase tracking-wider"
                  style={{ background: "#FAFBFD" }}
                >
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">Kelime</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Pozisyon</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Tıklama</th>
                    <th className="text-right px-4 py-2.5 font-semibold">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {item.keywords.map((k) => (
                    <tr key={k} className="border-t border-juris-line-2">
                      <td className="px-4 py-2.5 text-juris-navy font-medium">{k}</td>
                      <td className="px-4 py-2.5 mono text-right text-juris-ink-3">—</td>
                      <td className="px-4 py-2.5 mono text-right text-juris-ink-3">—</td>
                      <td className="px-4 py-2.5 mono text-right text-juris-ink-3">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right rail */}
      <aside className="flex flex-col gap-4">
        {isPublished && (
          <div className="card p-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-3">
              Yayın Linki
            </div>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] text-juris-navy hover:text-juris-red mono break-all inline-flex items-start gap-1.5"
              >
                <Link2 size={11} className="text-juris-ink-3 mt-0.5 shrink-0" />
                <span className="flex-1">{item.url}</span>
                <ExternalLink size={10} className="shrink-0 mt-0.5" />
              </a>
            ) : (
              <div className="text-[11.5px] text-juris-ink-4 italic">
                Canlı URL girilmedi — formdan ekle.
              </div>
            )}
            {item.publishedAt && (
              <div className="text-[10.5px] text-juris-ink-4 mt-3 pt-3" style={{ borderTop: "1px solid #EEF1F5" }}>
                Yayın: {new Date(item.publishedAt).toLocaleString("tr-TR", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </div>
            )}
          </div>
        )}

        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2.5">
            Ölçüm Kılavuzu
          </div>
          <ul className="flex flex-col gap-2 text-[11.5px] text-juris-ink-2 leading-relaxed">
            <li className="flex gap-2"><span className="text-juris-red shrink-0">24sa</span><span>LinkedIn + newsletter erken sinyal</span></li>
            <li className="flex gap-2"><span className="text-juris-red shrink-0">7 gün</span><span>Blog okumalarının %60&apos;ı</span></li>
            <li className="flex gap-2"><span className="text-juris-red shrink-0">30 gün</span><span>SEO pozisyon stabilize olur</span></li>
            <li className="flex gap-2"><span className="text-juris-red shrink-0">90 gün</span><span>Backlink + referral trafik</span></li>
          </ul>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
        >
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2">
            Trafik Stüdyosu
          </div>
          <p className="text-[11.5px] text-juris-ink-2 mb-3 leading-relaxed">
            Tüm içeriklerin toplam performansı ve kaynak atfı Trafik Stüdyosu&apos;nda birleşir.
          </p>
          <Link
            href="/marketing?tab=trafik"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-juris-red hover:underline"
          >
            Trafik Stüdyosu&apos;na git →
          </Link>
        </div>
      </aside>
    </form>
  );
}

// ─── helpers ───

function MetricKpi({
  label, value, icon, accent, emphasized,
}: {
  label: string; value: string; icon: React.ReactNode; accent: string; emphasized?: boolean;
}) {
  return (
    <div
      className="rounded-lg p-4 relative overflow-hidden"
      style={{
        background: emphasized ? accent : "white",
        border: emphasized ? `1px solid ${accent}` : "1px solid #E5E9F0",
        color: emphasized ? "white" : "#0A2240",
      }}
    >
      <div
        className="text-[9.5px] uppercase tracking-[0.14em] font-semibold inline-flex items-center gap-1"
        style={{ color: emphasized ? "rgba(255,255,255,0.7)" : "#5A6B82" }}
      >
        {icon} {label}
      </div>
      <div
        className="mt-2 leading-none"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26 }}
      >
        {value}
      </div>
    </div>
  );
}

function NumField({
  label, name, defaultValue, error, hint, max,
}: {
  label: string;
  name: string;
  defaultValue: number | string;
  error?: string;
  hint?: string;
  max?: number;
}) {
  return (
    <div>
      <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <input
        name={name}
        type="number"
        min={0}
        max={max}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none mono"
        style={{ border: `1px solid ${error ? "#BC2F2C" : "#E5E9F0"}` }}
      />
      {hint && !error && <div className="text-[10px] text-juris-ink-4 mt-1">{hint}</div>}
      {error && (
        <div className="text-[11px] text-juris-red mt-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </div>
      )}
    </div>
  );
}
