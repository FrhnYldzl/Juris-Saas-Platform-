"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { X } from "lucide-react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "error" | "warn";
}

interface ToastCtx {
  toast: (t: Omit<Toast, "id">) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card pointer-events-auto min-w-[280px] max-w-[400px] p-4 shadow-juris-lg animate-slideIn"
            style={{
              borderLeft:
                t.tone === "success" ? "3px solid var(--success)"
                : t.tone === "error" ? "3px solid var(--juris-red)"
                : t.tone === "warn" ? "3px solid var(--warn)"
                : "3px solid var(--juris-navy)",
            }}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-juris-navy">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-juris-ink-3 mt-1">{t.description}</div>
                )}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-juris-ink-4 hover:text-juris-navy"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
