"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function CommandModeToggle({ mode }: { mode: "focus" | "goals" }) {
  return (
    <div className="inline-flex gap-0.5 bg-white border border-juris-line rounded p-0.5">
      {([
        { id: "focus" as const, label: "Stratejik Odak" },
        { id: "goals" as const, label: "Hedefler" },
      ]).map((m) => (
        <Link
          key={m.id}
          href={m.id === "focus" ? "/command" : "/command?mode=goals"}
          className={cn(
            "px-3.5 py-1.5 text-xs font-semibold rounded-sm transition-colors",
            mode === m.id
              ? "bg-juris-navy text-white"
              : "text-juris-ink-3 hover:text-juris-navy",
          )}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}
