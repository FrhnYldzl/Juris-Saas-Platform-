"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ShieldCheck, CheckCircle2, XCircle, Send, AlertCircle, ArrowRight, Clock, User as UserIcon,
} from "lucide-react";
import { requestReview, approveContent, rejectContent, type StageState } from "./actions";

export function StageOnay({ item, realRole, managingPartnerName }: {
  item: {
    id: string;
    title: string;
    status: string;
    body: string | null;
    author: string | null;
    updatedAt: Date;
  };
  realRole: string;
  managingPartnerName: string | null;
}) {
  const [state, setState] = useState<StageState>(null);
  const [pending, start] = useTransition();
  const [rejectReason, setRejectReason] = useState("");

  const canApprove = realRole === "OWNER" || realRole === "PARTNER";
  const isInReview  = item.status === "REVIEW";
  const isApproved  = item.status === "SCHEDULED" || item.status === "PUBLISHED";
  const isDraft     = item.status === "DRAFT";
  const bodyLen = item.body?.length ?? 0;

  const fire = (fn: () => Promise<StageState>) => start(async () => setState(await fn()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
      {/* Left: review area */}
      <div className="card p-6 flex flex-col gap-5">
        <div>
          <h3
            className="leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#0A2240" }}
          >
            İnceleme ve onay
          </h3>
          <p className="text-[12px] text-juris-ink-3 mt-1">
            İçerik yayımlanmadan önce yönetici ortak gözden geçirir. Onay sonrası yayım planına alınır.
          </p>
        </div>

        {/* Status banner */}
        <StatusBanner status={item.status} />

        {/* Content preview */}
        <div>
          <div className="flex items-center justify-between mb-2 text-[10.5px] text-juris-ink-4 uppercase tracking-wider font-semibold">
            <span>İncelenen metin</span>
            <span className="mono">{bodyLen} karakter</span>
          </div>
          <div
            className="rounded-md p-5 bg-white text-[13px] text-juris-ink-1 leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto"
            style={{ border: "1px solid #E5E9F0" }}
          >
            {item.body && item.body.trim().length > 0 ? item.body : (
              <span className="text-juris-ink-4 italic">Taslak boş — önce Üretim aşamasında metin yaz.</span>
            )}
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

        {/* Action row */}
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid #EEF1F5" }}>
          <Link
            href={`/marketing/${item.id}?stage=uret`}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-[12px] font-semibold text-juris-ink-2 hover:bg-juris-paper-2"
            style={{ border: "1px solid #E5E9F0" }}
          >
            ← Editöre dön
          </Link>

          <div className="flex items-center gap-2">
            {isDraft && (
              <button
                type="button"
                onClick={() => fire(() => requestReview(item.id))}
                disabled={pending || bodyLen < 50}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white disabled:opacity-60"
                style={{ background: "#0A2240" }}
              >
                <Send size={11} />
                {pending ? "Gönderiliyor…" : "Onaya Gönder"}
              </button>
            )}
            {isInReview && canApprove && (
              <>
                <button
                  type="button"
                  onClick={() => fire(() => approveContent(item.id))}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white disabled:opacity-60"
                  style={{ background: "#1F7A4E" }}
                >
                  <CheckCircle2 size={11} />
                  {pending ? "İşleniyor…" : "Onayla ve İlerlet"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reason = prompt("İade nedeni (isteğe bağlı):", rejectReason) ?? rejectReason;
                    setRejectReason(reason);
                    fire(() => rejectContent(item.id, reason));
                  }}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold text-juris-red disabled:opacity-60"
                  style={{ border: "1px solid #BC2F2C" }}
                >
                  <XCircle size={11} /> İade Et
                </button>
              </>
            )}
            {isInReview && !canApprove && (
              <span className="text-[11px] text-juris-ink-3 italic">
                Onay yetkisi yalnızca OWNER/PARTNER&apos;de
              </span>
            )}
            {isApproved && (
              <Link
                href={`/marketing/${item.id}?stage=yayim`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white"
                style={{ background: "#0A2240" }}
              >
                Yayım aşamasına geç <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Right rail */}
      <aside className="flex flex-col gap-4">
        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-3">
            İnceleyici
          </div>
          <div className="flex items-start gap-2.5">
            <div
              className="w-10 h-10 rounded-full inline-flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ background: "#BC2F2C" }}
            >
              {managingPartnerName ? managingPartnerName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() : "MP"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-juris-navy truncate">
                {managingPartnerName ?? "Managing Partner"}
              </div>
              <div className="text-[11px] text-juris-red font-medium">Yönetici Ortak</div>
              <div className="text-[10.5px] text-juris-ink-4 mt-1">
                Onay ve ret yetkisi var
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2.5">
            Onay Akışı
          </div>
          <ol className="flex flex-col gap-3 text-[12px] text-juris-ink-2">
            <ApprovalStep ok num="1" label="Yazar taslağı gönderir" tone="draft" active={isDraft} />
            <ApprovalStep ok={!isDraft} num="2" label="İnceleme — yönetici ortak okur" tone="review" active={isInReview} />
            <ApprovalStep ok={isApproved} num="3" label="Onay veya iade" tone="approve" active={isApproved} />
            <ApprovalStep num="4" label="Yayım planına alınır" tone="publish" active={isApproved} />
          </ol>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
        >
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2 inline-flex items-center gap-1.5">
            <Clock size={10} /> Son güncelleme
          </div>
          <div className="text-[12px] text-juris-ink-2 mono">
            {new Date(item.updatedAt).toLocaleString("tr-TR", {
              day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
            })}
          </div>
          {item.author && (
            <div className="text-[11px] text-juris-ink-3 mt-2 inline-flex items-center gap-1.5">
              <UserIcon size={10} /> {item.author}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── helpers ───

function StatusBanner({ status }: { status: string }) {
  const config: Record<string, { tone: string; bg: string; icon: React.ReactNode; title: string; body: string }> = {
    DRAFT: {
      tone: "#B4701C", bg: "rgba(180,112,28,0.1)",
      icon: <AlertCircle size={14} />,
      title: "Taslak — henüz onaya gönderilmedi",
      body: "Hazır olunca 'Onaya Gönder' butonuyla yönetici ortağa iletilecek.",
    },
    REVIEW: {
      tone: "#1F5AA8", bg: "rgba(31,90,168,0.1)",
      icon: <ShieldCheck size={14} />,
      title: "İncelemede — yönetici ortak karar bekliyor",
      body: "Onay veya iade yalnızca OWNER/PARTNER yetkisiyle verilebilir.",
    },
    SCHEDULED: {
      tone: "#1F7A4E", bg: "rgba(31,122,78,0.1)",
      icon: <CheckCircle2 size={14} />,
      title: "Onaylandı — yayım planında",
      body: "Sıradaki aşama: Yayım (yayın zamanı + kanal dağıtımı).",
    },
    PUBLISHED: {
      tone: "#1F7A4E", bg: "rgba(31,122,78,0.1)",
      icon: <CheckCircle2 size={14} />,
      title: "Yayımlandı",
      body: "Performans metrikleri için Ölçüm aşamasına geç.",
    },
  };
  const c = config[status] ?? config.DRAFT;
  return (
    <div
      className="rounded-md p-3 flex items-start gap-2.5"
      style={{ background: c.bg, border: `1px solid ${c.tone}33`, color: c.tone }}
    >
      <span className="shrink-0 mt-0.5">{c.icon}</span>
      <div>
        <div className="text-[12.5px] font-semibold">{c.title}</div>
        <div className="text-[11.5px] opacity-80 mt-0.5 leading-relaxed">{c.body}</div>
      </div>
    </div>
  );
}

function ApprovalStep({
  num, label, tone, active, ok,
}: {
  num: string;
  label: string;
  tone: "draft" | "review" | "approve" | "publish";
  active: boolean;
  ok?: boolean;
}) {
  const color = tone === "approve" ? "#1F7A4E" : tone === "review" ? "#1F5AA8" : tone === "publish" ? "#0A2240" : "#B4701C";
  return (
    <li className="flex items-center gap-2.5">
      <span
        className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[9.5px] font-bold shrink-0"
        style={{
          background: ok ? color : active ? "white" : "#F1F4F8",
          color: ok ? "white" : active ? color : "#8895AB",
          border: `1px solid ${ok ? color : active ? color : "transparent"}`,
        }}
      >
        {ok ? "✓" : num}
      </span>
      <span className={active ? "font-semibold text-juris-navy" : ""}>{label}</span>
    </li>
  );
}
