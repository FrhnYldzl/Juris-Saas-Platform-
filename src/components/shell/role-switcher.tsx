"use client";

import { useState } from "react";
import { ChevronDown, Eye, User, Briefcase, Crown, Shield, UserCog } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

const ROLE_META: Record<UserRole, { label: string; short: string; icon: typeof Crown; hint: string }> = {
  OWNER: { label: "Kurucu Ortak", short: "Ortak", icon: Crown, hint: "Tam yetki" },
  PARTNER: { label: "Yönetici Ortak", short: "Ortak", icon: Crown, hint: "Neredeyse tam yetki" },
  ASSOCIATE: { label: "Avukat", short: "Avukat", icon: Briefcase, hint: "Dosya + fatura" },
  PARALEGAL: { label: "Paralegal", short: "Stajyer", icon: UserCog, hint: "Okuma + belge" },
  ADMIN_STAFF: { label: "İdari Personel", short: "İdari", icon: Shield, hint: "Finans + ekip" },
  CLIENT: { label: "Müvekkil", short: "Müvekkil", icon: User, hint: "Sadece kendi dosyaları" },
};

/**
 * Topbar role preview switcher (OWNER / PARTNER only).
 *
 * Görsel önizleme — sadece UI'a etki eder, sunucu yetkileri değişmez.
 * Önizleme modundayken `?preview_role=ASSOCIATE` query parametresi gibi
 * bir mekanizma ile RBAC'ı client tarafında kısıtlayabiliriz (v0.9).
 * Şimdilik gerçek rol her yerde geçerli; switcher sadece nav/module
 * görünürlüğünü önizlemek için bir ipucu rozeti gösterir.
 */
export function RoleSwitcher({
  currentRole,
}: {
  currentRole: UserRole;
}) {
  const [open, setOpen] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  // Only OWNER / PARTNER can use this
  if (currentRole !== "OWNER" && currentRole !== "PARTNER") return null;

  const activeRole = previewRole ?? currentRole;
  const ActiveIcon = ROLE_META[activeRole].icon;

  const applyPreview = (role: UserRole | null) => {
    setPreviewRole(role);
    setOpen(false);
    if (typeof document !== "undefined") {
      if (role) {
        document.body.setAttribute("data-preview-role", role);
      } else {
        document.body.removeAttribute("data-preview-role");
      }
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all",
        )}
        style={
          previewRole
            ? {
                background: "rgba(188,47,44,0.08)",
                color: "#BC2F2C",
                border: "1px solid rgba(188,47,44,0.3)",
              }
            : {
                background: "#BC2F2C",
                color: "white",
                border: "1px solid #BC2F2C",
              }
        }
        aria-label="Rol"
      >
        {previewRole ? <Eye size={12} /> : <ActiveIcon size={12} />}
        <span>
          {previewRole ? ROLE_META[activeRole].short : ROLE_META[currentRole].short}
        </span>
        <ChevronDown
          size={11}
          className={cn("transition-transform opacity-80", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-juris-lg border border-juris-line z-30 overflow-hidden">
            <div className="px-4 py-3 border-b border-juris-line-2 bg-juris-paper-2">
              <div className="label text-[9px]">Rol Önizleme</div>
              <div className="text-xs text-juris-ink-3 mt-1 leading-relaxed">
                Sadece kendi görünümünüzü değiştirir; RBAC sunucu tarafında değişmez.
              </div>
            </div>
            <div className="py-1">
              <RoleItem
                role={currentRole}
                active={previewRole === null}
                isReal
                onClick={() => applyPreview(null)}
              />
              <div className="my-1 h-px bg-juris-line-2 mx-3" />
              {(Object.keys(ROLE_META) as UserRole[])
                .filter((r) => r !== currentRole)
                .map((r) => (
                  <RoleItem
                    key={r}
                    role={r}
                    active={previewRole === r}
                    onClick={() => applyPreview(r)}
                  />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RoleItem({
  role, active, isReal, onClick,
}: {
  role: UserRole;
  active: boolean;
  isReal?: boolean;
  onClick: () => void;
}) {
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-juris-paper-2 transition-colors",
        active && "bg-juris-paper-2",
      )}
    >
      <Icon size={14} className={active ? "text-juris-red" : "text-juris-ink-3"} />
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-medium", active ? "text-juris-navy" : "text-juris-ink-2")}>
          {meta.label}
          {isReal && <span className="ml-1.5 text-[10px] text-juris-ink-4 font-normal">(gerçek rolün)</span>}
        </div>
        <div className="text-[10px] text-juris-ink-4">{meta.hint}</div>
      </div>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-juris-red" />}
    </button>
  );
}
