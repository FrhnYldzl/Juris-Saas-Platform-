import Link from "next/link";
import { Bell, Keyboard, ChevronDown } from "lucide-react";
import { SignOutButton } from "@/components/shell/signout-button";

export function PortalTopbar({
  userName, userEmail, userInitials, clientPosition, unreadCount,
}: {
  userName: string;
  userEmail?: string | null;
  userInitials: string;
  clientPosition: string;
  unreadCount: number;
}) {
  return (
    <header
      className="bg-white sticky top-0 z-40 px-6 h-[64px] flex items-center justify-between"
      style={{ borderBottom: "1px solid #E5E9F0" }}
    >
      <Link href="/portal" className="flex items-center gap-3">
        <div className="flex flex-col leading-none">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-juris-ink-3 font-semibold">
            <span className="text-juris-red">Juris</span>
            <span className="mx-1.5 text-juris-ink-4">›</span>
            <span>Portal</span>
          </div>
          <div
            className="mt-1"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22,
              fontWeight: 500,
              color: "#0A2240",
              lineHeight: 1,
            }}
          >
            Müvekkil Portalı
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-juris-paper-2 text-juris-ink-3"
          title="Kısayollar"
        >
          <Keyboard size={16} />
        </button>
        <button
          type="button"
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-juris-paper-2 text-juris-ink-3"
          title="Bildirimler"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white inline-flex items-center justify-center px-1"
              style={{ background: "#BC2F2C" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <div
          className="ml-1 pl-1 pr-2.5 h-9 rounded-full inline-flex items-center gap-2"
          style={{ background: "#F1F4F8" }}
          title={userEmail ?? userName}
        >
          <span
            className="w-7 h-7 rounded-full inline-flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: "#0A2240" }}
          >
            {userInitials}
          </span>
          <div className="flex flex-col leading-none max-w-[140px]">
            <span className="text-[12px] font-semibold text-juris-navy truncate">
              {userName}
            </span>
            <span className="text-[9.5px] text-juris-ink-3 mt-0.5 truncate">
              Müvekkil · {clientPosition}
            </span>
          </div>
          <ChevronDown size={12} className="text-juris-ink-3" />
        </div>

        <div className="ml-1">
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
