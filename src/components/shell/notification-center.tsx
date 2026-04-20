"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell, X, Gavel, Receipt, Briefcase, MessageSquare,
  CheckCircle2, Calendar, Clock, ArrowRight,
} from "lucide-react";
import { formatDateTimeTR } from "@/lib/utils";

interface Notification {
  id: string;
  action: string;
  createdAt: string;
  actorName: string | null;
  entityType: string | null;
  entityId: string | null;
}

interface ReportTemplate {
  id: string;
  icon: "summary" | "pipeline" | "ops" | "finance";
  title: string;
  description: string;
  cadence: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "weekly",
    icon: "summary",
    title: "Haftalık Ortaklar Brief'i",
    description: "Pipeline, finans, dosya ilerlemesi ve kritik gelişmeler",
    cadence: "Her Pazartesi 08:00",
  },
  {
    id: "monthly",
    icon: "finance",
    title: "Aylık Finans Kapanış",
    description: "Kesim, tahsilat, gider, net sonuç + gelecek ay öngörüsü",
    cadence: "Ayın 1'i",
  },
  {
    id: "hearings",
    icon: "ops",
    title: "Haftanın Duruşmaları",
    description: "Önümüzdeki hafta tüm duruşma listesi + ön hazırlık notları",
    cadence: "Her Cuma 17:00",
  },
  {
    id: "pipeline",
    icon: "pipeline",
    title: "Pipeline Sağlık Raporu",
    description: "Aşama bazında değer, olasılık, tahmini kapanış",
    cadence: "Her 15 günde bir",
  },
];

function humanize(action: string): string {
  const m: Record<string, string> = {
    "matter.create": "yeni dosya oluşturdu",
    "matter.update": "dosyayı güncelledi",
    "invoice.create": "fatura oluşturdu",
    "invoice.sent": "fatura gönderdi",
    "invoice.paid": "faturayı ödendi işaretledi",
    "lead.create": "fırsat ekledi",
    "lead.convert_to_matter": "fırsatı müvekkile dönüştürdü",
    "contact.create": "kişi ekledi",
    "note.create": "not ekledi",
    "task.create": "görev oluşturdu",
    "task.done": "görev tamamladı",
    "event.create": "etkinlik ekledi",
    "time_entry.create": "zaman kaydı yaptı",
    "document.upload": "belge yükledi",
    "user.invite": "yeni üye davet etti",
    "content.create": "içerik planladı",
  };
  return m[action] ?? action;
}

function iconFor(action: string) {
  const [cat] = action.split(".");
  const c = "flex-shrink-0";
  if (cat === "invoice") return <Receipt size={14} className={`${c} text-juris-success`} />;
  if (cat === "matter" || cat === "time_entry") return <Briefcase size={14} className={`${c} text-juris-navy`} />;
  if (cat === "event") return <Gavel size={14} className={`${c} text-juris-red`} />;
  if (cat === "task") return <CheckCircle2 size={14} className={`${c} text-juris-warn`} />;
  if (cat === "note") return <MessageSquare size={14} className={`${c} text-juris-info`} />;
  return <Clock size={14} className={`${c} text-juris-ink-3`} />;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"feed" | "reports">("feed");
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setUnread(data.unread);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const int = setInterval(load, 60000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Bildirimler"
        className="relative p-[7px] rounded-[5px] border border-transparent text-juris-ink-2 hover:bg-juris-navy-100 transition-colors"
      >
        <Bell size={16} />
        {unread != null && unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-juris-red text-white text-[9px] font-bold flex items-center justify-center px-1 mono"
            aria-label={`${unread} okunmamış`}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 animate-fade"
            style={{ background: "rgba(10,34,64,0.4)" }}
          />
          <div
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden bg-juris-paper animate-slideIn"
            style={{
              width: "min(460px, 100vw)",
              boxShadow: "-24px 0 60px rgba(10,34,64,0.16)",
            }}
          >
            <div className="px-6 pt-5 pb-0 border-b border-juris-line bg-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="display text-[22px] text-juris-navy leading-none">
                    Bildirimler
                  </div>
                  <div className="text-xs text-juris-ink-3 mt-1">
                    Firma içi hareketler + rapor şablonları
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Kapat"
                  className="text-juris-ink-3 hover:text-juris-navy p-1.5"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-1 -mb-px">
                <TabButton active={tab === "feed"} onClick={() => setTab("feed")}>
                  Hareketler {unread && unread > 0 ? <span className="chip chip-red ml-1.5" style={{ height: 16, fontSize: 9 }}>{unread}</span> : null}
                </TabButton>
                <TabButton active={tab === "reports"} onClick={() => setTab("reports")}>
                  Raporlar
                </TabButton>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {tab === "feed" ? (
                <div className="px-5 py-3">
                  {loading ? (
                    <div className="py-8 text-center text-sm text-juris-ink-3">
                      Yükleniyor…
                    </div>
                  ) : items.length === 0 ? (
                    <div className="py-10 text-center text-sm text-juris-ink-3">
                      Henüz bildirim yok.
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {items.map((n) => (
                        <li key={n.id} className="rounded-md bg-white border border-juris-line-2 px-3 py-2.5 flex items-start gap-2.5">
                          {iconFor(n.action)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-juris-ink-2">
                              <span className="font-semibold text-juris-navy">
                                {n.actorName ?? "Sistem"}
                              </span>{" "}
                              {humanize(n.action)}
                            </div>
                            <div className="text-[11px] text-juris-ink-4 mt-0.5">
                              {formatDateTimeTR(n.createdAt)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/settings/audit"
                    onClick={() => setOpen(false)}
                    className="mt-3 block text-center text-xs text-juris-ink-3 hover:text-juris-red py-2"
                  >
                    Tüm audit log’u gör →
                  </Link>
                </div>
              ) : (
                <div className="px-5 py-4 flex flex-col gap-2.5">
                  {REPORT_TEMPLATES.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-md p-4 border border-juris-line-2 hover:border-juris-navy-200 hover:shadow-juris-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(10,34,64,0.06)", color: "#0A2240" }}
                        >
                          <ReportIcon name={r.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-juris-navy text-sm leading-tight">
                            {r.title}
                          </div>
                          <div className="text-[11px] text-juris-ink-3 mt-1 leading-relaxed">
                            {r.description}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="mono text-[10px] text-juris-ink-4">
                              {r.cadence}
                            </span>
                            <span className="text-[11px] text-juris-red font-semibold inline-flex items-center gap-1">
                              Şimdi üret <ArrowRight size={10} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-[11px] text-juris-ink-4 text-center mt-2 leading-relaxed">
                    Raporlar v0.8’de AI ile otomatik üretilecek; e-posta ile
                    ortaklar kuruluna iletilir.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function TabButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
        active ? "text-juris-navy" : "text-juris-ink-3 hover:text-juris-navy"
      }`}
    >
      {children}
      {active && (
        <span
          className="absolute inset-x-3 bottom-0 h-[2px] rounded-t"
          style={{ background: "#BC2F2C" }}
        />
      )}
    </button>
  );
}

function ReportIcon({ name }: { name: ReportTemplate["icon"] }) {
  if (name === "summary") return <Calendar size={14} />;
  if (name === "pipeline") return <Briefcase size={14} />;
  if (name === "ops") return <Gavel size={14} />;
  return <Receipt size={14} />;
}
