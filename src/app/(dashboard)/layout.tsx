import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar
        user={{ name: user.name, role: user.role, title: user.title }}
        firmName={user.firm.name}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={{ name: user.name, email: user.email }} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
