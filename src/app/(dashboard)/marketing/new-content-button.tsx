"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { createEmptyDraft } from "./[id]/actions";

/**
 * Single-click button that creates an empty ContentItem and drops the user
 * directly into the Plan stage of the workflow for it.
 */
export function NewContentButton({
  label = "Yeni akış başlat",
  className,
  style,
  kind = "primary",
}: {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  kind?: "primary" | "ghost" | "accent";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onClick = () => {
    start(async () => {
      const res = await createEmptyDraft();
      if (res.ok) router.push(`/marketing/${res.id}?stage=plan`);
    });
  };

  const stylesByKind: Record<string, React.CSSProperties> = {
    primary: { background: "#0A2240", color: "white", border: "1px solid #0A2240" },
    accent:  { background: "#BC2F2C", color: "white", border: "1px solid #BC2F2C" },
    ghost:   { background: "white", color: "#0A2240", border: "1px solid #E5E9F0" },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12px] font-semibold transition-all disabled:opacity-60 hover:shadow-sm ${className ?? ""}`}
      style={{ ...stylesByKind[kind], ...style }}
    >
      {pending ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
      {pending ? "Oluşturuluyor…" : label}
    </button>
  );
}
