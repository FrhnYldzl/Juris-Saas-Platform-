"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles, X, Send, Loader2, AlertCircle, Trash2, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIProviderId } from "@/lib/ai/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  provider?: string;
  error?: boolean;
}

interface ProviderOpt {
  id: AIProviderId;
  label: string;
  defaultModel: string;
  available: boolean;
}

const STORAGE_KEY = "juris.ai.chat.v1";

export function AIChatWidget({ providers }: { providers: ProviderOpt[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [provider, setProvider] = useState<AIProviderId>(
    (providers.find((p) => p.available)?.id ?? "anthropic") as AIProviderId,
  );
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const availableProviders = providers.filter((p) => p.available);
  const hasProviders = availableProviders.length > 0;

  // Load persisted messages
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, pending]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || pending || !hasProviders) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Bir hata oluştu" }));
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: err.error ?? "AI isteği başarısız oldu.",
          error: true,
        }]);
      } else {
        const data = await res.json();
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.text,
          model: data.model,
          provider: data.provider,
        }]);
      }
    } catch (e) {
      setMessages((m) => [...m, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: e instanceof Error ? e.message : "Ağ hatası",
        error: true,
      }]);
    } finally {
      setPending(false);
    }
  };

  const clear = () => {
    if (!confirm("Sohbet geçmişini temizlemek istediğinize emin misiniz?")) return;
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const currentProvider = providers.find((p) => p.id === provider);

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full shadow-juris-lg",
          "flex items-center justify-center text-white transition-all",
          "hover:scale-105 active:scale-95",
          open && "opacity-0 pointer-events-none",
        )}
        style={{
          background: "linear-gradient(135deg, #0A2240 0%, #BC2F2C 120%)",
          boxShadow: "0 8px 24px rgba(10,34,64,0.28)",
        }}
        aria-label="Juris Asistan"
      >
        <Sparkles size={22} />
      </button>

      {/* Drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "rgba(10,34,64,0.25)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full sm:w-[440px] h-full flex flex-col shadow-juris-pop animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center gap-3 border-b border-juris-line-2"
              style={{ background: "linear-gradient(180deg, #0A2240, #1a3558)" }}
            >
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center text-white"
                style={{ background: "rgba(188,47,44,0.25)" }}
              >
                <Sparkles size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">Juris Asistan</div>
                <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  {currentProvider?.label ?? "AI"}
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clear}
                  className="text-white/60 hover:text-white p-1.5 rounded hover:bg-white/10"
                  aria-label="Temizle"
                  title="Sohbeti temizle"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white p-1.5 rounded hover:bg-white/10"
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Provider selector */}
            {availableProviders.length > 1 && (
              <div className="px-5 py-2 border-b border-juris-line-2 bg-juris-paper-2 relative">
                <button
                  type="button"
                  onClick={() => setProviderMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-xs text-juris-ink-2 hover:text-juris-navy"
                >
                  <span className="text-juris-ink-3">Model:</span>
                  <span className="font-semibold">{currentProvider?.label}</span>
                  <ChevronDown size={11} className={cn("transition-transform", providerMenuOpen && "rotate-180")} />
                </button>
                {providerMenuOpen && (
                  <div className="absolute left-5 top-full mt-1 bg-white rounded-md border border-juris-line shadow-juris-md overflow-hidden min-w-[220px] z-10">
                    {availableProviders.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProvider(p.id);
                          setProviderMenuOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs hover:bg-juris-paper-2",
                          p.id === provider && "bg-juris-navy-50 text-juris-navy font-semibold",
                        )}
                      >
                        <div>{p.label}</div>
                        <div className="text-[10px] text-juris-ink-4 mono">{p.defaultModel}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
              style={{ background: "var(--bg)" }}
            >
              {!hasProviders ? (
                <div className="flex flex-col items-center text-center py-12 gap-3">
                  <AlertCircle size={28} className="text-juris-warn" />
                  <div>
                    <div className="font-semibold text-juris-navy">AI sağlayıcı yok</div>
                    <p className="text-xs text-juris-ink-3 mt-2 max-w-xs">
                      <code className="mono text-[11px]">ANTHROPIC_API_KEY</code>,{" "}
                      <code className="mono text-[11px]">OPENAI_API_KEY</code> veya{" "}
                      <code className="mono text-[11px]">GOOGLE_AI_API_KEY</code>{" "}
                      Railway Variables&apos;a ekleyin.
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center text-center py-10 gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                    style={{ background: "linear-gradient(135deg, #0A2240, #BC2F2C)" }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-juris-navy">Size nasıl yardımcı olabilirim?</div>
                    <p className="text-xs text-juris-ink-3 mt-2 max-w-xs leading-relaxed">
                      Türk hukuku, mevzuat, dilekçe taslağı, sözleşme analizi…
                      Sorunuzu yazın, Enter&apos;a basın.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2 w-full">
                    {[
                      "Tazminat davası nasıl açılır?",
                      "TBK m.49 özetle",
                      "Sözleşme feshi için gerekli adımlar",
                    ].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setInput(q)}
                        className="text-xs text-juris-ink-2 px-3 py-2 bg-white rounded-md border border-juris-line-2 hover:border-juris-navy-200 hover:bg-juris-paper-2 text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))
              )}
              {pending && (
                <div className="flex items-center gap-2 text-xs text-juris-ink-3">
                  <Loader2 size={14} className="animate-spin" />
                  Düşünüyor…
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-juris-line-2 p-3 bg-white">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  rows={1}
                  disabled={!hasProviders || pending}
                  placeholder={hasProviders ? "Mesajınızı yazın…" : "AI sağlayıcı bağlanmamış"}
                  className="flex-1 resize-none min-h-[40px] max-h-[140px] px-3 py-2 rounded-md border border-juris-line bg-juris-paper text-sm focus:border-juris-red focus:bg-white focus:ring-[3px] focus:ring-juris-red/10 outline-none disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim() || pending || !hasProviders}
                  className="btn btn-primary h-10 px-3"
                  aria-label="Gönder"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="text-[10px] text-juris-ink-4 mt-1.5 text-center">
                AI yanıtları bilgilendirme amaçlıdır, hukuki tavsiye yerine geçmez.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "bg-juris-navy text-white"
            : message.error
              ? "bg-juris-red/10 text-[#8A1F1D] border border-juris-red/20"
              : "bg-white text-juris-ink border border-juris-line-2",
        )}
      >
        {message.content}
        {!isUser && message.model && (
          <div className="text-[10px] opacity-50 mt-1.5 mono">{message.model}</div>
        )}
      </div>
    </div>
  );
}
