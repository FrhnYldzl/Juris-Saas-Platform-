import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { Avatar } from "@/components/ui/avatar";
import { roleLabelTR } from "@/lib/labels";
import { formatDateTR } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Ekip" };

export default async function PeoplePage() {
  const { firmId, role } = await requireTenant();
  const users = await prisma.user.findMany({
    where: { firmId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, email: true, role: true, title: true, active: true,
      lastLoginAt: true, createdAt: true,
    },
  });

  const canInvite = role === "OWNER" || role === "PARTNER";

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <SectionHead
        title="Ekip"
        subtitle={`${users.length} üye · avukatlar, stajyerler, idari kadro`}
        actions={
          canInvite ? (
            <Link href="/people/invite" className="btn btn-primary">
              <Plus size={14} /> Üye Davet Et
            </Link>
          ) : null
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Üye</th>
              <th className="text-left px-4 py-3 font-semibold">E-posta</th>
              <th className="text-left px-4 py-3 font-semibold">Rol</th>
              <th className="text-left px-4 py-3 font-semibold">Durum</th>
              <th className="text-left px-4 py-3 font-semibold">Son Giriş</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size={30} />
                    <div>
                      <div className="font-medium text-juris-navy">
                        {u.title ? `${u.title} ` : ""}{u.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-juris-ink-2">{u.email}</td>
                <td className="px-4 py-3 text-juris-ink-2">{roleLabelTR(u.role)}</td>
                <td className="px-4 py-3">
                  {u.active ? (
                    <span className="chip chip-green">Aktif</span>
                  ) : (
                    <span className="chip">Pasif</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-juris-ink-3">
                  {formatDateTR(u.lastLoginAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
