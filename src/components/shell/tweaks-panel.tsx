"use client";

import { useEffect, useState } from "react";
import { Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Density = "comfortable" | "compact";
type AccentIntensity = "subtle" | "balanced" | "bold";

interface Tweaks {
  density: Density;
  accentIntensity: AccentIntensity;
  showSerifHeadings: boolean;
}

const DEFAULTS: Tweaks = {
  density: "comfortable",
  accentIntensity: "balanced",
  showSerifHeadings: true,
};

function read(): Tweaks {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem("juris.tweaks");
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function apply(tweaks: Tweaks) {
  if (typeof document === "undefined") return;
  const body = document.body;
  body.dataset.density = tweaks.density;
  body.dataset.accent = tweaks.accentIntensity;
  body.dataset.serif = tweaks.showSerifHeadings ? "on" : "off";
}

/**
 * Floating tweaks panel bottom-right — density / accent / serif.
 * Identical to Platform.html prototype tweaks, persisted in localStorage.
 */
export function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = read();
    setTweaks(loaded);
    apply(loaded);
    setHydrated(true);
  }, []);

  const update = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    const next = { ...tweaks, [key]: value };
    setTweaks(next);
    apply(next);
    try {
      localStorage.setItem("juris.tweaks", JSON.stringify(next));
    } catch {
      // noop — localStorage may be disabled
    }
  };

  if (!hydrated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Görsel tercihler"
        className="fixed bottom-5 right-5 z-30 w-11 h-11 rounded-full shadow-juris-lg flex items-center justify-center transition-all hover:scale-105"
        style={{
          background: open ? "#BC2F2C" : "#0A2240",
          color: "white",
        }}
      >
        {open ? <X size={16} /> : <Settings2 size={16} />}
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-5 z-30 rounded-lg shadow-juris-pop p-5 w-[300px] tweaks-panel"
          style={{
            background: "#0B1629",
            border: "1px solid rgba(232,236,244,0.12)",
            color: "#E8ECF4",
            fontSize: 13,
          }}
        >
          <div
            className="font-mono text-[10px] uppercase mb-4"
            style={{ letterSpacing: "0.36em", color: "rgba(232,236,244,0.5)" }}
          >
            {"// TWEAKS"}
          </div>

          <TweakRow label="Yoğunluk">
            <Segmented
              value={tweaks.density}
              onChange={(v) => update("density", v as Density)}
              options={[
                { value: "comfortable", label: "Rahat" },
                { value: "compact", label: "Sıkı" },
              ]}
            />
          </TweakRow>

          <TweakRow label="Kırmızı vurgu">
            <Segmented
              value={tweaks.accentIntensity}
              onChange={(v) => update("accentIntensity", v as AccentIntensity)}
              options={[
                { value: "subtle", label: "Az" },
                { value: "balanced", label: "Dengeli" },
                { value: "bold", label: "Yoğun" },
              ]}
            />
          </TweakRow>

          <TweakRow label="Serif başlıklar">
            <Segmented
              value={tweaks.showSerifHeadings ? "on" : "off"}
              onChange={(v) => update("showSerifHeadings", v === "on")}
              options={[
                { value: "on", label: "Açık" },
                { value: "off", label: "Kapalı" },
              ]}
            />
          </TweakRow>

          <div
            className="mt-3 pt-3 text-[10px] font-mono leading-relaxed"
            style={{
              borderTop: "1px solid rgba(232,236,244,0.12)",
              color: "rgba(232,236,244,0.4)",
              letterSpacing: "0.1em",
            }}
          >
            Juris Platform · tarayıcı tercihleriniz
          </div>
        </div>
      )}
    </>
  );
}

function TweakRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label
        className="block mb-2 font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "rgba(232,236,244,0.45)",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Segmented({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-[6px] border text-[13px] py-[9px] transition-all cursor-pointer",
            )}
            style={{
              background: active ? "#BC2F2C" : "rgba(232,236,244,0.04)",
              border: `1px solid ${active ? "#BC2F2C" : "rgba(232,236,244,0.1)"}`,
              color: active ? "white" : "#E8ECF4",
              fontFamily: "inherit",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
