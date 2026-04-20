"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutGrid, BarChart3, List } from "lucide-react";

export function ViewToggle({ active }: { active: "kanban" | "huni" | "liste" }) {
  const opts: { key: "kanban" | "huni" | "liste"; label: string; icon: typeof LayoutGrid }[] = [
    { key: "kanban", label: "Kanban", icon: LayoutGrid },
    { key: "huni", label: "Huni Görsel", icon: BarChart3 },
    { key: "liste", label: "Liste", icon: List },
  ];
  return (
    <div
      className="inline-flex gap-0.5 rounded-md p-[3px]"
      style={{ background: "white", border: "1px solid #E5E9F0" }}
    >
      {opts.map((o) => {
        const isActive = o.key === active;
        return (
          <Link
            key={o.key}
            href={o.key === "kanban" ? "/sales" : `/sales?view=${o.key}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold rounded-[4px] transition-all"
            style={{
              background: isActive ? "#0A2240" : "transparent",
              color: isActive ? "white" : "#5A6B82",
            }}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

export function AssigneeChips({
  active, names, view,
}: {
  active: string;
  names: string[];
  view: string;
}) {
  const allHref = `/sales${view !== "kanban" ? `?view=${view}` : ""}`;
  const link = (name: string) =>
    `/sales?${view !== "kanban" ? `view=${view}&` : ""}assignee=${encodeURIComponent(name)}`;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] text-juris-ink-3 font-semibold mr-1">Sorumlu:</span>
      <Link
        href={allHref}
        className="inline-flex items-center px-3 h-7 rounded-full text-[11px] font-semibold transition-all"
        style={{
          background: active === "all" ? "#0A2240" : "transparent",
          color: active === "all" ? "white" : "#5A6B82",
          border: `1px solid ${active === "all" ? "#0A2240" : "#E5E9F0"}`,
        }}
      >
        Tümü
      </Link>
      {names.map((n) => {
        const isActive = active === n;
        return (
          <Link
            key={n}
            href={link(n)}
            className="inline-flex items-center px-3 h-7 rounded-full text-[11px] font-semibold transition-all"
            style={{
              background: isActive ? "#0A2240" : "white",
              color: isActive ? "white" : "#5A6B82",
              border: `1px solid ${isActive ? "#0A2240" : "#E5E9F0"}`,
            }}
          >
            {n}
          </Link>
        );
      })}
    </div>
  );
}
