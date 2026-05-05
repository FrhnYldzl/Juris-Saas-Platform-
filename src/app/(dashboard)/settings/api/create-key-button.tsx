"use client";

import { useActionState, useState } from "react";
import { Plus, Copy, CheckCircle2, AlertCircle, X, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { createApiKey, type CreateKeyResult } from "./actions";

const SCOPE_GROUPS: Array<{ label: string; items: Array<{ scope: string; hint: string }> }> = [
  {
    label: "Lead",
    items: [
      { scope: "lead:read",  hint: "Lead listele + tekil okuma" },
      { scope: "lead:write", hint: "Yeni lead oluştur (S&M kampanyalarından)" },
    ],
  },
  {
    label: "Content",
    items: [
      { scope: "content:read",  hint: "İçerikleri listele + oku" },
      { scope: "content:draft", hint: "Yalnızca DRAFT/IDEA oluştur ve düzenle" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { scope: "analytics:read", hint: "MQL stat + funnel analizi" },
    ],
  },
  {
    label: "Campaign",
    items: [
      { scope: "campaign:read",  hint: "UTM kampanyaları listele" },
      { scope: "campaign:write", hint: "Yeni UTM kampanyası kaydet" },
    ],
  },
];

const ALL_SCOPES = SCOPE_GROUPS.flatMap((g) => g.items.map((i) => i.scope));

export function CreateKeyButton() {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const [state, action, pending] = useActionState<CreateKeyResult | null, FormData>(
    createApiKey,
    null,
  );

  const close = () => {
    setOpen(false);
    setRevealed(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12px] font-semibold text-white"
        style={{ background: "#BC2F2C" }}
      >
        <Plus size={12} /> Yeni API Anahtarı
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] px-4"
          style={{ background: "rgba(10,34,64,0.45)", backdropFilter: "blur(4px)" }}
          onClick={close}
        >
          <div
            className="w-full max-w-[640px] bg-white rounded-xl shadow-juris-lg overflow-hidden"
            style={{ border: "1px solid #E5E9F0" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EEF1F5" }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ background: "rgba(188,47,44,0.1)", color: "#BC2F2C" }}
                >
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-juris-navy leading-tight">
                    Yeni API Anahtarı
                  </h3>
                  <p className="text-[11px] text-juris-ink-3 mt-0.5">
                    Paperclip integration için scope-based key
                  </p>
                </div>
              </div>
              <button onClick={close} className="text-juris-ink-3 hover:text-juris-navy p-1">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            {state?.ok ? (
              <KeyRevealCard
                plaintext={state.key.plaintext}
                name={state.key.name}
                scopes={state.key.scopes}
                revealed={revealed}
                onToggleReveal={() => setRevealed(!revealed)}
                onClose={close}
              />
            ) : (
              <form action={action} className="px-6 py-5 flex flex-col gap-5">
                {state && !state.ok && (
                  <div
                    className="rounded-md p-3 text-[12px] flex items-start gap-2"
                    style={{ background: "rgba(188,47,44,0.08)", color: "#BC2F2C", border: "1px solid #BC2F2C33" }}
                  >
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    <span className="font-medium">{state.error}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
                    Anahtar Adı *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Paperclip Production"
                    className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none"
                    style={{ border: "1px solid #E5E9F0" }}
                  />
                  <div className="text-[10px] text-juris-ink-4 mt-1">
                    Sadece tanımlama amaçlı — gerçek anahtar bu isim olmayacak.
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
                    Servis
                  </label>
                  <select
                    name="service"
                    defaultValue="paperclip"
                    className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none"
                    style={{ border: "1px solid #E5E9F0" }}
                  >
                    <option value="paperclip">Paperclip (S&M API)</option>
                    <option value="custom">Custom integration</option>
                  </select>
                </div>

                <div>
                  <div className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-2 block">
                    Yetki Kapsamı (Scopes)
                  </div>
                  <div className="flex flex-col gap-3">
                    {SCOPE_GROUPS.map((g) => (
                      <div key={g.label}>
                        <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-1.5">
                          {g.label}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {g.items.map((s) => (
                            <label
                              key={s.scope}
                              className="flex items-start gap-2 cursor-pointer hover:bg-juris-paper-2 -mx-1 px-1 py-1 rounded"
                            >
                              <input
                                type="checkbox"
                                name="scopes"
                                value={s.scope}
                                defaultChecked
                                className="w-3.5 h-3.5 rounded shrink-0 accent-juris-navy mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="mono text-[11.5px] font-semibold text-juris-navy">{s.scope}</div>
                                <div className="text-[10.5px] text-juris-ink-3 leading-snug">{s.hint}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
                    Geçerlilik Süresi
                  </label>
                  <select
                    name="expiresInDays"
                    defaultValue=""
                    className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none"
                    style={{ border: "1px solid #E5E9F0" }}
                  >
                    <option value="">Süresiz (önerilmez)</option>
                    <option value="30">30 gün</option>
                    <option value="90">90 gün (önerilen)</option>
                    <option value="180">6 ay</option>
                    <option value="365">1 yıl</option>
                  </select>
                  <div className="text-[10px] text-juris-ink-4 mt-1">
                    Süresi dolan anahtarlar otomatik geçersiz olur. Önerilen: 90 günlük rotasyon.
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3" style={{ borderTop: "1px solid #EEF1F5" }}>
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex items-center px-3.5 py-2 rounded-md text-[12px] font-semibold text-juris-ink-2 hover:bg-juris-paper-2"
                    style={{ border: "1px solid #E5E9F0" }}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white disabled:opacity-60"
                    style={{ background: "#0A2240" }}
                  >
                    {pending ? "Üretiliyor…" : "Anahtarı Üret"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function KeyRevealCard({
  plaintext, name, scopes, revealed, onToggleReveal, onClose,
}: {
  plaintext: string;
  name: string;
  scopes: string[];
  revealed: boolean;
  onToggleReveal: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const masked = plaintext.slice(0, 12) + "•".repeat(plaintext.length - 16) + plaintext.slice(-4);

  return (
    <div className="px-6 py-5 flex flex-col gap-4">
      <div
        className="rounded-md p-3 flex items-start gap-2.5"
        style={{ background: "rgba(31,122,78,0.08)", color: "#1F7A4E", border: "1px solid #1F7A4E33" }}
      >
        <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
        <div>
          <div className="text-[12.5px] font-semibold">Anahtar oluşturuldu — bu tek görüntüleme</div>
          <div className="text-[11.5px] opacity-90 mt-0.5 leading-relaxed">
            Bu pencereyi kapattıktan sonra anahtar bir daha gösterilemez. Kopyala ve güvenli bir yerde sakla.
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 text-[10px] text-juris-ink-3 uppercase tracking-wider font-semibold">
          <span>{name}</span>
          <button
            type="button"
            onClick={onToggleReveal}
            className="inline-flex items-center gap-1 text-juris-ink-3 hover:text-juris-navy normal-case tracking-normal text-[11px]"
          >
            {revealed ? <EyeOff size={10} /> : <Eye size={10} />}
            {revealed ? "Gizle" : "Göster"}
          </button>
        </div>
        <div
          className="rounded-md p-3 mono text-[12.5px] text-juris-navy break-all select-all"
          style={{
            background: "#FAFBFD",
            border: "1px solid #E5E9F0",
            letterSpacing: revealed ? "0.04em" : "0.1em",
          }}
        >
          {revealed ? plaintext : masked}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold text-white"
          style={{ background: "#0A2240" }}
        >
          {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
          {copied ? "Kopyalandı" : "Anahtarı Kopyala"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {scopes.map((s) => (
          <span
            key={s}
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold mono"
            style={{ background: "#F1F4F8", color: "#5A6B82" }}
          >
            {s}
          </span>
        ))}
      </div>

      <div className="flex justify-end pt-3" style={{ borderTop: "1px solid #EEF1F5" }}>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center px-4 py-2 rounded-md text-[12px] font-semibold text-juris-ink-2 hover:bg-juris-paper-2"
          style={{ border: "1px solid #E5E9F0" }}
        >
          Kopyaladım, kapat
        </button>
      </div>

      <input type="hidden" data-all-scopes={ALL_SCOPES.join(",")} />
    </div>
  );
}
