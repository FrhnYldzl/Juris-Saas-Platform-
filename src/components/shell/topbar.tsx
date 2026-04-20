"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { PAGE_TITLES } from "./nav-config";
import { NotificationCenter } from "./notification-center";
import { useState } from "react";

interface TopbarProps {
  user: { name: string; email: string };
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Find best match — longest prefix
  const matchKey = Object.keys(PAGE_TITLES)
    .filter((k) => pathname === k || pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];
  const pageInfo = PAGE_TITLES[matchKey] ?? { title: "Juris" };

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="h-14 bg-white border-b border-juris-line px-6 flex items-center gap-4 flex-shrink-0 sticky top-0 z-10"
    >
      <div className="flex-1 min-w-0">
        {pageInfo.breadcrumb && pageInfo.breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-juris-ink-4 mb-px">
            {pageInfo.breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span>{b}</span>
                {i < pageInfo.breadcrumb!.length - 1 && <ChevronRight size={10} />}
              </span>
            ))}
          </div>
        )}
        <h1 className="display text-xl text-juris-navy m-0 leading-tight truncate">
          {pageInfo.title}
        </h1>
      </div>

      <div className="flex items-center gap-1.5">
        <NotificationCenter />
        <div className="w-px h-6 bg-juris-line mx-1" />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-juris-navy-100"
          >
            <Avatar name={user.name} size={30} color="#BC2F2C" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-juris-lg border border-juris-line py-1 z-20"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <div className="px-3 py-2 border-b border-juris-line-2">
                <div className="text-sm font-semibold truncate">{user.name}</div>
                <div className="text-xs text-juris-ink-3 truncate">{user.email}</div>
              </div>
              <button
                onClick={async () => {
                  await signOut({ redirect: false });
                  router.push("/login");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-juris-ink-2 hover:bg-juris-navy-100"
              >
                <LogOut size={14} /> Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
