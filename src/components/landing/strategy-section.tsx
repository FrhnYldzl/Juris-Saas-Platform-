"use client";

import { useEffect, useState } from "react";

/**
 * Landing — Strateji bölümü.
 * Orijinal Juris Strategy Animation (50s, React+Babel, canvas+SVG) iframe
 * olarak gömülüyor. İzolasyon sayesinde React 18 (animasyon) / React 19
 * (platform) çakışması yok.
 *
 * Animasyon 1920×1080'de render ediliyor; iframe aspect-ratio ile ölçekleniyor.
 */
export function StrategySection() {
  const [loaded, setLoaded] = useState(false);

  // Fallback: 3 saniye içinde onLoad tetiklenmezse iframe'i görünür yap
  // (Babel-standalone derlemesi ağdan yüklenirken geç kalabilir).
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      id="strateji"
      className="relative overflow-hidden"
      style={{ background: "#030711" }}
    >
      <div className="relative max-w-[1400px] mx-auto px-6 pt-16 md:pt-20 pb-10">
        <div
          className="text-[10px] font-mono tracking-[0.36em] uppercase mb-6"
          style={{ color: "rgba(232,236,244,0.5)" }}
        >
          {"// STRATEJİ"}
        </div>
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 500,
            color: "#F2F0EA",
            letterSpacing: "-0.015em",
            lineHeight: 1.2,
            maxWidth: "26ch",
          }}
        >
          Hukukun <em style={{ fontStyle: "italic", color: "#E07F7C" }}>kesişim</em> noktası.
        </h2>
        <p
          className="mt-4 max-w-xl"
          style={{ color: "rgba(232,236,244,0.65)", fontSize: 15, lineHeight: 1.65 }}
        >
          Ticaret, teknoloji, finans ve sektörel uzmanlığın tek bir ortaklıkta
          birleştiği, çoklu disiplinli bir hukuk anlayışı.
        </p>
      </div>

      <div
        className="relative mx-auto"
        style={{
          maxWidth: "1400px",
          width: "100%",
          aspectRatio: "16 / 9",
          padding: "0 8px",
        }}
      >
        {/* Loading placeholder (shown until iframe dispatches its ready msg) */}
        {!loaded && (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(800px 600px at 50% 50%, rgba(188,47,44,0.12), transparent 60%), #030711",
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "rgba(232,236,244,0.15)",
                  borderTopColor: "#BC2F2C",
                }}
              />
              <span
                className="text-[10px] font-mono tracking-[0.28em]"
                style={{ color: "rgba(232,236,244,0.5)" }}
              >
                LOADING
              </span>
            </div>
          </div>
        )}
        <iframe
          src="/animation/index.html"
          title="Juris Strateji Animasyonu"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="w-full h-full rounded-[14px]"
          style={{
            border: "1px solid rgba(232,236,244,0.08)",
            background: "#030711",
            transition: "opacity 500ms ease",
            opacity: loaded ? 1 : 0,
          }}
          allow="autoplay"
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10 md:py-12 flex items-center justify-between gap-4 flex-wrap">
        <div
          className="text-[11px] font-mono tracking-[0.22em]"
          style={{ color: "rgba(232,236,244,0.4)" }}
        >
          JURİS · ÇOKLU DİSİPLİNLİ HUKUK ORTAKLIĞI
        </div>
        <div
          className="text-[11px] font-mono tracking-[0.22em] flex items-center gap-2"
          style={{ color: "rgba(232,236,244,0.4)" }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#BC2F2C" }} />
          SPACE · PLAY/PAUSE &nbsp;&nbsp; ←→ · SEEK
        </div>
      </div>
    </section>
  );
}
