import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadPortalContext, initialsOf, firstNameOf } from "@/lib/portal-context";
import { getPreviewMode } from "@/lib/preview-mode";
import { PortalLeftNav } from "./portal-left-nav";
import { PortalRightPanel } from "./portal-right-panel";
import { PortalTopbar } from "./portal-topbar";
import { TweaksPanel } from "@/components/shell/tweaks-panel";
import { PreviewBanner } from "@/components/shell/preview-banner";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { realRole, previewRole, isPreview } = await getPreviewMode(session.user.role);

  // CLIENTs always see portal. OWNER/PARTNER only see portal if they have the
  // preview cookie set to CLIENT. Everyone else → bounce back to /command.
  const allowed =
    realRole === "CLIENT" ||
    (isPreview && previewRole === "CLIENT");
  if (!allowed) redirect("/command");

  // Resolve the Contact we're displaying:
  //   - real CLIENT user → their own Contact (by email match)
  //   - preview mode     → first demo Contact flagged isClient in the firm
  let ctx = await loadPortalContext(session.user.firmId, session.user.email ?? "");

  if (!ctx && isPreview) {
    // Preview fallback: grab any client contact in the firm
    const demoContact = await prisma.contact.findFirst({
      where: { firmId: session.user.firmId, isClient: true },
      orderBy: { createdAt: "asc" },
      select: { email: true },
    });
    if (demoContact?.email) {
      ctx = await loadPortalContext(session.user.firmId, demoContact.email);
    }
  }

  const clientLabel =
    ctx?.contact.type === "COMPANY"
      ? ctx.contact.companyName ?? ctx.contact.name
      : ctx?.contact.name ?? session.user.name ?? "Müvekkil";

  // When previewing, show the demo contact's name — not the admin's real name
  const displayName = isPreview
    ? (ctx?.contact.name ?? "Müvekkil")
    : (session.user.name ?? "Müvekkil");
  const displayEmail = isPreview
    ? (ctx?.contact.email ?? session.user.email)
    : session.user.email;

  const userFirstName = firstNameOf(displayName);
  const userInitials = initialsOf(displayName);
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
      {isPreview && (
        <PreviewBanner
          role="CLIENT"
          realRoleLabel={realRole === "OWNER" ? "Kurucu Ortak" : "Yönetici Ortak"}
          clientName={clientLabel}
        />
      )}

      <PortalTopbar
        userName={displayName}
        userEmail={displayEmail}
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
