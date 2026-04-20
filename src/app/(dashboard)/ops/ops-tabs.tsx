"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "ozet", label: "Özet" },
  { key: "danismanlik", label: "Danışmanlık" },
  { key: "dava", label: "Dava" },
  { key: "tumu", label: "Tümü" },
] as const;

export function OpsTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 overflow-x-auto">
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.key === "ozet" ? "/ops" : `/ops?tab=${t.key}`}
            className={cn(
              "relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              isActive ? "text-juris-navy" : "text-juris-ink-3 hover:text-juris-navy",
            )}
          >
            {t.label}
            {isActive && (
              <span
                className="absolute inset-x-3 bottom-0 h-[2px] rounded-t"
                style={{ background: "#BC2F2C" }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
