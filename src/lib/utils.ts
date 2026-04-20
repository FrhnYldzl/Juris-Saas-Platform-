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

/**
 * Relative date in Turkish — "Bugün", "Yarın", "3 gün", "1 hafta", "25 Mar" fallback.
 */
export function formatRelativeTR(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) {
    // Today — include hour if not midnight
    const hh = d.getHours();
    const mm = d.getMinutes();
    if (hh !== 0 || mm !== 0) {
      return `Bugün ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    }
    return "Bugün";
  }
  if (diffDays === 1) return "Yarın";
  if (diffDays === -1) return "Dün";
  if (diffDays > 1 && diffDays <= 6) return `${diffDays} gün`;
  if (diffDays === 7) return "1 hafta";
  if (diffDays > 7 && diffDays <= 14) return `${Math.round(diffDays / 7)} hafta`;
  if (diffDays < 0 && diffDays >= -6) return `${Math.abs(diffDays)} gün önce`;
  return formatDateTR(d);
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
