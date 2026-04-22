"use client";

import { useState } from "react";
import {
  Sparkles, MessageSquare, Activity, Plus, FileText, CheckCircle2, Gavel, Receipt, User as UserIcon,
} from "lucide-react";

type TabKey = "ai" | "mesajlar" | "aktivite";

export function PortalRightPanel({
  firstName, advisorName, advisorInitials, managingPartnerName, unreadCount,
}: {
  firstName: string;
  advisorName: string;
  advisorInitials: string;
  managingPartnerName: string | null;
  unreadCount: number;
}) {
  const [tab, setTab] = useState<TabKey>("ai");

  return (
    <aside
      className="bg-white flex flex-col"
      style={{
        borderLeft: "1px solid #E5E9F0",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      {/* Tab bar */}
      <div className="flex" style={{ borderBottom: "1px solid #EEF1F5" }}>
        <TabBtn label="AI Asistan" icon={<Sparkles size={12} />} active={tab === "ai"}       onClick={() => setTab("ai")} />
        <TabBtn label="Mesajlar"   icon={<MessageSquare size={12} />} active={tab === "mesajlar"} badge={unreadCount} onClick={() => setTab("mesajlar")} />
        <TabBtn label="Aktivite"   icon={<Activity size={12} />} active={tab === "aktivite"} onClick={() => setTab("aktivite")} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "ai"       && <AIAssistantPane firstName={firstName} />}
        {tab === "mesajlar" && <MessagesPane advisorName={advisorName} advisorInitials={advisorInitials} managingPartnerName={managingPartnerName} />}
        {tab === "aktivite" && <ActivityPane firstName={firstName} advisorName={advisorName} />}
      </div>
    </aside>
  );
}

function TabBtn({
  label, icon, active, badge, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold transition-colors relative"
      style={{
        color: active ? "#0A2240" : "#5A6B82",
      }}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className="inline-flex items-center justify-center min-w-[16px] h-4 rounded-full text-[9px] font-bold text-white px-1"
          style={{ background: "#BC2F2C" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {active && (
        <span
          className="absolute bottom-0 left-4 right-4 h-[2px] rounded-t"
          style={{ background: "#BC2F2C" }}
        />
      )}
    </button>
  );
}

// ─────────────── AI Assistant ───────────────

function AIAssistantPane({ firstName }: { firstName: string }) {
  const suggestions = [
    "Yaklaşan duruşmada ne yapılacak?",
    "Bu ay ödenmesi gereken faturalar neler?",
    "KVKK projesinde benden beklenen görevler?",
    "Hizmet sözleşmemi özetle",
  ];
  return (
    <div className="p-5 flex flex-col gap-5">
      <div
        className="rounded-lg p-4"
        style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
      >
        <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-2">
          Juris AI Asistan
        </div>
        <p className="text-[12px] text-juris-ink-2 leading-relaxed">
          Merhaba {firstName}, dosyalarınız ve belgeleriniz hakkında soru sorabilirsiniz.{" "}
          <span className="text-juris-navy font-semibold">Avukatlık sırrı</span> kapsamında cevaplar.
        </p>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2.5">
          Hızlı Sorular
        </div>
        <div className="flex flex-col gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3.5 py-2.5 rounded-md text-[12px] text-juris-ink-2 transition-all hover:border-juris-navy hover:text-juris-navy"
              style={{ background: "white", border: "1px solid #E5E9F0" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────── Mesajlar ───────────────

function MessagesPane({
  advisorName, advisorInitials, managingPartnerName,
}: {
  advisorName: string;
  advisorInitials: string;
  managingPartnerName: string | null;
}) {
  // Design-matched mock, but senders + attribution use real context
  const messages: Array<{
    id: string;
    subject: string;
    sender: string;
    initials: string;
    matterRef?: string;
    preview: string;
    time: string;
    unread?: number;
  }> = [
    {
      id: "m1",
      subject: "Duruşma hazırlığı",
      sender: advisorName,
      initials: advisorInitials,
      preview: "Bir de duruşma saatini 10:00 olarak teyit edelim lütfen. Er…",
      time: "15 dk",
      unread: 2,
    },
    {
      id: "m2",
      subject: "KVKK projesi – çalışan eğitimi",
      sender: advisorName,
      initials: advisorInitials,
      preview: "Teşekkürler. 15 Nisan Çarşamba öğleden sonra müsait…",
      time: "2 gün",
    },
    {
      id: "m3",
      subject: "Nisan faturası – onay",
      sender: "Juris Muhasebe",
      initials: "JM",
      preview: "Nisan ayı danışmanlık faturanız sisteme yüklendi. Vade ta…",
      time: "3 saat",
      unread: 1,
    },
    ...(managingPartnerName
      ? [{
          id: "m4",
          subject: "Genel değerlendirme",
          sender: managingPartnerName,
          initials: managingPartnerName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
          preview: "Pazartesi 14:00 uygun. Teams link atıyorum.",
          time: "5 gün",
        }]
      : []),
  ];

  return (
    <div className="p-4 flex flex-col gap-3">
      <button
        type="button"
        className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-md text-[12.5px] font-semibold text-white"
        style={{ background: "#BC2F2C" }}
      >
        <Plus size={13} /> Yeni mesaj
      </button>

      <ul className="flex flex-col">
        {messages.map((m, idx) => (
          <li
            key={m.id}
            className="py-3 cursor-pointer hover:bg-juris-paper-2 -mx-2 px-2 rounded-md transition-colors relative"
            style={idx < messages.length - 1 ? { borderBottom: "1px solid #EEF1F5" } : {}}
          >
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <div className="text-[13px] font-semibold text-juris-navy leading-tight">
                {m.subject}
              </div>
              {m.unread !== undefined && (
                <span
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white shrink-0"
                  style={{ background: "#BC2F2C" }}
                >
                  {m.unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-juris-ink-3 mb-1">
              <span className="font-semibold">{m.sender}</span>
              {m.matterRef && (
                <>
                  <span>·</span>
                  <span className="mono">{m.matterRef}</span>
                </>
              )}
            </div>
            <p className="text-[11.5px] text-juris-ink-2 leading-snug line-clamp-2">
              {m.preview}
            </p>
            <div className="text-[10px] text-juris-ink-4 mt-1">{m.time}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────── Aktivite ───────────────

function ActivityPane({ firstName, advisorName }: { firstName: string; advisorName: string }) {
  const items: Array<{
    id: string;
    icon: React.ReactNode;
    tone: "navy" | "green" | "red" | "amber" | "blue" | "neutral";
    title: string;
    detail: string;
    time: string;
  }> = [
    { id: "a1", icon: <MessageSquare size={11} />, tone: "navy",    title: `${advisorName} mesaj gönderdi`, detail: "Duruşma hazırlığı",                                 time: "Bugün 14:30" },
    { id: "a2", icon: <FileText size={11} />,      tone: "blue",    title: "Yeni belge yüklendi",          detail: "Bilirkişi raporu taslak.pdf (5.2 MB)",              time: "Bugün 11:20" },
    { id: "a3", icon: <CheckCircle2 size={11} />,  tone: "green",   title: "Görev tamamlandı",              detail: "KVKK envanteri güncellendi",                        time: "Bugün 09:15" },
    { id: "a4", icon: <MessageSquare size={11} />, tone: "neutral", title: `${firstName} mesaj gönderdi`,   detail: "Duruşma hazırlığı",                                 time: "Dün 16:05" },
    { id: "a5", icon: <Receipt size={11} />,       tone: "amber",   title: "Fatura gönderildi",            detail: "F-2026-074 – KVKK projesi 2. taksit (28.500 ₺)",    time: "Dün 10:00" },
    { id: "a6", icon: <Gavel size={11} />,         tone: "red",     title: "Duruşma planlandı",            detail: "10 Nisan 10:00",                                    time: "2 gün önce" },
    { id: "a7", icon: <UserIcon size={11} />,      tone: "navy",    title: "Yeni görev atandı",            detail: "Delil klasörü – teslim edilecek ek belgeler",       time: "3 gün önce" },
    { id: "a8", icon: <Receipt size={11} />,       tone: "green",   title: "Ödeme alındı",                  detail: "F-2026-058 – 48.000 ₺",                             time: "3 gün önce" },
  ];

  const color = (t: string) => {
    switch (t) {
      case "green":   return { fg: "#1F7A4E", bg: "rgba(31,122,78,0.1)" };
      case "red":     return { fg: "#BC2F2C", bg: "rgba(188,47,44,0.1)" };
      case "amber":   return { fg: "#B4701C", bg: "rgba(180,112,28,0.1)" };
      case "blue":    return { fg: "#1F5AA8", bg: "rgba(31,90,168,0.1)" };
      case "navy":    return { fg: "#0A2240", bg: "rgba(10,34,64,0.08)" };
      default:        return { fg: "#5A6B82", bg: "#F1F4F8" };
    }
  };

  return (
    <ul className="p-4 flex flex-col gap-3">
      {items.map((i) => {
        const c = color(i.tone);
        return (
          <li key={i.id} className="flex gap-3">
            <div
              className="w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0"
              style={{ background: c.bg, color: c.fg }}
            >
              {i.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-juris-navy leading-tight">
                {i.title}
              </div>
              <div className="text-[11px] text-juris-ink-3 mt-0.5 line-clamp-2">
                {i.detail}
              </div>
              <div className="text-[10px] text-juris-ink-4 mt-1">{i.time}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
