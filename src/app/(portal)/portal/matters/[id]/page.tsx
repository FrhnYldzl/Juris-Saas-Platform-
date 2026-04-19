import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Scale, Calendar, Receipt, FileText, Download, Gavel } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { matterStatusChip, matterTypeLabel, invoiceStatusChip, eventTypeLabel } from "@/lib/labels";
import { formatDateTR, formatTRY, formatDateTimeTR } from "@/lib/utils";
import { MessagesPanel } from "@/components/messaging/messages-panel";

export const metadata = { title: "Dosya · Müvekkil Portalı" };

export default async function PortalMatterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { firmId, email } = await requireTenant();

  const matter = await prisma.matter.findFirst({
    where: {
      id,
      firmId,
      client: { email: { equals: email, mode: "insensitive" } },
    },
    include: {
      client: true,
      documents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, mimeType: true, size: true, category: true, createdAt: true,
        },
      },
      invoices: { orderBy: { issuedAt: "desc" } },
      events: {
        orderBy: { startsAt: "asc" },
        where: { startsAt: { gte: new Date(Date.now() - 30 * 86400000) } },
        take: 10,
      },
    },
  });

  if (!matter) notFound();
  const chip = matterStatusChip(matter.status);

  return (
    <>
      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-xs text-juris-ink-3 hover:text-juris-navy mb-4"
      >
        <ChevronLeft size={14} /> Portal
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="mono text-xs text-juris-ink-3">{matter.matterNumber}</span>
          <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
          <span className="chip">{matterTypeLabel(matter.type)}</span>
        </div>
        <h1 className="display text-[28px] text-juris-navy">{matter.title}</h1>
        {matter.courtName && (
          <div className="text-sm text-juris-ink-3 mt-1 flex items-center gap-1.5">
            <Scale size={13} /> {matter.courtName}
            {matter.courtFileNo && <span className="mono ml-1">· {matter.courtFileNo}</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MessagesPanel
            matterId={matter.id}
            title="Avukatınızla Yazışma"
            subtitle="Sorularınızı iletin, güvenli kanaldan yanıtlanır"
            emptyLabel="Henüz mesaj yok. Avukatınıza ilk mesajı yazın."
          />

          <div className="card p-6">
            <SectionHead title="Belgeler" small />
            {matter.documents.length === 0 ? (
              <div className="text-sm text-juris-ink-3 py-4 text-center">Belge yok.</div>
            ) : (
              <div className="flex flex-col divide-y divide-juris-line-2">
                {matter.documents.map((d) => (
                  <div key={d.id} className="py-3 flex items-center gap-3">
                    <FileText size={16} className="text-juris-ink-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-juris-navy truncate">{d.name}</div>
                      <div className="text-[11px] text-juris-ink-4 mt-0.5">
                        {formatDateTR(d.createdAt)} · {(d.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <a
                      href={`/api/documents/${d.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-ghost"
                    >
                      <Download size={12} /> İndir
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {matter.invoices.length > 0 && (
            <div className="card p-6">
              <SectionHead title="Faturalar" small />
              <div className="flex flex-col divide-y divide-juris-line-2">
                {matter.invoices.map((inv) => {
                  const ic = invoiceStatusChip(inv.status);
                  return (
                    <div key={inv.id} className="py-3 flex items-center gap-3">
                      <Receipt size={16} className="text-juris-ink-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="mono text-sm font-semibold text-juris-navy">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-juris-ink-4 mt-0.5">
                          {formatDateTR(inv.issuedAt)}
                          {inv.dueAt && ` · Vade: ${formatDateTR(inv.dueAt)}`}
                        </div>
                      </div>
                      <div className="mono text-sm font-semibold text-juris-navy">
                        {formatTRY(inv.total.toString())}
                      </div>
                      <span className={`chip chip-${ic.tone}`}>{ic.label}</span>
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-ghost"
                      >
                        <Download size={12} /> PDF
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Özet" small />
            <dl className="grid grid-cols-[130px_1fr] gap-y-2.5 text-sm">
              <dt className="text-juris-ink-3">Açılış</dt>
              <dd>{formatDateTR(matter.openedAt)}</dd>
              {matter.nextHearingAt && (
                <>
                  <dt className="text-juris-ink-3">Duruşma</dt>
                  <dd className="text-juris-red font-semibold">
                    {formatDateTR(matter.nextHearingAt)}
                  </dd>
                </>
              )}
              {matter.opposingParty && (
                <>
                  <dt className="text-juris-ink-3">Karşı Taraf</dt>
                  <dd className="text-juris-ink-2">{matter.opposingParty}</dd>
                </>
              )}
            </dl>
            {matter.description && (
              <>
                <div className="sep my-4" />
                <p className="text-xs text-juris-ink-2 whitespace-pre-wrap leading-relaxed">
                  {matter.description}
                </p>
              </>
            )}
          </div>

          {matter.events.length > 0 && (
            <div className="card p-6">
              <SectionHead title="Takvim" small />
              <ul className="flex flex-col divide-y divide-juris-line-2">
                {matter.events.map((e) => (
                  <li key={e.id} className="py-2.5 flex items-start gap-2">
                    {e.type === "HEARING" ? (
                      <Gavel size={13} className="text-juris-red mt-0.5 flex-shrink-0" />
                    ) : (
                      <Calendar size={13} className="text-juris-ink-3 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-juris-navy">{e.title}</div>
                      <div className="text-[11px] text-juris-ink-4 mt-0.5">
                        {e.allDay ? formatDateTR(e.startsAt) : formatDateTimeTR(e.startsAt)}
                        {" · "}{eventTypeLabel(e.type)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
