import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { invoiceStatusChip } from "@/lib/labels";
import { formatTRY, formatDateTR } from "@/lib/utils";
import { Wallet, Plus } from "lucide-react";
import Link from "next/link";
import { startOfMonth, endOfMonth } from "date-fns";

export const metadata = { title: "Finans" };

export default async function FinancePage() {
  const { firmId } = await requireTenant();
  const now = new Date();

  const [invoices, paidMonth, sentMonth, overdue] = await Promise.all([
    prisma.invoice.findMany({
      where: { firmId },
      orderBy: { issuedAt: "desc" },
      take: 50,
      include: { client: true, matter: { select: { matterNumber: true, title: true } } },
    }),
    prisma.invoice.aggregate({
      where: { firmId, status: "PAID", paidAt: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { firmId, status: { in: ["SENT", "PAID"] }, issuedAt: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { firmId, status: "OVERDUE" },
      _sum: { total: true },
    }),
  ]);

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Kpi label="Bu Ay Tahsilat" value={formatTRY(paidMonth._sum.total?.toNumber() ?? 0, { short: true })} emphasized />
        <Kpi label="Bu Ay Kesim" value={formatTRY(sentMonth._sum.total?.toNumber() ?? 0, { short: true })} />
        <Kpi label="Geciken" value={formatTRY(overdue._sum.total?.toNumber() ?? 0, { short: true })} />
        <Kpi label="Fatura Sayısı" value={invoices.length} sub="son 50" />
      </div>

      <SectionHead
        title="Faturalar"
        subtitle="Kesilen ve planlanan faturalar"
        actions={
          <Link href="/finance/new" className="btn btn-primary">
            <Plus size={14} /> Yeni Fatura
          </Link>
        }
      />

      {invoices.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <Wallet size={28} className="text-juris-ink-3 mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">Fatura yok</h3>
          <p className="text-sm text-juris-ink-3 max-w-md">
            İlk faturanızı oluşturduğunuzda burada listelenecek.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">No</th>
                <th className="text-left px-4 py-3 font-semibold">Müvekkil</th>
                <th className="text-left px-4 py-3 font-semibold">Dosya</th>
                <th className="text-right px-4 py-3 font-semibold">Tutar</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-left px-4 py-3 font-semibold">Vade</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const chip = invoiceStatusChip(inv.status);
                return (
                  <tr key={inv.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                    <td className="px-4 py-3 mono font-semibold text-juris-navy text-xs">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-juris-ink-2">
                      {inv.client?.companyName ?? inv.client?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-juris-ink-3">
                      {inv.matter ? `${inv.matter.matterNumber}` : "—"}
                    </td>
                    <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                      {formatTRY(inv.total.toString())}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-juris-ink-3">
                      {formatDateTR(inv.dueAt)}
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
