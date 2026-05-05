"use client";

import { useTransition } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { revokeApiKey } from "./actions";

export function RevokeButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const onClick = () => {
    if (!confirm(`"${name}" anahtarını iptal et? Bu işlem geri alınamaz, anahtar bir daha çalışmaz.`)) return;
    start(async () => {
      const res = await revokeApiKey(id);
      if (!res.ok) alert(res.error ?? "Bir hata oluştu");
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-juris-red hover:bg-juris-paper-2 transition-colors disabled:opacity-60"
      style={{ border: "1px solid #BC2F2C33" }}
    >
      {pending ? <RefreshCw size={10} className="animate-spin" /> : <Trash2 size={10} />}
      İptal Et
    </button>
  );
}
