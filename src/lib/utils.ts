import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTRY(value: number | string | null | undefined, opts?: { short?: boolean }) {
  if (value == null) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return "—";
  if (opts?.short && Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M ₺`;
  }
  if (opts?.short && Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}K ₺`;
  }
  return `${num.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`;
}

export function formatDateTR(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTimeTR(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}
