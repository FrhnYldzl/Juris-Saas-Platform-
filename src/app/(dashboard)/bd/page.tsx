import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { leadStageLabel } from "@/lib/labels";
import { formatTRY, formatDateTR } from "@/lib/utils";
import { TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "İş Geliştirme" };

export default async function BdPage() {
  const { firmId } = await requireTenant();

  const [leads, open, totalValue, won] = await Promise.all([
    prisma.lead.findMany({
      where: { firmId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { contact: true, owner: { select: { name: true } } },
    }),
    prisma.lead.count({ where: { firmId, stage: { notIn: ["WON", "LOST"] } } }),
    prisma.lead.aggregate({
      where: { firmId, stage: { notIn: ["WON", "LOST"] } },
      _sum: { value: true },
    }),
    prisma.lead.count({ where: { firmId, stage: "WON" } }),
  ]);

  const pipelineValue = totalValue._sum.value?.toNumber() ?? 0;

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Kpi label="Açık Fırsatlar" value={open} emphasized />
        <Kpi label="Pipeline Değeri" value={formatTRY(pipelineValue, { short: true })} />
        <Kpi label="Kazanılan" value={won} sub="tüm zamanlar" />
        <Kpi label="Dönüşüm" value={won === 0 ? "—" : `${Math.round((won / (won + open)) * 100)}%`} sub="tahmini" />
      </div>

      <SectionHead
        title="Fırsatlar"
        subtitle="Potansiyel müvekkil pipeline'ı"
        actions={
          <Link href="/bd/new" className="btn btn-primary">
            <Plus size={14} /> Yeni Fırsat
          </Link>
        }
      />

      {leads.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <TrendingUp size={28} className="text-juris-ink-3 mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">İlk fırsatınızı ekleyin</h3>
          <p className="text-sm text-juris-ink-3 max-w-md">
            LinkedIn, referans ya da web üzerinden gelen potansiyel müvekkilleri burada takip edin.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Başlık</th>
                <th className="text-left px-4 py-3 font-semibold">Müvekkil Adayı</th>
                <th className="text-left px-4 py-3 font-semibold">Aşama</th>
                <th className="text-left px-4 py-3 font-semibold">Değer</th>
                <th className="text-left px-4 py-3 font-semibold">Sahip</th>
                <th className="text-left px-4 py-3 font-semibold">Güncellendi</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                  <td className="px-4 py-3 font-medium text-juris-navy">{l.title}</td>
                  <td className="px-4 py-3 text-juris-ink-2">
                    {l.contact?.companyName ?? l.contact?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip">{leadStageLabel(l.stage)}</span>
                  </td>
                  <td className="px-4 py-3 mono text-juris-navy">
                    {l.value ? formatTRY(l.value.toString(), { short: true }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-juris-ink-2">{l.owner?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-juris-ink-3">
                    {formatDateTR(l.updatedAt)}
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
