"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";

export function BillingActions({ hasSub, disabled }: { hasSub: boolean; disabled: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Stripe portalı açılamadı");
      }
    } finally {
      setLoading(null);
    }
  };

  if (disabled) return null;
  if (!hasSub) return null;

  return (
    <button
      type="button"
      onClick={openPortal}
      disabled={loading === "portal"}
      className="btn btn-ghost"
    >
      {loading === "portal" ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
      Stripe&apos;ta Yönet
    </button>
  );
}

export function UpgradeToTier({
  tier, period = "monthly",
}: {
  tier: "STARTER" | "PROFESSIONAL";
  period?: "monthly" | "yearly";
}) {
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, period }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Ödeme başlatılamadı");
        setLoading(false);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ağ hatası");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={loading}
      className="btn btn-primary w-full justify-center"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
      {loading ? "Yönlendiriliyor…" : "Planı Seç"}
    </button>
  );
}
