"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTimeTR } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  readAt: string | null;
  createdAt: string;
  isMe: boolean;
}

export function MessagesPanel({
  matterId, title = "Mesajlar", subtitle,
  emptyLabel = "Henüz mesaj yok. İlk mesajı yazın.",
}: {
  matterId: string;
  title?: string;
  subtitle?: string;
  emptyLabel?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/matters/${matterId}/messages`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Mesajlar yüklenemedi");
      } else {
        setMessages(data.messages);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ağ hatası");
    } finally {
      setLoading(false);
    }
  };

  // Initial load + polling
  useEffect(() => {
    load();
    const int = setInterval(load, 15000); // 15s poll
    return () => clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterId]);

  // Auto-scroll on new
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/matters/${matterId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gönderilemedi");
      } else {
        setMessages((m) => [...m, data.message]);
        setDraft("");
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ağ hatası");
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="card overflow-hidden flex flex-col" style={{ minHeight: 420, maxHeight: 620 }}>
      <div className="px-6 py-4 border-b border-juris-line-2 flex-shrink-0">
        <h3 className="display text-lg text-juris-navy">{title}</h3>
        <div className="text-xs text-juris-ink-3 mt-0.5">
          {subtitle ?? `${messages.length} mesaj`}
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
        style={{ background: "var(--bg-sunken)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-juris-ink-3 gap-2">
            <Loader2 size={14} className="animate-spin" /> Yükleniyor…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <MessageSquare size={24} className="text-juris-ink-4 mb-2" />
            <div className="text-sm text-juris-ink-3">{emptyLabel}</div>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const showAuthor = !prev || prev.senderId !== m.senderId || (
              new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000
            );
            return (
              <div key={m.id} className={cn("flex gap-2", m.isMe ? "justify-end" : "justify-start")}>
                {!m.isMe && showAuthor && (
                  <Avatar name={m.senderName} size={28} />
                )}
                {!m.isMe && !showAuthor && <div style={{ width: 28 }} />}
                <div className={cn("max-w-[75%] flex flex-col", m.isMe && "items-end")}>
                  {showAuthor && (
                    <div className="text-[10px] text-juris-ink-4 mb-1 px-1">
                      {m.isMe ? "Siz" : m.senderName}
                      {m.senderRole === "CLIENT" && (
                        <span className="ml-1.5 chip" style={{ height: 14, fontSize: 9, padding: "0 5px" }}>
                          Müvekkil
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-xl px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed",
                      m.isMe
                        ? "bg-juris-navy text-white rounded-br-sm"
                        : "bg-white text-juris-ink border border-juris-line-2 rounded-bl-sm",
                    )}
                  >
                    {m.body}
                  </div>
                  <div className="text-[10px] text-juris-ink-4 mt-0.5 px-1">
                    {formatDateTimeTR(m.createdAt)}
                    {m.isMe && m.readAt && <span className="ml-1.5">· Okundu</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs px-3 py-2 bg-juris-red/5 border border-juris-red/20 rounded-md text-[#8A1F1D]">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-juris-line-2 p-3 bg-white flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Mesajınızı yazın… (Enter gönder, Shift+Enter yeni satır)"
            disabled={sending}
            className="flex-1 resize-none min-h-[40px] max-h-[120px] px-3 py-2 rounded-md border border-juris-line bg-juris-paper text-sm focus:border-juris-red focus:bg-white focus:ring-[3px] focus:ring-juris-red/10 outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || sending}
            className="btn btn-primary h-10 px-3"
            aria-label="Gönder"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
