"use client";

import Link from "next/link";

const TABS = [
  { key: "nabiz",       label: "Özet & Nabız" },
  { key: "nakit",       label: "Nakit Akış" },
  { key: "gelirgider",  label: "Gelir & Gider" },
  { key: "danismanlik", label: "Danışmanlıklar" },
  { key: "tahsilat",    label: "Tahsilat & Vade" },
] as const;

export function FinanceTabs({ active }: { active: string }) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-md p-[3px] mb-6"
      style={{ background: "white", border: "1px solid #E5E9F0" }}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.key === "nabiz" ? "/finance" : `/finance?tab=${t.key}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold rounded-[4px] transition-all"
            style={{
              background: isActive ? "#0A2240" : "transparent",
              color: isActive ? "white" : "#5A6B82",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
