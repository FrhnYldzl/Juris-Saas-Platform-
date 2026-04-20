"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "ozet", label: "Özet" },
  { key: "nakit", label: "Nakit" },
  { key: "gelirgider", label: "Gelir-Gider" },
  { key: "tahsilat", label: "Tahsilat" },
  { key: "faturalar", label: "Faturalar" },
] as const;

export function FinanceTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 border-b border-juris-line mb-6 overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.key === "ozet" ? "/finance" : `/finance?tab=${t.key}`}
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
