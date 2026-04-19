import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { SignOutButton } from "@/components/shell/signout-button";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/command");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="bg-juris-navy text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/portal" className="flex items-center gap-3">
          <div className="w-7 h-7 bg-juris-red rounded flex items-center justify-center font-serif font-semibold">
            j
          </div>
          <div>
            <div className="display text-xl leading-none">juris</div>
            <div className="text-[9px] uppercase tracking-[0.14em] opacity-60 mt-0.5">
              Müvekkil Portalı
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold">{session.user.name}</div>
            <div className="text-[10px] opacity-60">{session.user.email}</div>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
