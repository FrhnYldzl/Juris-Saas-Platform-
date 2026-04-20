"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Genel Bakış", href: "/portal" },
  { key: "matters", label: "Dosyalarım", href: "/portal?tab=matters" },
  { key: "finance", label: "Faturalar", href: "/portal?tab=finance" },
  { key: "contracts", label: "Sözleşmeler", href: "/portal?tab=contracts" },
  { key: "kvkk", label: "KVKK", href: "/portal?tab=kvkk" },
  { key: "contacts", label: "İletişim", href: "/portal?tab=contacts" },
] as const;

export function PortalTabs({ active }: { active: string }) {
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
