"use client";

import Link from "next/link";
import { LayoutGrid, Calendar, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TABS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "ozet",   label: "Özet",             icon: LayoutGrid },
  { key: "plan",   label: "Ay Planı",         icon: Calendar },
  { key: "icerik", label: "İçerik Stüdyosu",  icon: Sparkles },
  { key: "trafik", label: "Trafik Stüdyosu",  icon: Users },
];

export function MarketingTabs({ active }: { active: string }) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-md p-[3px]"
      style={{ background: "white", border: "1px solid #E5E9F0" }}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        const href = t.key === "ozet" ? "/marketing" : `/marketing?tab=${t.key}`;
        const Icon = t.icon;
        return (
          <Link
            key={t.key}
            href={href}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[4px] transition-all"
            style={{
              background: isActive ? "#0A2240" : "transparent",
              color: isActive ? "white" : "#5A6B82",
            }}
          >
            <Icon size={12} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
