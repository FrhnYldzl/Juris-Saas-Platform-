"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Command, X,
  LayoutDashboard, TrendingUp, FolderKanban, Megaphone,
  DollarSign, Wallet, Users, Settings, Plug, Sparkles,
  Briefcase, Receipt, User as UserIcon, Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Result = {
  module: "matter" | "lead" | "invoice" | "contact" | "resource";
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  badge?: string;
};

const QUICK_JUMPS: Array<{
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: typeof LayoutDashboard;
  group: "Modüller" | "Araçlar" | "Firma";
}> = [
  { id: "command",      label: "Stratejik Odak",      hint: "Günün özeti",        href: "/command",         icon: LayoutDashboard, group: "Modüller" },
  { id: "bd",           label: "İş Geliştirme",        hint: "Network yönetimi",   href: "/bd",              icon: TrendingUp,      group: "Modüller" },
  { id: "ops",          label: "Operasyonlar",         hint: "Dosyalar + uyuşmazlık", href: "/ops",           icon: FolderKanban,    group: "Modüller" },
  { id: "marketing",    label: "Pazarlama",            hint: "İçerik + SEO",       href: "/marketing",       icon: Megaphone,       group: "Modüller" },
  { id: "sales",        label: "Satış",                hint: "Pipeline + teklif",  href: "/sales",           icon: DollarSign,      group: "Modüller" },
  { id: "finance",      label: "Finans",               hint: "Tahsilat + nakit",   href: "/finance",         icon: Wallet,          group: "Modüller" },
  { id: "ai-petition",  label: "AI Dilekçe Taslağı",   hint: "Dilekçe üret",       href: "/ai/petition",     icon: Sparkles,        group: "Araçlar" },
  { id: "people",       label: "Ekip",                 hint: "Kullanıcılar + roller", href: "/people",       icon: Users,           group: "Firma" },
  { id: "integrations", label: "Entegrasyonlar",       hint: "UYAP, GİB, Drive…",  href: "/integrations",    icon: Plug,            group: "Firma" },
  { id: "settings",     label: "Ayarlar",              hint: "Firma + billing",    href: "/settings",        icon: Settings,        group: "Firma" },
];

const MODULE_META: Record<Result["module"], { icon: typeof Briefcase; label: string; color: string }> = {
  matter:   { icon: Briefcase, label: "Dosya",     color: "#0A2240" },
  lead:     { icon: DollarSign,label: "Lead",      color: "#B4701C" },
  invoice:  { icon: Receipt,   label: "Fatura",    color: "#1F7A4E" },
  contact:  { icon: UserIcon,  label: "Kişi",      color: "#1F5AA8" },
  resource: { icon: Network,   label: "Kaynak",    color: "#BC2F2C" },
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener — ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 20);
      setActiveIndex(0);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results ?? []);
        setActiveIndex(0);
      } catch {
        /* cancelled or failed */
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  // Build the rendered item list so arrow keys can walk it
  const filteredJumps = query.trim().length < 2
    ? QUICK_JUMPS
    : QUICK_JUMPS.filter((j) => j.label.toLowerCase().includes(query.trim().toLowerCase())
                             || j.hint.toLowerCase().includes(query.trim().toLowerCase()));

  const allItems = [
    ...filteredJumps.map((j) => ({ kind: "jump" as const, item: j })),
    ...results.map((r) => ({ kind: "result" as const, item: r })),
  ];

  const handleNav = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = allItems[activeIndex];
      if (hit) handleNav(hit.item.href);
    }
  };

  if (!open) return null;

  // Group jumps by their `group` field
  const jumpGroups = new Map<string, typeof QUICK_JUMPS>();
  for (const { item } of allItems.filter((x) => x.kind === "jump") as Array<{ kind: "jump"; item: typeof QUICK_JUMPS[number] }>) {
    const arr = jumpGroups.get(item.group) ?? [];
    arr.push(item);
    jumpGroups.set(item.group, arr);
  }

  // Walk allItems to compute a global index for arrow navigation
  let itemIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: "rgba(10,34,64,0.35)", backdropFilter: "blur(4px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[640px] bg-white rounded-xl shadow-juris-lg overflow-hidden flex flex-col"
        style={{ maxHeight: "70vh", border: "1px solid #E5E9F0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: "1px solid #EEF1F5" }}
        >
          <Search size={15} className="text-juris-ink-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Modül, dosya, lead, fatura, kaynak ara…"
            className="flex-1 bg-transparent outline-none text-[14px] text-juris-navy placeholder:text-juris-ink-4"
          />
          {loading && (
            <span className="text-[10px] text-juris-ink-4 mono">arıyor…</span>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-juris-paper-2 text-juris-ink-3"
            aria-label="Kapat"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results body */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Quick jumps — grouped */}
          {Array.from(jumpGroups.entries()).map(([group, items]) => (
            <div key={group} className="mb-1">
              <div className="text-[9.5px] uppercase tracking-[0.14em] text-juris-ink-4 font-semibold px-4 pt-2 pb-1">
                {group}
              </div>
              {items.map((j) => {
                const thisIndex = itemIndex++;
                const active = thisIndex === activeIndex;
                const Icon = j.icon;
                return (
                  <button
                    key={j.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(thisIndex)}
                    onClick={() => handleNav(j.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                      active ? "bg-juris-paper-2" : "hover:bg-juris-paper-2",
                    )}
                  >
                    <div
                      className="w-7 h-7 rounded-md inline-flex items-center justify-center shrink-0"
                      style={{
                        background: active ? "#0A2240" : "#F1F4F8",
                        color: active ? "white" : "#5A6B82",
                      }}
                    >
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-[13px] font-semibold truncate", active ? "text-juris-navy" : "text-juris-ink-2")}>
                        {j.label}
                      </div>
                      <div className="text-[10.5px] text-juris-ink-3 truncate">{j.hint}</div>
                    </div>
                    {active && (
                      <span className="text-[9.5px] text-juris-ink-4 mono">Enter ↵</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* DB results */}
          {results.length > 0 && (
            <>
              <div className="text-[9.5px] uppercase tracking-[0.14em] text-juris-ink-4 font-semibold px-4 pt-3 pb-1">
                Kayıtlar ({results.length})
              </div>
              {results.map((r) => {
                const thisIndex = itemIndex++;
                const active = thisIndex === activeIndex;
                const meta = MODULE_META[r.module];
                const Icon = meta.icon;
                return (
                  <button
                    key={`${r.module}-${r.id}`}
                    type="button"
                    onMouseEnter={() => setActiveIndex(thisIndex)}
                    onClick={() => handleNav(r.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      active ? "bg-juris-paper-2" : "hover:bg-juris-paper-2",
                    )}
                  >
                    <div
                      className="w-7 h-7 rounded-md inline-flex items-center justify-center shrink-0"
                      style={{
                        background: active ? meta.color : "#F1F4F8",
                        color: active ? "white" : meta.color,
                      }}
                    >
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[8.5px] uppercase tracking-[0.14em] font-semibold"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        {r.badge && (
                          <span
                            className="mono text-[9px] text-juris-ink-4 font-semibold"
                            style={{ letterSpacing: "0.05em" }}
                          >
                            {r.badge}
                          </span>
                        )}
                      </div>
                      <div className={cn("text-[13px] font-semibold truncate", active ? "text-juris-navy" : "text-juris-ink-2")}>
                        {r.title}
                      </div>
                      {r.subtitle && (
                        <div className="text-[10.5px] text-juris-ink-3 truncate mono">
                          {r.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-juris-ink-3">
              <span className="font-semibold">&ldquo;{query}&rdquo;</span> için kayıt bulunamadı.
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-2"
          style={{ borderTop: "1px solid #EEF1F5", background: "#FAFBFD" }}
        >
          <div className="flex items-center gap-3 text-[10px] text-juris-ink-4">
            <span className="inline-flex items-center gap-1">
              <KbdKey>↑</KbdKey><KbdKey>↓</KbdKey> gezin
            </span>
            <span className="inline-flex items-center gap-1">
              <KbdKey>↵</KbdKey> seç
            </span>
            <span className="inline-flex items-center gap-1">
              <KbdKey>Esc</KbdKey> kapat
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-juris-ink-4 font-semibold">
            <Command size={10} /> K
          </span>
        </div>
      </div>
    </div>
  );
}

function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded text-[9px] font-semibold"
      style={{
        background: "white",
        border: "1px solid #E5E9F0",
        color: "#5A6B82",
      }}
    >
      {children}
    </span>
  );
}
