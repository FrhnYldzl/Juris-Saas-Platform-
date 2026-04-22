"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Lightbulb, PenTool, Layers, ShieldCheck, Send, BarChart3, CheckCircle2, Circle,
} from "lucide-react";
import type { ContentStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export type StageKey = "plan" | "uret" | "bicim" | "onay" | "yayim" | "olc";

const STAGES: Array<{ key: StageKey; label: string; icon: typeof Lightbulb; sub: string }> = [
  { key: "plan",  label: "Planla",      icon: Lightbulb,  sub: "brief, kanal, anahtar sözcük" },
  { key: "uret",  label: "Üret",        icon: PenTool,    sub: "AI destekli taslak" },
  { key: "bicim", label: "Biçimlendir", icon: Layers,     sub: "kanala göre uyarla" },
  { key: "onay",  label: "Onay",        icon: ShieldCheck,sub: "ortak onayı" },
  { key: "yayim", label: "Yayımla",     icon: Send,       sub: "planla veya hemen gönder" },
  { key: "olc",   label: "Ölç",         icon: BarChart3,  sub: "trafik · lead · SEO" },
];

// Map current content status → the stage the workflow is actually at.
// This determines which stages are "done".
export function statusToStageIndex(status: ContentStatus): number {
  switch (status) {
    case "IDEA":       return 0;
    case "DRAFT":      return 1;
    case "REVIEW":     return 3;
    case "SCHEDULED":  return 4;
    case "PUBLISHED":  return 5;
    case "ARCHIVED":   return 5;
    default:           return 0;
  }
}

/**
 * Suggest the next stage to jump to, based on current status.
 * Used by the "Sıradaki adım" button on the detail page.
 */
export function suggestedStage(status: ContentStatus): StageKey {
  const idx = statusToStageIndex(status);
  // If the user's done with a stage, suggest the next one (unless we're at the end).
  return STAGES[Math.min(idx, STAGES.length - 1)]?.key ?? "plan";
}

export function WorkflowStepper({
  contentId, status, activeStage,
}: {
  contentId: string;
  status: ContentStatus;
  activeStage: StageKey;
}) {
  // Re-read active from URL in case server & client disagree during nav
  const sp = useSearchParams();
  const urlStage = (sp.get("stage") as StageKey | null) ?? activeStage;
  const currentIdx = statusToStageIndex(status);

  return (
    <div className="mb-6">
      <div
        className="rounded-xl p-3 bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <ol className="grid grid-cols-6 gap-1">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.key === urlStage;
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <li key={s.key}>
                <Link
                  href={`/marketing/${contentId}?stage=${s.key}`}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-md transition-all relative group",
                    isActive ? "bg-juris-navy text-white" : "text-juris-ink-3 hover:bg-juris-paper-2",
                  )}
                  style={{
                    border: isActive ? "1px solid #0A2240" : "1px solid transparent",
                  }}
                >
                  {/* Circle badge with step number + done checkmark */}
                  <div
                    className="w-7 h-7 rounded-full inline-flex items-center justify-center shrink-0 relative"
                    style={{
                      background:
                        isActive ? "white" :
                        isDone   ? "#1F7A4E" :
                        isCurrent ? "#BC2F2C" :
                                   "#F1F4F8",
                      color:
                        isActive  ? "#0A2240" :
                        isDone    ? "white" :
                        isCurrent ? "white" :
                                    "#5A6B82",
                    }}
                  >
                    {isDone
                      ? <CheckCircle2 size={13} />
                      : <Icon size={13} />}
                  </div>
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-[11.5px] font-semibold leading-tight",
                        isActive ? "text-white" : "text-juris-navy",
                      )}
                    >
                      {i + 1}. {s.label}
                    </div>
                    <div
                      className={cn(
                        "text-[9.5px] mt-0.5 leading-tight",
                        isActive ? "text-white/65" : "text-juris-ink-4",
                      )}
                    >
                      {s.sub}
                    </div>
                  </div>

                  {/* Connector dashes between steps */}
                  {i < STAGES.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-4 right-[-4px] w-[8px] h-px"
                      style={{
                        background: i < currentIdx - 1 ? "#1F7A4E" : "#D1DCE9",
                      }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
      {/* Tiny summary row */}
      <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-juris-ink-3">
        <div className="inline-flex items-center gap-1.5">
          <Circle size={7} className="fill-juris-red text-juris-red" />
          <span>
            Şu an <strong className="text-juris-navy">{STAGES[currentIdx]?.label ?? "—"}</strong> aşamasındasınız
          </span>
        </div>
        <div className="text-juris-ink-4 mono">
          {currentIdx + 1}/{STAGES.length} adım tamamlandı
        </div>
      </div>
    </div>
  );
}
