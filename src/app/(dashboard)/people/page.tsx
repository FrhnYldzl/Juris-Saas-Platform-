import Link from "next/link";
import { Plus, Mail, Phone, Circle } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { Avatar } from "@/components/ui/avatar";
import { roleLabelTR } from "@/lib/labels";
import { formatDateTR } from "@/lib/utils";
import { ProgressThin } from "@/components/ui/mini-chart";
import { cn } from "@/lib/utils";

export const metadata = { title: "Ekip" };

export default async function PeoplePage() {
  const { firmId, role } = await requireTenant();

  const users = await prisma.user.findMany({
    where: { firmId, role: { not: "CLIENT" } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, name: true, email: true, role: true, title: true, phone: true,
      active: true, lastLoginAt: true, createdAt: true, image: true,
      _count: {
        select: {
          assignedMatters: true,
          assignedTasks: { where: { status: { in: ["TODO", "IN_PROGRESS"] } } },
          createdTasks: true,
        },
      },
    },
  });

  const canInvite = role === "OWNER" || role === "PARTNER";
  const activeCount = users.filter((u) => u.active).length;
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const maxTasks = Math.max(...users.map((u) => u._count.assignedTasks), 1);

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
        <Kpi label="Ekip" value={activeCount} sub={`${users.length} toplam`} emphasized />
        <Kpi label="Ortak" value={(roleCounts.OWNER ?? 0) + (roleCounts.PARTNER ?? 0)} sub="yönetim" />
        <Kpi label="Avukat" value={roleCounts.ASSOCIATE ?? 0} sub="associate" />
        <Kpi label="Paralegal" value={roleCounts.PARALEGAL ?? 0} sub="stajyer" />
        <Kpi label="İdari" value={roleCounts.ADMIN_STAFF ?? 0} sub="destek" />
      </div>

      <SectionHead
        title="Ekip"
        subtitle="Avukatlar, stajyerler, idari kadro · iş yükü görünümü"
        actions={
          canInvite ? (
            <Link href="/people/invite" className="btn btn-primary">
              <Plus size={14} /> Üye Davet Et
            </Link>
          ) : null
        }
      />

      {/* Team grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {users.map((u) => (
          <div
            key={u.id}
            className={cn(
              "card p-5 flex flex-col gap-3 transition-all hover:shadow-juris-md",
              !u.active && "opacity-60",
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar name={u.name} src={u.image} size={46} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-juris-navy truncate">
                    {u.title ? `${u.title} ` : ""}{u.name}
                  </span>
                  {!u.active && <span className="chip">Pasif</span>}
                </div>
                <div className="text-xs text-juris-ink-3 mt-0.5">
                  {roleLabelTR(u.role)}
                </div>
              </div>
              {u.active && (
                <Circle
                  size={8}
                  className="text-juris-success fill-juris-success mt-1.5"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-juris-ink-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail size={11} className="text-juris-ink-4 flex-shrink-0" />
                <span className="truncate">{u.email}</span>
              </div>
              {u.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={11} className="text-juris-ink-4 flex-shrink-0" />
                  <span className="mono">{u.phone}</span>
                </div>
              )}
            </div>

            {/* Workload bar */}
            <div className="pt-3 border-t border-juris-line-2">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-juris-ink-3">İş Yükü</span>
                <span className="mono font-semibold text-juris-navy">
                  {u._count.assignedTasks} açık görev
                </span>
              </div>
              <ProgressThin
                value={u._count.assignedTasks}
                max={maxTasks}
                color={u._count.assignedTasks >= maxTasks * 0.7 ? "#BC2F2C" : "#0A2240"}
                warn={u._count.assignedTasks >= maxTasks * 0.9}
              />
              <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                <div>
                  <div className="text-juris-ink-4">Dosya</div>
                  <div className="font-semibold text-juris-navy mono">
                    {u._count.assignedMatters}
                  </div>
                </div>
                <div>
                  <div className="text-juris-ink-4">Son Giriş</div>
                  <div className="text-juris-ink-2 text-[11px]">
                    {u.lastLoginAt ? formatDateTR(u.lastLoginAt) : "Hiç"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compact list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-juris-line-2 bg-juris-paper-2">
          <h4 className="label">Tam Liste</h4>
        </div>
        <table className="w-full text-sm">
          <thead className="text-juris-ink-3 text-[11px] uppercase tracking-wider">
            <tr className="border-b border-juris-line-2">
              <th className="text-left px-5 py-3 font-semibold">Üye</th>
              <th className="text-left px-4 py-3 font-semibold">E-posta</th>
              <th className="text-left px-4 py-3 font-semibold">Rol</th>
              <th className="text-right px-4 py-3 font-semibold">Dosya</th>
              <th className="text-right px-4 py-3 font-semibold">Görev</th>
              <th className="text-left px-4 py-3 font-semibold">Durum</th>
              <th className="text-left px-5 py-3 font-semibold">Son Giriş</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} src={u.image} size={28} />
                    <div className="font-medium text-juris-navy">
                      {u.title ? `${u.title} ` : ""}{u.name}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-juris-ink-2 text-xs truncate max-w-[220px]">{u.email}</td>
                <td className="px-4 py-3 text-xs text-juris-ink-2">{roleLabelTR(u.role)}</td>
                <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                  {u._count.assignedMatters || "—"}
                </td>
                <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                  {u._count.assignedTasks || "—"}
                </td>
                <td className="px-4 py-3">
                  {u.active ? (
                    <span className="chip chip-green">Aktif</span>
                  ) : (
                    <span className="chip">Pasif</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-juris-ink-3">
                  {u.lastLoginAt ? formatDateTR(u.lastLoginAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
