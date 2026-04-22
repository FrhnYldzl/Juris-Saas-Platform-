"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutGrid, Briefcase, Settings2, Mail, Plus, Phone, MessageSquare, Printer,
} from "lucide-react";

const NAV = [
  { key: "ozet",  label: "Yönetici Özeti",      icon: LayoutGrid },
  { key: "hukuk", label: "Hukuk Operasyonları", icon: Briefcase },
  { key: "idari", label: "İdari Konular",       icon: Settings2 },
] as const;

export function PortalLeftNav({
  clientLabel, role, advisorName, advisorTitle, advisorInitials, advisorPhone, advisorEmail,
}: {
  clientLabel: string;
  role: string;
  advisorName: string;
  advisorTitle: string;
  advisorInitials: string;
  advisorPhone: string | null;
  advisorEmail: string | null;
}) {
  const sp = useSearchParams();
  const active = sp.get("view") ?? "ozet";

  return (
    <aside
      className="bg-white flex flex-col"
      style={{
        borderRight: "1px solid #E5E9F0",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      {/* Client identity */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid #EEF1F5" }}>
        <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-1">
          Müvekkil Portalı
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 20,
            color: "#0A2240",
            fontWeight: 500,
            lineHeight: 1.15,
          }}
        >
          {clientLabel}
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-juris-ink-3 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#BC2F2C" }} />
          {role}
        </div>
      </div>

      {/* Primary nav */}
      <nav className="px-3 pt-4 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          const href = item.key === "ozet" ? "/portal" : `/portal?view=${item.key}`;
          return (
            <Link
              key={item.key}
              href={href}
              className="inline-flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-semibold transition-colors"
              style={{
                background: isActive ? "#0A2240" : "transparent",
                color: isActive ? "white" : "#5A6B82",
              }}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Hızlı eylem */}
      <div className="px-5 pt-6 pb-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-3">
          Hızlı Eylem
        </div>
        <div className="flex flex-col gap-2">
          <a
            href={advisorEmail ? `mailto:${advisorEmail}` : "#"}
            className="w-full inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-[12.5px] font-semibold text-white transition-colors"
            style={{ background: "#BC2F2C" }}
          >
            <Mail size={13} /> Avukatıma yaz
          </a>
          <button
            type="button"
            className="w-full inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-[12.5px] font-semibold text-juris-ink-2 transition-colors hover:bg-juris-paper-2"
            style={{ border: "1px solid #E5E9F0" }}
          >
            <Plus size={13} /> Görev ata
          </button>
        </div>
      </div>

      <div className="flex-1" />

      {/* Sorumlu Avukat — bottom sticky */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid #EEF1F5" }}>
        <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2.5">
          Sorumlu Avukat
        </div>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-10 h-10 rounded-full inline-flex items-center justify-center text-white text-[12px] font-bold shrink-0"
            style={{ background: "#BC2F2C" }}
          >
            {advisorInitials}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-juris-navy truncate">
              {advisorName}
            </div>
            <div className="text-[11px] text-juris-red font-medium truncate">
              {advisorTitle}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <IconLink href={advisorPhone ? `tel:${advisorPhone.replace(/\s/g, "")}` : undefined} icon={<Phone size={12} />}        label="Ara" />
          <IconLink href={advisorEmail ? `mailto:${advisorEmail}` : undefined}                   icon={<Mail size={12} />}         label="E-posta" />
          <IconLink href="/portal"                                                                 icon={<MessageSquare size={12} />} label="Mesaj" />
          <IconLink href={undefined}                                                                icon={<Printer size={12} />}      label="Yazdır" />
        </div>
      </div>
    </aside>
  );
}

function IconLink({
  icon, label, href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  const cls = "h-8 rounded-md inline-flex items-center justify-center text-juris-ink-3 hover:text-juris-navy hover:bg-juris-paper-2 transition-colors";
  if (href) {
    return (
      <a
        href={href}
        className={cls}
        style={{ border: "1px solid #E5E9F0" }}
        title={label}
      >
        {icon}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      style={{ border: "1px solid #E5E9F0", opacity: 0.6 }}
      title={label}
      disabled
    >
      {icon}
    </button>
  );
}
