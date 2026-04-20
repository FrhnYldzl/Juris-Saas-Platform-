"use client";

import { useState } from "react";
import { X, Mail, Phone, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Kpi } from "@/components/ui/kpi";
import { cn } from "@/lib/utils";

export interface Goal {
  id: string;
  mod: "bd" | "ops" | "mkt" | "sales" | "fin";
  label: string;
  target: string;
  actual: string;
  unit: string;
  pct: number;
  due: string;
  status: "track" | "risk";
  drill?: "overdue";
}

export interface OverdueClient {
  name: string;
  invoice: string;
  amount: string;
  days: number;
  contact: string;
  owner: string;
  matterId?: string;
}

const MODULE_META = {
  fin:   { label: "Finans",        accent: "#1F7A4E" },
  sales: { label: "Satış",         accent: "#BC2F2C" },
  mkt:   { label: "Pazarlama",     accent: "#B4701C" },
  ops:   { label: "Operasyonlar",  accent: "#0A2240" },
  bd:    { label: "İş Geliştirme", accent: "#2B5185" },
} as const;

export function GoalsBoard({
  goals, overdueClients,
}: {
  goals: Goal[];
  overdueClients: OverdueClient[];
}) {
  const [drill, setDrill] = useState<string | null>(null);
  const onTrack = goals.filter((g) => g.status === "track").length;
  const atRisk = goals.filter((g) => g.status === "risk").length;
  const avgPct = goals.length ? Math.round(goals.reduce((a, g) => a + g.pct, 0) / goals.length) : 0;
  const modules = (Object.keys(MODULE_META) as (keyof typeof MODULE_META)[]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <Kpi label="Toplam Hedef" value={goals.length} sub="Q2 2026" />
        <Kpi label="Rayında" value={onTrack} sub="hedef" emphasized />
        <Kpi label="Risk Altında" value={atRisk} trend={atRisk > 0 ? "down" : undefined} sub="dikkat" />
        <Kpi label="Ortalama İlerleme" value={avgPct} suffix="%" />
      </div>

      <div className="flex flex-col gap-8">
        {modules.map((mk) => {
          const meta = MODULE_META[mk];
          const items = goals.filter((g) => g.mod === mk);
          if (items.length === 0) return null;
          const modAvg = Math.round(items.reduce((a, g) => a + g.pct, 0) / items.length);
          const modRisk = items.filter((g) => g.status === "risk").length;
          return (
            <section key={mk}>
              <div className="flex items-baseline gap-2.5 mb-3.5">
                <div
                  className="w-[3px] h-[14px] self-center"
                  style={{ background: meta.accent }}
                />
                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#0A2240",
                    margin: 0,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {meta.label}
                </h3>
                <div className="flex-1" />
                {modRisk > 0 && (
                  <span className="text-[10px] text-juris-red font-semibold uppercase tracking-wider">
                    {modRisk} risk
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 15,
                    fontStyle: "italic",
                    color: "#8895AB",
                    fontWeight: 500,
                  }}
                >
                  {modAvg}%
                </span>
              </div>
              <div
                className="grid gap-0 border-t border-juris-line-2"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
              >
                {items.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => g.drill && setDrill(g.drill)}
                    className={cn(
                      "px-0 pr-4 py-3.5 border-b border-r border-juris-line-2 relative",
                      g.drill && "cursor-pointer hover:bg-juris-paper-2 transition-colors",
                    )}
                  >
                    {g.drill && (
                      <div className="absolute top-3.5 right-4 text-[9px] text-juris-red font-semibold uppercase tracking-wider">
                        detay →
                      </div>
                    )}
                    <div className="flex justify-between items-baseline mb-2 gap-2.5">
                      <div className="text-[13px] text-juris-ink-2 leading-tight">{g.label}</div>
                      <div
                        className="flex-shrink-0"
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: 16,
                          fontStyle: "italic",
                          color: g.status === "risk" ? "#BC2F2C" : "#0A2240",
                          fontWeight: 500,
                        }}
                      >
                        {g.pct}%
                      </div>
                    </div>
                    <div className="h-[2px] bg-juris-line-2 mb-2">
                      <div
                        style={{
                          width: `${Math.min(g.pct, 100)}%`,
                          height: "100%",
                          background: g.status === "risk" ? "#BC2F2C" : meta.accent,
                          transition: "width 400ms ease",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-juris-ink-4 mono">
                      <span>
                        <span className="text-juris-ink font-semibold">
                          {g.actual}
                          {g.unit}
                        </span>{" "}
                        / {g.target}
                      </span>
                      <span>{g.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {drill === "overdue" && (
        <OverdueDrawer
          clients={overdueClients}
          onClose={() => setDrill(null)}
        />
      )}
    </>
  );
}

function OverdueDrawer({
  clients, onClose,
}: {
  clients: OverdueClient[];
  onClose: () => void;
}) {
  const totalAmount = clients.reduce(
    (s, c) => s + parseFloat(c.amount.replace(/[^\d.-]/g, "")) * 1000,
    0,
  );
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 animate-fade"
        style={{ background: "rgba(10,34,64,0.4)" }}
      />
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden animate-slideIn"
        style={{
          width: "min(640px, 100vw)",
          background: "#FBFAF7",
          boxShadow: "-24px 0 60px rgba(10,34,64,0.16)",
        }}
      >
        <div className="px-7 pt-5 pb-4 border-b border-juris-line bg-white">
          <div className="flex items-center justify-between mb-2.5">
            <span className="chip chip-red">Risk · Finans</span>
            <button
              onClick={onClose}
              className="bg-transparent border-none p-1.5 cursor-pointer text-juris-ink-3 hover:text-juris-navy"
              aria-label="Kapat"
            >
              <X size={18} />
            </button>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 26,
              fontWeight: 500,
              color: "#0A2240",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Vadesi geçmiş alacaklar
          </h2>
          <div className="text-[13px] text-juris-ink-3 mt-1">
            {clients.length} müvekkil · hedef ₺150K
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          {clients.length === 0 ? (
            <div className="text-center py-10 text-sm text-juris-ink-3">
              🎉 Vadesi geçmiş alacağınız yok.
            </div>
          ) : (
            clients.map((c) => (
              <div
                key={c.invoice}
                className="bg-white border border-juris-line rounded-md p-4 mb-2.5"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 17,
                        fontWeight: 500,
                        color: "#0A2240",
                      }}
                    >
                      {c.name}
                    </div>
                    <div className="mono text-[11px] text-juris-ink-3 mt-0.5">
                      {c.invoice}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-lg font-semibold text-juris-red">
                      {c.amount}
                    </div>
                    <div className="text-[11px] text-juris-red font-semibold">
                      {c.days} gün gecikme
                    </div>
                  </div>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-juris-line-2 text-xs text-juris-ink-3">
                  <span className="flex items-center gap-1.5">
                    <Avatar name={c.contact} size={18} /> {c.contact}
                  </span>
                  <span>Sorumlu: {c.owner}</span>
                </div>
                <div className="flex gap-1.5 mt-2.5">
                  <button className="btn btn-sm btn-ghost">
                    <Mail size={12} /> Hatırlatma
                  </button>
                  <button className="btn btn-sm btn-ghost">
                    <Phone size={12} /> Ara
                  </button>
                  <div className="flex-1" />
                  {c.matterId && (
                    <a
                      href={`/ops/${c.matterId}`}
                      className="btn btn-sm btn-primary"
                    >
                      Dosyaya git <ArrowRight size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
