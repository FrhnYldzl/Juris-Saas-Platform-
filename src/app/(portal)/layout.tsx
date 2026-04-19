import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { SignOutButton } from "@/components/shell/signout-button";
import { JurisLogo } from "@/components/ui/brand-mark";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/command");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="bg-juris-navy text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/portal" className="flex items-center gap-4">
          <JurisLogo variant="white" height={36} priority />
          <div className="w-px h-7 bg-white/15" />
          <div className="text-[11px] uppercase tracking-[0.14em] opacity-70 font-semibold">
            Müvekkil Portalı
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
