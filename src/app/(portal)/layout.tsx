import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadPortalContext, initialsOf, firstNameOf } from "@/lib/portal-context";
import { PortalLeftNav } from "./portal-left-nav";
import { PortalRightPanel } from "./portal-right-panel";
import { PortalTopbar } from "./portal-topbar";
import { TweaksPanel } from "@/components/shell/tweaks-panel";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Hard separation: only CLIENT role sees the portal. Everyone else → dashboard.
  if (session.user.role !== "CLIENT") redirect("/command");

  const ctx = await loadPortalContext(session.user.firmId, session.user.email ?? "");

  const clientLabel =
    ctx?.contact.type === "COMPANY"
      ? ctx.contact.companyName ?? ctx.contact.name
      : ctx?.contact.name ?? session.user.name ?? "Müvekkil";

  const userFirstName = firstNameOf(session.user.name ?? "");
  const userInitials = initialsOf(session.user.name ?? "");
  // Clients that authenticate with a company email are typically the authorised
  // contact person for the company. The UI calls this "Yetkili / CEO" in the design.
  const clientPosition = ctx?.contact.type === "COMPANY" ? "Yetkili / CEO" : "Müvekkil";

  const advisor = ctx?.advisor;
  const advisorName     = advisor?.name     ?? "Avukat atanmadı";
  const advisorTitle    = advisor?.title    ?? "Sorumlu avukat";
  const advisorInitials = advisor?.name ? initialsOf(advisor.name) : "—";
  const advisorEmail    = advisor?.email    ?? null;
  const advisorPhone    = advisor?.phone    ?? null;

  const managingPartner = ctx?.managingPartner;
  const unread = ctx?.unreadMessages ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#F4F6FA" }}>
      <PortalTopbar
        userName={session.user.name ?? "Müvekkil"}
        userEmail={session.user.email}
        userInitials={userInitials}
        clientPosition={clientPosition}
        unreadCount={unread}
      />

      <div
        className="mx-auto grid gap-0"
        style={{
          maxWidth: 1480,
          gridTemplateColumns: "240px 1fr 320px",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <PortalLeftNav
          clientLabel={clientLabel}
          role={clientPosition}
          advisorName={advisorName}
          advisorTitle={advisorTitle}
          advisorInitials={advisorInitials}
          advisorPhone={advisorPhone}
          advisorEmail={advisorEmail}
        />

        <main className="px-8 py-7 overflow-x-hidden">{children}</main>

        <PortalRightPanel
          firstName={userFirstName || "Müvekkil"}
          advisorName={advisorName}
          advisorInitials={advisorInitials}
          managingPartnerName={managingPartner?.name ?? null}
          unreadCount={unread}
        />
      </div>

      <TweaksPanel />
    </div>
  );
}
