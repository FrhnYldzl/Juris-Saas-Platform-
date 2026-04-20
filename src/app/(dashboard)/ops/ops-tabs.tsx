"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS: { key: string; label: string; countKey?: "consulting" | "dispute" }[] = [
  { key: "ozet", label: "Özet" },
  { key: "danismanlik", label: "Danışmanlık", countKey: "consulting" },
  { key: "uyusmazlik", label: "Uyuşmazlık", countKey: "dispute" },
];

export function OpsTabs({
  active, counts,
}: {
  active: string;
  counts?: { consulting: number; dispute: number };
}) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-md p-[3px]"
      style={{ background: "white", border: "1px solid #E5E9F0" }}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        const href = t.key === "ozet" ? "/ops" : `/ops?tab=${t.key}`;
        const count = t.countKey && counts ? counts[t.countKey] : undefined;
        return (
          <Link
            key={t.key}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[4px] transition-all",
            )}
            style={{
              background: isActive ? "#0A2240" : "transparent",
              color: isActive ? "white" : "#5A6B82",
            }}
          >
            {t.label}
            {count != null && (
              <span
                className="mono text-[10px]"
                style={{
                  opacity: isActive ? 0.75 : 0.55,
                }}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
