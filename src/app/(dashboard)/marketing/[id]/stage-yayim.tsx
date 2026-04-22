"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  Send, Calendar, CheckCircle2, AlertCircle, ArrowRight, Globe,
  Linkedin, Instagram, Mail, FileText as BlogIcon, X as XIcon,
} from "lucide-react";
import type { ContentChannel } from "@prisma/client";
import { schedulePublish, publishNow, type StageState } from "./actions";

type DistributionChannel = {
  key: ContentChannel;
  label: string;
  icon: typeof Linkedin;
  color: string;
  hint: string;
  defaultActive: boolean;
};

const CHANNELS: DistributionChannel[] = [
  { key: "BLOG",       label: "Blog (juris.com.tr)", icon: BlogIcon,  color: "#0A2240", hint: "Ana yayın · SEO",   defaultActive: true  },
  { key: "LINKEDIN",   label: "LinkedIn Company",     icon: Linkedin,  color: "#0077B5", hint: "Profesyonel ağ",    defaultActive: true  },
  { key: "NEWSLETTER", label: "Newsletter (Mailchimp)", icon: Mail,    color: "#1F7A4E", hint: "Abone listesi",    defaultActive: false },
  { key: "INSTAGRAM",  label: "Instagram (@juris)",   icon: Instagram, color: "#E1306C", hint: "Görsel + hashtag",  defaultActive: false },
  { key: "X",          label: "X (Twitter)",          icon: XIcon,     color: "#1DA1F2", hint: "Kısa kanca",        defaultActive: false },
];

export function StageYayim({ item, realRole }: {
  item: {
    id: string;
    title: string;
    status: string;
    channel: ContentChannel;
    publishAt: Date | null;
    publishedAt: Date | null;
    url: string | null;
  };
  realRole: string;
}) {
  const [scheduleState, scheduleAction, schedulePending] = useActionState<StageState, FormData>(
    (prev, fd) => schedulePublish(item.id, prev, fd),
    null,
  );
  const [publishPending, startPublish] = useTransition();
  const [publishState, setPublishState] = useState<StageState>(null);
  const [channels, setChannels] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CHANNELS.map((c) => [c.key, c.defaultActive || c.key === item.channel])),
  );

  const isPublished = item.status === "PUBLISHED";
  const isScheduled = item.status === "SCHEDULED";
  const canPublish = realRole === "OWNER" || realRole === "PARTNER";
  const distCount = Object.values(channels).filter(Boolean).length;

  const doPublishNow = () => {
    startPublish(async () => {
      const result = await publishNow(item.id);
      setPublishState(result);
      if (result?.ok) setTimeout(() => window.location.reload(), 500);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
      {/* Left */}
      <div className="flex flex-col gap-5">
        {/* Scheduler */}
        <form action={scheduleAction} className="card p-6 flex flex-col gap-4">
          <div>
            <h3
              className="leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#0A2240" }}
            >
              Yayım zamanlayıcı
            </h3>
            <p className="text-[12px] text-juris-ink-3 mt-1">
              Zaman planla veya hemen yayımla. Onaylanmış içerik için canlıdır.
            </p>
          </div>

          {isPublished && (
            <div
              className="rounded-md p-3 flex items-start gap-2.5"
              style={{ background: "rgba(31,122,78,0.08)", border: "1px solid #1F7A4E33", color: "#1F7A4E" }}
            >
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[12.5px] font-semibold">Yayımlandı</div>
                <div className="text-[11.5px] opacity-80 mt-0.5">
                  {item.publishedAt && `${new Date(item.publishedAt).toLocaleString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                  {" · "}Performans için Ölçüm aşamasına geçin.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
                Planlanan Yayım Tarihi
              </label>
              <input
                name="publishAt"
                type="datetime-local"
                defaultValue={item.publishAt ? toLocalInput(item.publishAt) : ""}
                required
                className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none"
                style={{ border: "1px solid #E5E9F0" }}
              />
              <div className="text-[10px] text-juris-ink-4 mt-1">
                En iyi performans için Salı-Perşembe 08:30-10:00 önerilir
              </div>
            </div>
            <button
              type="submit"
              disabled={schedulePending || isPublished}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-juris-ink-2 transition-colors hover:bg-juris-paper-2 disabled:opacity-50"
              style={{ border: "1px solid #E5E9F0" }}
            >
              <Calendar size={12} />
              {schedulePending ? "Planlanıyor…" : "Planla"}
            </button>
          </div>

          {scheduleState?.message && (
            <StatusMessage ok={scheduleState.ok} message={scheduleState.message} />
          )}

          <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid #EEF1F5" }}>
            <div className="text-[11px] text-juris-ink-4">
              {isScheduled && item.publishAt && (
                <span>Planlandı: <strong className="text-juris-navy">{new Date(item.publishAt).toLocaleString("tr-TR", {
                  day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
                })}</strong></span>
              )}
              {!isScheduled && !isPublished && "Planlayabilir veya doğrudan yayımlayabilirsin."}
            </div>
            {canPublish && !isPublished && (
              <button
                type="button"
                onClick={doPublishNow}
                disabled={publishPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white disabled:opacity-60"
                style={{ background: "#BC2F2C" }}
              >
                <Send size={12} />
                {publishPending ? "Gönderiliyor…" : "Hemen Yayımla"}
              </button>
            )}
          </div>

          {publishState?.message && (
            <StatusMessage ok={publishState.ok} message={publishState.message} />
          )}
        </form>

        {/* Distribution matrix */}
        <div className="card p-6 flex flex-col gap-4">
          <div>
            <h3
              className="leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#0A2240" }}
            >
              Dağıtım kanalları
            </h3>
            <p className="text-[12px] text-juris-ink-3 mt-1">
              Hangi kanallara gitsin? Biçimlendirme aşamasındaki önizlemeler bu kanallara göre üretildi.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-juris-line-2">
            {CHANNELS.map((c) => {
              const Icon = c.icon;
              const checked = channels[c.key] ?? false;
              const isPrimary = item.channel === c.key;
              return (
                <label
                  key={c.key}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-juris-paper-2 -mx-2 px-2 rounded-md transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChannels({ ...channels, [c.key]: e.target.checked })}
                    className="w-4 h-4 rounded accent-juris-navy shrink-0"
                    style={{ borderColor: "#E5E9F0" }}
                  />
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: `${c.color}15`, color: c.color }}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-juris-navy">{c.label}</span>
                      {isPrimary && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold"
                          style={{ background: "rgba(188,47,44,0.1)", color: "#BC2F2C" }}
                        >
                          ANA
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-juris-ink-3 mt-0.5">{c.hint}</div>
                  </div>
                  {checked && (
                    <Link
                      href={`/marketing/${item.id}?stage=bicim`}
                      className="text-[10.5px] font-semibold text-juris-red hover:underline shrink-0"
                    >
                      Biçim ön izle →
                    </Link>
                  )}
                </label>
              );
            })}
          </div>

          <div
            className="rounded-md p-3 text-[11.5px] text-juris-ink-2 leading-relaxed flex items-start gap-2"
            style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
          >
            <Globe size={12} className="text-juris-ink-3 shrink-0 mt-0.5" />
            <span>
              Şu an <strong className="text-juris-navy">{distCount}</strong> kanal seçili.
              Kanallar Entegrasyonlar modülünde etkinleştirildiğinde otomatik paylaşım yapılır.
              Bu sürümde kanal bağlantıları manuel yapılır — biçimlendirme sekmesinden kopyala-yapıştır.
            </span>
          </div>
        </div>
      </div>

      {/* Right rail */}
      <aside className="flex flex-col gap-4">
        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-3">
            Özet
          </div>
          <dl className="grid grid-cols-[90px_1fr] gap-y-2 text-[12px]">
            <dt className="text-juris-ink-3">Başlık</dt>
            <dd className="text-juris-navy font-medium truncate" title={item.title}>{item.title}</dd>
            <dt className="text-juris-ink-3">Durum</dt>
            <dd className="text-juris-ink-2">{statusLabel(item.status)}</dd>
            <dt className="text-juris-ink-3">Ana kanal</dt>
            <dd className="text-juris-ink-2">{channelLabel(item.channel)}</dd>
            <dt className="text-juris-ink-3">Dağıtım</dt>
            <dd className="text-juris-ink-2 mono">{distCount} kanal seçili</dd>
          </dl>
        </div>

        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2.5">
            Yayım Prensipleri
          </div>
          <ul className="flex flex-col gap-2 text-[11.5px] text-juris-ink-2 leading-relaxed">
            <li className="flex gap-2"><span className="text-juris-red">•</span> Tüm kanallarda tutarlı başlık</li>
            <li className="flex gap-2"><span className="text-juris-red">•</span> UTM parametreleriyle trafik izle</li>
            <li className="flex gap-2"><span className="text-juris-red">•</span> Yayımdan 24sa sonra performans kontrol</li>
            <li className="flex gap-2"><span className="text-juris-red">•</span> Müvekkil referansı varsa izin alındı mı?</li>
          </ul>
        </div>

        {isPublished && (
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(31,122,78,0.05)", border: "1px solid #1F7A4E33" }}
          >
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-juris-success font-semibold mb-2">
              Sıradaki adım — Ölçüm
            </div>
            <p className="text-[12px] text-juris-ink-2 mb-3 leading-relaxed">
              Yayın canlıda — 24-48 saat sonra ilk performans verileri Ölçüm sekmesine işlenebilir.
            </p>
            <Link
              href={`/marketing/${item.id}?stage=olc`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold text-white"
              style={{ background: "#1F7A4E" }}
            >
              Ölçüme geç <ArrowRight size={11} />
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusMessage({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div
      className="rounded-md p-3 text-[12px] flex items-start gap-2"
      style={{
        background: ok ? "rgba(31,122,78,0.08)" : "rgba(188,47,44,0.08)",
        color: ok ? "#1F7A4E" : "#BC2F2C",
        border: `1px solid ${ok ? "#1F7A4E33" : "#BC2F2C33"}`,
      }}
    >
      {ok ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" /> : <AlertCircle size={13} className="shrink-0 mt-0.5" />}
      <span className="font-medium">{message}</span>
    </div>
  );
}

function channelLabel(c: ContentChannel): string {
  const m: Record<ContentChannel, string> = {
    BLOG: "Blog", LINKEDIN: "LinkedIn", INSTAGRAM: "Instagram",
    X: "X (Twitter)", NEWSLETTER: "Newsletter", PODCAST: "Podcast",
    VIDEO: "Video", OTHER: "Diğer",
  };
  return m[c];
}

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    IDEA: "Fikir", DRAFT: "Taslak", REVIEW: "İncelemede",
    SCHEDULED: "Planlandı", PUBLISHED: "Yayında", ARCHIVED: "Arşiv",
  };
  return m[s] ?? s;
}
