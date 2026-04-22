"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import type { UserRole } from "@prisma/client";

const ROLE_LABEL: Record<UserRole, string> = {
  OWNER: "Kurucu Ortak",
  PARTNER: "Yönetici Ortak",
  ASSOCIATE: "Avukat",
  PARALEGAL: "Paralegal",
  ADMIN_STAFF: "İdari Personel",
  CLIENT: "Müvekkil",
};

/**
 * Sticky top banner shown to OWNER/PARTNER while viewing the app through
 * another role's lens. Click the X to clear the preview cookie and return.
 */
export function PreviewBanner({
  role, realRoleLabel, clientName,
}: {
  role: UserRole;
  realRoleLabel: string;
  clientName?: string | null;
}) {
  const [busy, setBusy] = useState(false);

  const exit = async () => {
    setBusy(true);
    try {
      await fetch("/api/preview-mode", { method: "DELETE" });
      // Full reload so the server layouts see the cookie removal immediately.
      window.location.href = "/command";
    } finally {
      setBusy(false);
    }
  };

  const previewedAs = ROLE_LABEL[role];

  return (
    <div
      className="w-full h-9 flex items-center justify-center gap-4 text-[11.5px] font-semibold sticky top-0 z-50"
      style={{
        background: "linear-gradient(90deg, #BC2F2C 0%, #8A1F1D 100%)",
        color: "white",
      }}
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1.5">
        <Eye size={12} />
        <span>
          <span className="font-bold">{previewedAs}</span> olarak önizleme
          {clientName && role === "CLIENT" && (
            <>
              {" · "}
              <span className="opacity-90">{clientName}</span>
            </>
          )}
        </span>
      </span>
      <span className="hidden md:inline opacity-60">|</span>
      <span className="hidden md:inline opacity-80">
        Gerçek rol: <span className="font-semibold">{realRoleLabel}</span>
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={busy}
        className="inline-flex items-center gap-1 ml-2 pl-3 pr-2 py-0.5 rounded-full transition-colors"
        style={{
          background: "rgba(255,255,255,0.15)",
          opacity: busy ? 0.6 : 1,
        }}
      >
        <span>Normal görünüme dön</span>
        <X size={11} />
      </button>
    </div>
  );
}
