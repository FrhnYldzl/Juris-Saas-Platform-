import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PortalLeftNav } from "./portal-left-nav";
import { PortalRightPanel } from "./portal-right-panel";
import { PortalTopbar } from "./portal-topbar";
import { TweaksPanel } from "@/components/shell/tweaks-panel";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/command");

  // Resolve the client's Contact record so we can display firm + authority role
  const contact = await prisma.contact.findFirst({
    where: {
      firmId: session.user.firmId,
      email: session.user.email ?? undefined,
      isClient: true,
    },
    select: {
      name: true,
      companyName: true,
      type: true,
      phone: true,
      email: true,
    },
  });

  const clientLabel =
    contact?.type === "COMPANY"
      ? contact.companyName ?? contact.name
      : contact?.name ?? session.user.name;

  const firstName = (session.user.name ?? "").split(" ")[0] || "Müvekkil";

  return (
    <div className="min-h-screen" style={{ background: "#F4F6FA" }}>
      <PortalTopbar userName={firstName} userEmail={session.user.email} />

      <div
        className="mx-auto grid gap-0"
        style={{
          maxWidth: 1480,
          gridTemplateColumns: "240px 1fr 320px",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <PortalLeftNav
          clientLabel={clientLabel ?? "Müvekkil"}
          role="Yetkili / CEO"
          advisorName="Av. Zeynep Arslan"
          advisorTitle="Kıdemli Ortak"
          advisorInitials="AZ"
        />

        <main className="px-8 py-7 overflow-x-hidden">{children}</main>

        <PortalRightPanel />
      </div>

      <TweaksPanel />
    </div>
  );
}
