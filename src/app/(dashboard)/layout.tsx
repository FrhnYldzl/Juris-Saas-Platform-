import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { AIChatWidget } from "@/components/ai/chat-widget";
import { TweaksPanel } from "@/components/shell/tweaks-panel";
import { CommandPalette } from "@/components/shell/command-palette";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { listProviders } from "@/lib/ai";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "CLIENT") redirect("/portal");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, role: true, title: true,
      firm: { select: { name: true } },
    },
  });
  if (!user) redirect("/login");

  const aiEnabled = can(user.role, "ai.use") && process.env.FEATURE_AI_ENABLED !== "false";
  const providers = aiEnabled ? listProviders() : [];

  // Live nav badges — pipeline size, open matters, etc.
  const firmId = session.user.firmId;
  const [openLeads, activeMatters, openContacts, connectedIntegrations] = await Promise.all([
    prisma.lead.count({
      where: { firmId, stage: { notIn: ["WON", "LOST"] } },
    }),
    prisma.matter.count({ where: { firmId, status: "ACTIVE" } }),
    prisma.contact.count({ where: { firmId, isClient: true } }),
    prisma.integration.count({
      where: { firmId, status: "CONNECTED" },
    }),
  ]);
  const badges = {
    bd: openLeads,
    ops: activeMatters,
    sales: openContacts,
    integrations: connectedIntegrations,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar
        user={{ name: user.name, role: user.role, title: user.title }}
        firmName={user.firm.name}
        badges={badges}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={{ name: user.name, email: user.email, role: user.role }} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      {aiEnabled && <AIChatWidget providers={providers} />}
      <TweaksPanel />
      <CommandPalette />
    </div>
  );
}
