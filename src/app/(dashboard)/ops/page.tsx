import Link from "next/link";
import { Plus, Scale } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { formatDateTR } from "@/lib/utils";
import { matterTypeLabel, matterStatusChip } from "@/lib/labels";

export const metadata = { title: "Operasyonlar · Dosyalar" };

export default async function OpsPage() {
  const { firmId } = await requireTenant();

  const [matters, active, litigation, consulting, closed] = await Promise.all([
    prisma.matter.findMany({
      where: { firmId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { client: { select: { name: true, companyName: true } } },
    }),
    prisma.matter.count({ where: { firmId, status: "ACTIVE" } }),
    prisma.matter.count({ where: { firmId, type: "LITIGATION", status: "ACTIVE" } }),
    prisma.matter.count({ where: { firmId, type: "CONSULTING", status: "ACTIVE" } }),
    prisma.matter.count({ where: { firmId, status: { in: ["CLOSED_WON", "CLOSED_LOST"] } } }),
  ]);

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Kpi label="Aktif" value={active} emphasized />
        <Kpi label="Dava" value={litigation} sub="aktif" />
        <Kpi label="Danışmanlık" value={consulting} sub="aktif" />
        <Kpi label="Kapanan" value={closed} sub="tüm zamanlar" />
      </div>

      <SectionHead
        title="Dosyalar"
        subtitle="Tüm dava ve danışmanlık dosyaları"
        actions={
          <Link href="/ops/new" className="btn btn-primary">
            <Plus size={14} /> Yeni Dosya
          </Link>
        }
      />

      {matters.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <Scale size={28} className="text-juris-ink-3 mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">Henüz dosya yok</h3>
          <p className="text-sm text-juris-ink-3 max-w-md mb-5">
            İlk dosyanızı oluşturarak başlayın. Dava veya danışmanlık olabilir.
          </p>
          <Link href="/ops/new" className="btn btn-primary">
            <Plus size={14} /> İlk Dosyayı Oluştur
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Dosya No</th>
                <th className="text-left px-4 py-3 font-semibold">Başlık</th>
                <th className="text-left px-4 py-3 font-semibold">Müvekkil</th>
                <th className="text-left px-4 py-3 font-semibold">Tür</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-left px-4 py-3 font-semibold">Güncellendi</th>
              </tr>
            </thead>
            <tbody>
              {matters.map((m) => {
                const chip = matterStatusChip(m.status);
                return (
                  <tr
                    key={m.id}
                    className="border-t border-juris-line-2 hover:bg-juris-paper-2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/ops/${m.id}`}
                        className="mono text-juris-navy font-semibold text-[12px]"
                      >
                        {m.matterNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-juris-navy">
                      <Link href={`/ops/${m.id}`}>{m.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-juris-ink-2">
                      {m.client?.companyName ?? m.client?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-juris-ink-2">
                      {matterTypeLabel(m.type)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-juris-ink-3">
                      {formatDateTR(m.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
