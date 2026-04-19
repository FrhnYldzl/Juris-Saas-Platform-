"use client";

import { useState } from "react";
import { Sparkles, Loader2, X, Copy, Check } from "lucide-react";

export function AISummaryButton({ matterId }: { matterId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ model?: string; provider?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setOpen(true);
    if (summary || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/matter-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "AI özeti üretilemedi");
      } else {
        setSummary(data.summary);
        setMeta({ model: data.model, provider: data.provider });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ağ hatası");
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    setSummary(null);
    setMeta(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/matter-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "AI özeti üretilemedi");
      } else {
        setSummary(data.summary);
        setMeta({ model: data.model, provider: data.provider });
      }
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={run}
        className="btn btn-ghost"
        style={{
          background: "linear-gradient(135deg, rgba(188,47,44,0.08), rgba(10,34,64,0.06))",
        }}
      >
        <Sparkles size={14} /> AI ile Özetle
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,34,64,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-juris-pop max-w-2xl w-full max-h-[80vh] flex flex-col animate-modalIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between p-6 border-b border-juris-line-2"
              style={{
                background: "linear-gradient(180deg, rgba(188,47,44,0.04), transparent)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #0A2240, #BC2F2C)" }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-juris-red font-semibold mb-0.5">
                    AI Özeti
                  </div>
                  <h3 className="display text-xl text-juris-navy">Dosya özeti</h3>
                  {meta && (
                    <div className="text-[10px] text-juris-ink-4 mt-1 mono">
                      {meta.provider} · {meta.model}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-juris-ink-4 hover:text-juris-navy p-1"
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Loader2 size={28} className="animate-spin text-juris-red" />
                  <div className="text-sm text-juris-ink-3">
                    AI dosyayı okuyor ve özetliyor…
                  </div>
                  <div className="text-[11px] text-juris-ink-4">
                    Bu işlem 5-15 saniye sürebilir.
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 rounded-md bg-juris-red/5 border border-juris-red/20 text-sm text-[#8A1F1D]">
                  {error}
                </div>
              ) : summary ? (
                <div
                  className="prose-sm max-w-none text-sm text-juris-ink-2 leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: "inherit" }}
                >
                  {summary}
                </div>
              ) : null}
            </div>

            <div className="border-t border-juris-line-2 p-4 flex items-center justify-between bg-juris-paper-2">
              <div className="text-[10px] text-juris-ink-4">
                AI yanıtları bilgilendirme amaçlıdır. Avukat onayı gerekir.
              </div>
              <div className="flex gap-2">
                {summary && !loading && (
                  <>
                    <button type="button" onClick={copy} className="btn btn-sm btn-ghost">
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Kopyalandı" : "Kopyala"}
                    </button>
                    <button type="button" onClick={regenerate} className="btn btn-sm btn-ghost">
                      <Sparkles size={12} /> Yeniden Üret
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
