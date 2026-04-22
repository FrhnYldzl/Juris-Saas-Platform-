"use client";

import { useState } from "react";
import { ChevronDown, Eye, User, Briefcase, Crown, Shield, UserCog } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

const ROLE_META: Record<UserRole, { label: string; short: string; icon: typeof Crown; hint: string }> = {
  OWNER:       { label: "Kurucu Ortak",    short: "Ortak",    icon: Crown,     hint: "Tam yetki" },
  PARTNER:     { label: "Yönetici Ortak",  short: "Ortak",    icon: Crown,     hint: "Neredeyse tam yetki" },
  ASSOCIATE:   { label: "Avukat",           short: "Avukat",   icon: Briefcase, hint: "Dosya + fatura" },
  PARALEGAL:   { label: "Paralegal",        short: "Stajyer",  icon: UserCog,   hint: "Okuma + belge" },
  ADMIN_STAFF: { label: "İdari Personel",   short: "İdari",    icon: Shield,    hint: "Finans + ekip" },
  CLIENT:      { label: "Müvekkil",          short: "Müvekkil", icon: User,      hint: "Sadece kendi dosyaları" },
};

const PREVIEWABLE_ROLES: UserRole[] = ["ASSOCIATE", "PARALEGAL", "ADMIN_STAFF", "CLIENT"];

/**
 * Topbar role preview switcher (OWNER / PARTNER only).
 *
 * Real behavior: POSTs to /api/preview-mode which sets a cookie. The page
 * then reloads so the server-side layouts pick up the new effective role.
 * For CLIENT preview, we reload straight to /portal.
 */
export function RoleSwitcher({ currentRole }: { currentRole: UserRole }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Only OWNER / PARTNER can use this
  if (currentRole !== "OWNER" && currentRole !== "PARTNER") return null;

  const currentMeta = ROLE_META[currentRole];
  const CurrentIcon = currentMeta.icon;

  const applyPreview = async (role: UserRole) => {
    if (busy) return;
    setBusy(true);
    setOpen(false);
    try {
      const res = await fetch("/api/preview-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("preview post failed");
      // Full reload — server layouts need to re-read the cookie.
      // CLIENT preview redirects into /portal; staff previews stay on /command.
      window.location.href = role === "CLIENT" ? "/portal" : "/command";
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all",
        )}
        style={{
          background: "#BC2F2C",
          color: "white",
          border: "1px solid #BC2F2C",
          opacity: busy ? 0.6 : 1,
        }}
        aria-label="Rol önizlemesi"
      >
        <CurrentIcon size={12} />
        <span>{currentMeta.short}</span>
        <ChevronDown
          size={11}
          className={cn("transition-transform opacity-80", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-juris-lg border border-juris-line z-30 overflow-hidden">
            <div className="px-4 py-3 border-b border-juris-line-2 bg-juris-paper-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye size={11} className="text-juris-red" />
                <div className="label text-[9px]">Rol Önizleme</div>
              </div>
              <div className="text-[11px] text-juris-ink-3 leading-relaxed">
                Başka bir rol olarak platforma bak. Kapatmak için üstte beliren kırmızı şeritten
                <strong className="text-juris-navy"> &ldquo;Normal görünüme dön&rdquo;</strong>a tıkla.
              </div>
            </div>

            <div className="py-1">
              {/* Real role row — non-clickable */}
              <div className="w-full flex items-center gap-2.5 px-3 py-2 bg-white">
                <CurrentIcon size={14} className="text-juris-ink-3" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-juris-ink-2">
                    {currentMeta.label}
                    <span className="ml-1.5 text-[10px] text-juris-ink-4 font-normal">(gerçek rolün)</span>
                  </div>
                  <div className="text-[10px] text-juris-ink-4">{currentMeta.hint}</div>
                </div>
              </div>

              <div className="my-1 h-px bg-juris-line-2 mx-3" />

              {PREVIEWABLE_ROLES.map((r) => (
                <PreviewItem
                  key={r}
                  role={r}
                  onClick={() => applyPreview(r)}
                  disabled={busy}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PreviewItem({
  role, onClick, disabled,
}: {
  role: UserRole;
  onClick: () => void;
  disabled: boolean;
}) {
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  const isClient = role === "CLIENT";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-juris-paper-2 transition-colors",
        disabled && "opacity-50",
      )}
    >
      <Icon size={14} className={isClient ? "text-juris-red" : "text-juris-ink-3"} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-juris-ink-2">
          {meta.label}
          {isClient && (
            <span
              className="ml-1.5 inline-flex items-center px-1.5 py-px rounded text-[9px] font-semibold"
              style={{ background: "rgba(188,47,44,0.1)", color: "#BC2F2C" }}
            >
              Portal
            </span>
          )}
        </div>
        <div className="text-[10px] text-juris-ink-4">{meta.hint}</div>
      </div>
      <span className="text-[10px] text-juris-ink-4 mono">Önizle →</span>
    </button>
  );
}
