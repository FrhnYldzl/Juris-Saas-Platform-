"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { NAV_SECTIONS } from "./nav-config";
import { canAccessModule } from "@/lib/rbac";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: { name: string; role: UserRole; title?: string | null };
  firmName: string;
}

export function Sidebar({ user, firmName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccessModule(user.role, item.id)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        "flex flex-col flex-shrink-0 border-r transition-[width] duration-200 relative z-[5]",
        collapsed ? "w-16" : "w-[248px]",
      )}
      style={{
        background: "var(--bg-nav)",
        color: "white",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-white/10",
          collapsed ? "px-4 py-5 justify-center" : "px-[22px] py-5",
        )}
      >
        <JurisMark size={26} />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="display text-[22px] leading-none">juris</span>
            <span className="text-[9px] uppercase tracking-[0.14em] text-white/50 font-semibold mt-[3px]">
              Platform
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3.5 pt-4 pb-2">
          <div className="flex items-center gap-2 px-2.5 py-[7px] bg-white/[0.06] rounded-[5px] text-white/50 text-xs">
            <Search size={13} />
            <span className="flex-1">Ara…</span>
            <span className="text-[9px] px-1.5 py-px bg-white/[0.08] rounded-[3px] tracking-wide">
              ⌘K
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-2 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.group} className="mb-[18px]">
            {!collapsed && (
              <div className="text-[9px] tracking-[0.16em] uppercase text-white/35 font-semibold px-2.5 pt-2 pb-1.5">
                {section.group}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 w-full text-[13px] mb-px rounded-r",
                    "transition-colors",
                    collapsed ? "p-2.5 justify-center" : "px-2.5 py-2",
                    active
                      ? "bg-white/[0.08] text-white font-semibold border-l-2 border-juris-red"
                      : "text-white/70 border-l-2 border-transparent hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <Icon size={15} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {item.tag && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-px rounded-full font-semibold",
                            active ? "bg-juris-red text-white" : "bg-white/[0.08] text-white",
                          )}
                        >
                          {item.tag}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div
        className={cn(
          "border-t border-white/10 flex items-center gap-2.5",
          collapsed ? "p-3 justify-center" : "px-3.5 py-3",
        )}
      >
        <Avatar name={user.name} size={32} color="#BC2F2C" />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold leading-tight truncate">
                {user.title ? `${user.title} ` : ""}{user.name}
              </div>
              <div className="text-[10px] text-white/50 mt-0.5 truncate">
                {roleLabel(user.role)}
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-white/50 hover:text-white p-1"
              aria-label="Kenar çubuğunu daralt"
            >
              <ChevronRight size={14} className="rotate-180" />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-24 bg-juris-navy border border-white/10 rounded-full w-6 h-6 flex items-center justify-center text-white hover:bg-[#051834]"
            aria-label="Kenar çubuğunu genişlet"
          >
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </aside>
  );
}

function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    OWNER: "Kurucu Ortak",
    PARTNER: "Yönetici Ortak",
    ASSOCIATE: "Avukat",
    PARALEGAL: "Paralegal",
    ADMIN_STAFF: "İdari Personel",
    CLIENT: "Müvekkil",
  };
  return map[role];
}

function JurisMark({ size = 26 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        background: "#BC2F2C",
        color: "white",
        borderRadius: 4,
        fontFamily: "'Playfair Display', serif",
        fontSize: size * 0.55,
      }}
    >
      j
    </div>
  );
}
