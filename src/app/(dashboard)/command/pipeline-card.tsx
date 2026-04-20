"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { PipelineChart } from "@/components/ui/mini-chart";
import { SectionHead } from "@/components/ui/section-head";
import { formatTRY } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StageKpi {
  label: string;
  value: number;
  delta?: number;
}

export function PipelineCard({
  valueData, countData, monthLabels,
  currentTotal, stages,
}: {
  valueData: number[];
  countData: number[];
  monthLabels: string[];
  currentTotal: number;
  stages: StageKpi[];
}) {
  const [mode, setMode] = useState<"value" | "count">("value");
  const data = mode === "value" ? valueData : countData;
  const hasData = data.some((v) => v > 0);

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3
            className="display text-[18px] text-juris-navy leading-tight"
            style={{ letterSpacing: "-0.005em" }}
          >
            Pipeline · Son 12 Ay
          </h3>
          <div className="text-xs text-juris-ink-3 mt-1">
            {mode === "value" ? "Fırsat değeri" : "Fırsat adedi"} · ay bazında
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="inline-flex gap-0 rounded-md overflow-hidden"
            style={{
              background: "white",
              border: "1px solid #E5E9F0",
            }}
          >
            {([
              { id: "value" as const, label: "₺ Değer" },
              { id: "count" as const, label: "Adet" },
            ]).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold transition-all",
                )}
                style={{
                  background: mode === m.id ? "#0A2240" : "transparent",
                  color: mode === m.id ? "white" : "#5A6B82",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Link
            href="/bd"
            className="text-xs text-juris-ink-3 hover:text-juris-red inline-flex items-center gap-1"
          >
            İş geliştirmeye git <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {!hasData ? (
        <div className="py-14 text-center">
          <TrendingUp size={22} className="text-juris-ink-4 mx-auto mb-2" />
          <p className="text-sm text-juris-ink-3">
            Pipeline boş. İlk fırsatınızı ekleyerek başlayın.
          </p>
          <Link href="/bd/new" className="btn btn-sm btn-primary mt-3">
            Yeni Fırsat
          </Link>
        </div>
      ) : (
        <>
          <PipelineChart
            data={data}
            labels={monthLabels}
            secondary={mode === "value" ? valueData.map((v) => v * 0.15) : undefined}
          />
          <div className="flex justify-end mt-2 mono text-sm font-semibold text-juris-red">
            {mode === "value" ? formatTRY(currentTotal, { short: true }) : currentTotal}
          </div>
        </>
      )}

      {/* Stage strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-juris-line-2">
        {stages.map((s) => (
          <div key={s.label}>
            <div className="text-[10px] uppercase tracking-wider text-juris-ink-3 font-semibold">
              {s.label}
            </div>
            <div className="display text-[20px] text-juris-navy mt-0.5 leading-none">
              {formatTRY(s.value, { short: true })}
            </div>
            {s.delta != null && s.delta !== 0 && (
              <div
                className={cn(
                  "text-[11px] font-semibold mt-1",
                  s.delta > 0 ? "text-juris-success" : "text-juris-red",
                )}
              >
                {s.delta > 0 ? "▴" : "▾"} {s.delta > 0 ? "+" : ""}
                {s.delta}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
