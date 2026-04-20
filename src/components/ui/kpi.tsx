import { cn } from "@/lib/utils";

interface KpiProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down";
  sub?: string;
  suffix?: string;
  emphasized?: boolean;
  /** 0-100: shows a thin progress bar under the value */
  progress?: number;
  /** Optional red accent for secondary metric (e.g. 'vadesi geçmiş') */
  secondary?: string;
}

export function Kpi({
  label, value, delta, trend, sub, suffix,
  emphasized, progress, secondary,
}: KpiProps) {
  return (
    <div
      className={cn(
        "rounded-md px-5 py-[18px] flex flex-col gap-1.5 min-h-[110px]",
        emphasized
          ? "bg-juris-navy text-white border-0"
          : "bg-white text-juris-navy border border-juris-line",
      )}
    >
      <div
        className={cn(
          "text-[10px] uppercase tracking-wider font-semibold",
          emphasized ? "text-white/60" : "text-juris-ink-3",
        )}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <div className="display text-[32px] leading-none">{value}</div>
        {suffix && (
          <div className={cn("text-sm", emphasized ? "text-white/70" : "text-juris-ink-3")}>
            {suffix}
          </div>
        )}
      </div>

      {progress != null && (
        <div className="mt-1">
          <div
            className="h-[2px] rounded-full overflow-hidden"
            style={{ background: emphasized ? "rgba(255,255,255,0.15)" : "#EEF1F6" }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, progress))}%`,
                height: "100%",
                background: emphasized ? "#BC2F2C" : "#147D5C",
                transition: "width 400ms ease",
              }}
            />
          </div>
        </div>
      )}

      {(delta || sub || secondary) && (
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {delta && (
            <span
              className={cn(
                "text-[11px] font-semibold",
                trend === "down"
                  ? emphasized ? "text-[#F4A4A1]" : "text-juris-red"
                  : emphasized
                    ? "text-[#6FBF90]"
                    : "text-juris-success",
              )}
            >
              {trend === "down" ? "▾" : "▴"} {delta}
            </span>
          )}
          {sub && (
            <span className={cn("text-[11px]", emphasized ? "text-white/60" : "text-juris-ink-4")}>
              {sub}
            </span>
          )}
          {secondary && (
            <span
              className={cn(
                "text-[11px] font-medium",
                emphasized ? "text-[#F4A4A1]" : "text-juris-red",
              )}
            >
              {secondary}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
