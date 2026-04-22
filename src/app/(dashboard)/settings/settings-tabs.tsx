"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type SettingsTabKey = "firma" | "markalasma" | "bildirimler" | "abonelik" | "denetim" | "veri";

const TABS: Array<{ key: SettingsTabKey; label: string; href: string }> = [
  { key: "firma",        label: "Firma",        href: "/settings" },
  { key: "markalasma",   label: "Markalaşma",   href: "/settings?tab=markalasma" },
  { key: "bildirimler",  label: "Bildirimler",  href: "/settings?tab=bildirimler" },
  { key: "abonelik",     label: "Abonelik",     href: "/settings/billing" },
  { key: "denetim",      label: "Denetim",      href: "/settings/audit" },
  { key: "veri",         label: "Veri & KVKK",  href: "/settings?tab=veri" },
];

export function SettingsTabs({ active }: { active: SettingsTabKey }) {
  return (
    <div className="flex gap-1 border-b border-juris-line mb-6 overflow-x-auto -mx-2 px-2">
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
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
