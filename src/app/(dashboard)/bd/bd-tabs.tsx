"use client";

import Link from "next/link";
import { Users, Calendar, Share2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const TABS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "kaynaklar", label: "Kaynaklar", icon: LayoutGrid },
  { key: "kisiler", label: "Kişiler", icon: Users },
  { key: "etkinlikler", label: "Etkinlikler", icon: Calendar },
  { key: "harita", label: "İlişki Haritası", icon: Share2 },
];

export function BdSubTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {TABS.map((t) => {
        const isActive = t.key === active;
        const Icon = t.icon;
        const href = t.key === "kaynaklar" ? "/bd" : `/bd?tab=${t.key}`;
        return (
          <Link
            key={t.key}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-md transition-all",
            )}
            style={{
              background: isActive ? "#0A2240" : "transparent",
              color: isActive ? "white" : "#5A6B82",
              border: `1px solid ${isActive ? "#0A2240" : "transparent"}`,
            }}
          >
            <Icon size={13} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export function ResourceFilterChips({
  active, counts,
}: {
  active: "all" | "company" | "partner" | "network";
  counts: { all: number; company: number; partner: number; network: number };
}) {
  const opts: { key: "all" | "company" | "partner" | "network"; label: string; dot: string; count: number }[] = [
    { key: "all", label: "Tümü", dot: "#0A2240", count: counts.all },
    { key: "company", label: "İlişkili Şirket", dot: "#0A2240", count: counts.company },
    { key: "partner", label: "Direkt Partner", dot: "#BC2F2C", count: counts.partner },
    { key: "network", label: "Network / Dernek", dot: "#2B5185", count: counts.network },
  ];
  return (
    <div className="flex gap-1.5 flex-wrap">
      {opts.map((o) => {
        const isActive = o.key === active;
        const href = o.key === "all" ? "/bd" : `/bd?type=${o.key}`;
        return (
          <Link
            key={o.key}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-all",
            )}
            style={{
              background: isActive ? "#0A2240" : "white",
              color: isActive ? "white" : "#5A6B82",
              border: `1px solid ${isActive ? "#0A2240" : "#E5E9F0"}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isActive ? "white" : o.dot }}
            />
            {o.label}
            <span className="text-[10px] opacity-80 mono">{o.count}</span>
          </Link>
        );
      })}
    </div>
  );
}
