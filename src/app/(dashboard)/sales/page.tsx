import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { formatDateTR } from "@/lib/utils";
import { Users, Plus } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Satış · Müvekkiller" };

export default async function SalesPage() {
  const { firmId } = await requireTenant();

  const [contacts, clients, total] = await Promise.all([
    prisma.contact.findMany({
      where: { firmId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.contact.count({ where: { firmId, isClient: true } }),
    prisma.contact.count({ where: { firmId } }),
  ]);

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Kpi label="Müvekkiller" value={clients} emphasized />
        <Kpi label="Toplam Kayıt" value={total} sub="kişi + kurum" />
        <Kpi label="Kurum" value={contacts.filter((c) => c.type === "COMPANY").length} />
        <Kpi label="Birey" value={contacts.filter((c) => c.type === "INDIVIDUAL").length} />
      </div>

      <SectionHead
        title="Kişiler & Kurumlar"
        subtitle="Müvekkil ve müvekkil adayları"
        actions={
          <Link href="/sales/new" className="btn btn-primary">
            <Plus size={14} /> Yeni Kişi
          </Link>
        }
      />

      {contacts.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <Users size={28} className="text-juris-ink-3 mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">Henüz kişi yok</h3>
          <p className="text-sm text-juris-ink-3 max-w-md">
            Müvekkilleri ekleyerek başlayın. Faturalar ve dosyalar buradan atanır.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Ad</th>
                <th className="text-left px-4 py-3 font-semibold">Tür</th>
                <th className="text-left px-4 py-3 font-semibold">E-posta</th>
                <th className="text-left px-4 py-3 font-semibold">Telefon</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-left px-4 py-3 font-semibold">Güncellendi</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                  <td className="px-4 py-3 font-medium text-juris-navy">
                    {c.type === "COMPANY" ? c.companyName ?? c.name : c.name}
                  </td>
                  <td className="px-4 py-3 text-xs text-juris-ink-2">
                    {c.type === "COMPANY" ? "Kurum" : "Birey"}
                  </td>
                  <td className="px-4 py-3 text-juris-ink-2">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-juris-ink-2">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {c.isClient ? (
                      <span className="chip chip-green">Müvekkil</span>
                    ) : (
                      <span className="chip">Aday</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-juris-ink-3">
                    {formatDateTR(c.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
