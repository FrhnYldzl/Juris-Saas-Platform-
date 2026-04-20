/**
 * Lightweight SVG charts — zero-dep. Matches Platform.html aesthetic:
 * navy baseline, red accent on current point, subtle gridlines, area gradient.
 */

import { cn } from "@/lib/utils";

interface PipelineChartProps {
  /** 12 monthly values (most recent last) */
  data: number[];
  /** Month labels, 12 entries */
  labels: string[];
  /** Current month index (usually data.length - 1) */
  currentIdx?: number;
  /** Values overlay (e.g. 'won' deals per month) */
  secondary?: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function PipelineChart({
  data, labels, currentIdx,
  secondary, color = "#BC2F2C",
  height = 180, className,
}: PipelineChartProps) {
  const w = 720;
  const h = height;
  const pl = 36, pr = 12, pt = 16, pb = 22;
  const max = Math.max(...data, ...(secondary ?? []));
  const min = 0;
  const xFor = (i: number) =>
    pl + (i * (w - pl - pr)) / Math.max(1, data.length - 1);
  const yFor = (v: number) =>
    pt + (h - pt - pb) * (1 - (v - min) / Math.max(1, max - min));

  const linePath = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${xFor(data.length - 1).toFixed(1)},${(h - pb).toFixed(1)} L${xFor(0).toFixed(1)},${(h - pb).toFixed(1)} Z`;
  const curIdx = currentIdx ?? data.length - 1;

  // Y-axis ticks (0, 25%, 50%, 75%, 100%)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((r) => max * r);

  const formatYTick = (v: number) => {
    if (v >= 1e6) return `₺${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `₺${Math.round(v / 1e3)}K`;
    return `₺${v}`;
  };

  return (
    <svg
      className={cn("w-full", className)}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ height, maxHeight: height }}
    >
      <defs>
        <linearGradient id="pipelineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines + Y-axis labels */}
      {ticks.map((v, i) => (
        <g key={i}>
          <line
            x1={pl} x2={w - pr}
            y1={yFor(v)} y2={yFor(v)}
            stroke="#E5E9F0" strokeWidth="0.5"
            strokeDasharray={i === 0 ? undefined : "2,3"}
          />
          <text
            x={pl - 6} y={yFor(v) + 3}
            fontSize="9" fill="#8895AB"
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
          >
            {formatYTick(v)}
          </text>
        </g>
      ))}

      {/* Secondary (won) bars */}
      {secondary?.map((v, i) => {
        const cx = xFor(i);
        const barH = ((h - pt - pb) * v) / Math.max(1, max);
        return (
          <rect
            key={i}
            x={cx - 8} y={h - pb - barH}
            width={16} height={barH}
            fill={color} opacity="0.12" rx="1"
          />
        );
      })}

      {/* Area */}
      <path d={areaPath} fill="url(#pipelineGrad)" />

      {/* Line */}
      <path d={linePath} stroke={color} strokeWidth="2" fill="none" />

      {/* Points */}
      {data.map((v, i) => (
        <circle
          key={i}
          cx={xFor(i)} cy={yFor(v)}
          r={i === curIdx ? 5 : 2.5}
          fill={i === curIdx ? color : "#FFF"}
          stroke={color}
          strokeWidth={i === curIdx ? 2 : 1.5}
        />
      ))}

      {/* X-axis labels */}
      {labels.map((label, i) => (
        <text
          key={i}
          x={xFor(i)} y={h - 6}
          fontSize="9" fill="#8895AB"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontWeight={i === curIdx ? 600 : 400}
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

/**
 * Horizontal stacked bar for partner contributions.
 */
export function StackedBar({
  segments, height = 8, className,
}: {
  segments: { label: string; value: number; color: string }[];
  height?: number;
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div
      className={cn("flex w-full overflow-hidden", className)}
      style={{ height, borderRadius: height / 2 }}
    >
      {segments.map((s) => (
        <div
          key={s.label}
          title={`${s.label}: ${((s.value / total) * 100).toFixed(0)}%`}
          style={{
            width: `${(s.value / total) * 100}%`,
            background: s.color,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Thin progress bar for inline KPI cards.
 */
export function ProgressThin({
  value, max = 100, color = "#0A2240", warn, className,
}: {
  value: number;
  max?: number;
  color?: string;
  warn?: boolean;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full rounded-full overflow-hidden", className)} style={{ height: 3, background: "#EEF1F6" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: warn ? "#BC2F2C" : color,
          transition: "width 400ms ease",
        }}
      />
    </div>
  );
}
