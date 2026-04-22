"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  Save, Sparkles, CheckCircle2, AlertCircle, ArrowRight, FileText, RefreshCw,
} from "lucide-react";
import { saveDraft, aiGenerateDraft, type StageState } from "./actions";

export function StageUret({ item }: { item: {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  keywords: string[];
  aiAssisted: boolean;
  draftVersion: number | null;
  readMinutes: number | null;
  status: string;
} }) {
  const [body, setBody] = useState(item.body ?? "");
  const [state, saveAction, pending] = useActionState<StageState, FormData>(
    (prev, fd) => saveDraft(item.id, prev, fd),
    null,
  );
  const [aiPending, startAiTransition] = useTransition();
  const [aiState, setAiState] = useState<StageState>(null);

  const runAi = () => {
    startAiTransition(async () => {
      const result = await aiGenerateDraft(item.id);
      setAiState(result);
      // Server revalidated — best to refresh. For now just update local body with optimistic wording.
      if (result?.ok) {
        // Force reload after a moment so SSR re-renders with new body.
        setTimeout(() => { window.location.reload(); }, 400);
      }
    });
  };

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const charCount = body.length;
  const readMin = Math.max(1, Math.ceil(wordCount / 220));
  const canReview = body.trim().length >= 50;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
      {/* Left: editor */}
      <form action={saveAction} className="card p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              className="leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#0A2240" }}
            >
              Taslak editörü
            </h3>
            <p className="text-[12px] text-juris-ink-3 mt-1">
              Markdown destekli — başlıklar <code className="mono bg-juris-paper-2 px-1 rounded">##</code>,
              listeler <code className="mono bg-juris-paper-2 px-1 rounded">-</code>, vurgu
              <code className="mono bg-juris-paper-2 px-1 rounded">**bold**</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {item.aiAssisted && (
              <span className="chip chip-blue" style={{ fontSize: 9 }}>
                <Sparkles size={9} /> AI destekli
              </span>
            )}
            {item.draftVersion && (
              <span className="mono text-[10px] text-juris-ink-4">v{item.draftVersion}</span>
            )}
          </div>
        </div>

        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={22}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-md text-[13.5px] text-juris-navy bg-white outline-none resize-vertical mono leading-relaxed"
          style={{ border: "1px solid #E5E9F0", minHeight: 480 }}
        />

        <input type="hidden" name="draftVersion" value={item.draftVersion ?? 1} />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid #EEF1F5" }}>
          <div className="flex items-center gap-4 text-[11px] text-juris-ink-3 mono">
            <span>{wordCount} kelime</span>
            <span>{charCount} karakter</span>
            <span>~{readMin} dk okuma</span>
          </div>
          <div className="flex items-center gap-2">
            {state?.ok && (
              <span className="inline-flex items-center gap-1 text-[11px] text-juris-success font-semibold">
                <CheckCircle2 size={11} /> {state.message}
              </span>
            )}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white disabled:opacity-60"
              style={{ background: "#0A2240" }}
            >
              <Save size={12} />
              {pending ? "Kaydediliyor…" : "Taslağı Kaydet"}
            </button>
            <Link
              href={`/marketing/${item.id}?stage=bicim`}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-[12px] font-semibold text-juris-ink-2 hover:bg-juris-paper-2"
              style={{ border: "1px solid #E5E9F0" }}
            >
              Biçimlendirme <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </form>

      {/* Right rail: AI + meta */}
      <aside className="flex flex-col gap-4">
        {/* AI Draft card */}
        <div
          className="rounded-xl p-5 relative overflow-hidden text-white"
          style={{ background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: "radial-gradient(300px 200px at 100% 0%, rgba(188,47,44,0.30), transparent 60%)" }}
          />
          <div className="relative">
            <div className="text-[9.5px] uppercase tracking-[0.18em] text-white/60 font-semibold mb-1 inline-flex items-center gap-1">
              <Sparkles size={11} /> AI Taslak
            </div>
            <h4
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18 }}
            >
              Planı baz alarak <em className="italic" style={{ color: "#F4A4A1" }}>başlangıç taslağı</em> üret.
            </h4>
            <p className="text-[11.5px] text-white/70 mt-2 leading-relaxed">
              Brief + anahtar sözcükler + meta başlık kullanılır. Üretilen metni bu editörde istediğin gibi düzenle.
              {item.body ? (
                <><br /><strong className="text-white">Mevcut taslağın üzerine yazılır.</strong></>
              ) : null}
            </p>
            <button
              type="button"
              onClick={runAi}
              disabled={aiPending}
              className="relative mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-[12px] font-semibold text-white disabled:opacity-60"
              style={{ background: "#BC2F2C" }}
            >
              {aiPending ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {aiPending ? "Üretiliyor…" : item.body ? "Yeniden üret" : "AI ile taslak başlat"}
            </button>
            {aiState?.message && (
              <div
                className="mt-2 text-[11px] flex items-start gap-1.5"
                style={{ color: aiState.ok ? "#6FBF90" : "#F4A4A1" }}
              >
                {aiState.ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                {aiState.message}
              </div>
            )}
          </div>
        </div>

        {/* Plan özeti */}
        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-3 inline-flex items-center gap-1.5">
            <FileText size={10} /> Plan özeti
          </div>
          <dl className="grid grid-cols-[90px_1fr] gap-y-2 text-[12px]">
            <dt className="text-juris-ink-3">Başlık</dt>
            <dd className="text-juris-navy font-medium truncate" title={item.title}>{item.title}</dd>
            {item.readMinutes && (
              <>
                <dt className="text-juris-ink-3">Hedef</dt>
                <dd className="text-juris-ink-2">~{item.readMinutes} dk okuma</dd>
              </>
            )}
            {item.keywords.length > 0 && (
              <>
                <dt className="text-juris-ink-3">Anahtar</dt>
                <dd className="text-juris-ink-2 flex flex-wrap gap-1">
                  {item.keywords.slice(0, 6).map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-medium"
                      style={{ background: "#F1F4F8", color: "#5A6B82" }}
                    >
                      {k}
                    </span>
                  ))}
                </dd>
              </>
            )}
          </dl>
          {item.summary && (
            <p className="mt-3 text-[11.5px] text-juris-ink-2 leading-relaxed whitespace-pre-wrap">
              {item.summary}
            </p>
          )}
          <Link
            href={`/marketing/${item.id}?stage=plan`}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-juris-red hover:underline"
          >
            Planı düzenle →
          </Link>
        </div>

        {/* Sıradaki adım */}
        <div
          className="rounded-xl p-4"
          style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
        >
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2">
            Sıradaki adım — Onay
          </div>
          <p className="text-[12px] text-juris-ink-2 mb-3 leading-relaxed">
            Taslak hazır olduğunda{" "}
            <strong className="text-juris-navy">Onay</strong> aşamasından ortağa inceleme talebi gönder.
          </p>
          {canReview ? (
            <Link
              href={`/marketing/${item.id}?stage=onay`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold text-white"
              style={{ background: "#0A2240" }}
            >
              Onaya git <ArrowRight size={11} />
            </Link>
          ) : (
            <div className="text-[11px] text-juris-ink-4 italic">
              Taslak 50+ karakter olunca onaya gönderebilirsin.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

const placeholder = `# İçerik başlığınız

## Giriş

Kısa bir giriş — konu neden önemli, okuyucu için ne değer vadediyor.

## Ana bölüm

- Liste öğesi 1
- Liste öğesi 2

## Sonuç

Kısa kapanış + müvekkile yönelik eylem çağrısı.
`;
