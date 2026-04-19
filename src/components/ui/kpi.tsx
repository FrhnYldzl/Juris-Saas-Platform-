import { cn } from "@/lib/utils";

interface KpiProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down";
  sub?: string;
  suffix?: string;
  emphasized?: boolean;
}

export function Kpi({ label, value, delta, trend, sub, suffix, emphasized }: KpiProps) {
  return (
    <div
      className={cn(
        "rounded-md px-5 py-[18px] flex flex-col gap-1.5 min-h-24",
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
      {(delta || sub) && (
        <div className="flex items-center gap-1.5 mt-0.5">
          {delta && (
            <span
              className={cn(
                "text-[11px] font-semibold",
                trend === "down"
                  ? "text-juris-red"
                  : emphasized
                    ? "text-[#D14844]"
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
        </div>
      )}
    </div>
  );
}
