import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { invoiceStatusChip } from "@/lib/labels";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { InvoiceActions } from "./invoice-actions";

export const metadata = { title: "Fatura Detayı" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { firmId } = await requireTenant();

  const invoice = await prisma.invoice.findFirst({
    where: { id, firmId },
    include: {
      client: true,
      matter: { select: { id: true, matterNumber: true, title: true } },
      items: true,
    },
  });
  if (!invoice) notFound();

  const chip = invoiceStatusChip(invoice.status);
  const clientDisplay =
    invoice.client?.type === "COMPANY"
      ? invoice.client.companyName ?? invoice.client.name
      : invoice.client?.name ?? "—";

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto">
      <div className="mb-4">
        <Breadcrumb
          crumbs={[
            { label: "Finans",     href: "/finance" },
            { label: "Faturalar",  href: "/finance?tab=tahsilat" },
            { label: invoice.invoiceNumber },
          ]}
        />
      </div>

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
            <span className="mono text-sm text-juris-ink-3">{invoice.invoiceNumber}</span>
          </div>
          <h1 className="display text-[28px] text-juris-navy">
            {clientDisplay}
          </h1>
          {invoice.matter && (
            <div className="text-sm text-juris-ink-3 mt-1">
              <Link href={`/ops/${invoice.matter.id}`} className="hover:text-juris-red">
                <span className="mono">{invoice.matter.matterNumber}</span> · {invoice.matter.title}
              </Link>
            </div>
          )}
        </div>
        <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Kalemler" small />
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-juris-ink-3">
                <tr className="border-b border-juris-line-2">
                  <th className="text-left py-2 font-semibold">Açıklama</th>
                  <th className="text-right py-2 font-semibold w-[90px]">Miktar</th>
                  <th className="text-right py-2 font-semibold w-[130px]">Birim</th>
                  <th className="text-right py-2 font-semibold w-[130px]">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it) => (
                  <tr key={it.id} className="border-b border-juris-line-2">
                    <td className="py-3 text-juris-ink-2">{it.description}</td>
                    <td className="py-3 text-right mono">{it.quantity.toString()}</td>
                    <td className="py-3 text-right mono">{formatTRY(it.unitPrice.toString())}</td>
                    <td className="py-3 text-right mono font-semibold text-juris-navy">
                      {formatTRY(it.total.toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 flex justify-end">
              <div className="flex flex-col gap-2 min-w-[280px] text-sm">
                <div className="flex justify-between">
                  <span className="text-juris-ink-3">Ara Toplam</span>
                  <span className="mono">{formatTRY(invoice.subtotal.toString())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-juris-ink-3">KDV (%{invoice.taxRate.toString()})</span>
                  <span className="mono">{formatTRY(invoice.tax.toString())}</span>
                </div>
                <div className="sep my-1" />
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">Genel Toplam</span>
                  <span className="mono text-lg font-semibold text-juris-navy">
                    {formatTRY(invoice.total.toString())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="card p-6">
              <SectionHead title="Notlar" small />
              <p className="text-sm text-juris-ink-2 whitespace-pre-wrap leading-relaxed">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Özet" small />
            <dl className="grid grid-cols-[130px_1fr] gap-y-2.5 text-sm">
              <dt className="text-juris-ink-3">Müvekkil</dt>
              <dd>
                {invoice.clientId && (
                  <Link href={`/sales/${invoice.clientId}`} className="text-juris-navy hover:text-juris-red font-medium">
                    {clientDisplay}
                  </Link>
                )}
              </dd>
              <dt className="text-juris-ink-3">Düzenleme</dt>
              <dd>{formatDateTR(invoice.issuedAt)}</dd>
              <dt className="text-juris-ink-3">Vade</dt>
              <dd>{formatDateTR(invoice.dueAt)}</dd>
              {invoice.paidAt && (
                <>
                  <dt className="text-juris-ink-3">Ödeme</dt>
                  <dd className="text-juris-success font-medium">
                    {formatDateTR(invoice.paidAt)}
                  </dd>
                </>
              )}
              <dt className="text-juris-ink-3">Para Birimi</dt>
              <dd className="mono">{invoice.currency}</dd>
              {invoice.gibUuid && (
                <>
                  <dt className="text-juris-ink-3">GİB UUID</dt>
                  <dd className="mono text-[11px] break-all">{invoice.gibUuid}</dd>
                </>
              )}
            </dl>
          </div>

          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost justify-center"
          >
            <Download size={14} /> PDF İndir
          </a>
        </div>
      </div>
    </div>
  );
}
