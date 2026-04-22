import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, MapPin, Briefcase, Receipt, Pencil } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { matterStatusChip, invoiceStatusChip } from "@/lib/labels";
import { formatDateTR, formatTRY } from "@/lib/utils";

export const metadata = { title: "Kişi Detayı" };

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { firmId } = await requireTenant();

  const contact = await prisma.contact.findFirst({
    where: { id, firmId },
    include: {
      matters: { orderBy: { updatedAt: "desc" } },
      invoices: { orderBy: { issuedAt: "desc" } },
      leads: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!contact) notFound();

  const displayName =
    contact.type === "COMPANY"
      ? contact.companyName ?? contact.name
      : contact.name;
  const totalBilled = contact.invoices.reduce((s, i) => s + i.total.toNumber(), 0);

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <Breadcrumb
          crumbs={[
            { label: "Satış",   href: "/sales" },
            { label: "Kişiler", href: "/sales?view=liste" },
            { label: displayName },
          ]}
        />
      </div>

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="chip">{contact.type === "COMPANY" ? "Kurum" : "Birey"}</span>
            {contact.isClient && <span className="chip chip-green">Müvekkil</span>}
          </div>
          <h1 className="display text-[28px] text-juris-navy">{displayName}</h1>
          {contact.type === "COMPANY" && contact.companyName && (
            <div className="text-sm text-juris-ink-3 mt-1">Yetkili: {contact.name}</div>
          )}
        </div>
        <Link href={`/sales/${id}/edit`} className="btn btn-ghost">
          <Pencil size={14} /> Düzenle
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="İletişim" small />
            <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
              {contact.email && (
                <>
                  <dt className="text-juris-ink-3">E-posta</dt>
                  <dd>
                    <a href={`mailto:${contact.email}`} className="text-juris-navy hover:text-juris-red flex items-center gap-2">
                      <Mail size={14} /> {contact.email}
                    </a>
                  </dd>
                </>
              )}
              {contact.phone && (
                <>
                  <dt className="text-juris-ink-3">Telefon</dt>
                  <dd>
                    <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="text-juris-navy hover:text-juris-red flex items-center gap-2">
                      <Phone size={14} /> {contact.phone}
                    </a>
                  </dd>
                </>
              )}
              {contact.address && (
                <>
                  <dt className="text-juris-ink-3">Adres</dt>
                  <dd className="text-juris-ink-2 flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 text-juris-ink-4" />
                    {contact.address}
                  </dd>
                </>
              )}
              {contact.taxNumber && (
                <>
                  <dt className="text-juris-ink-3">Vergi No</dt>
                  <dd className="mono text-juris-ink-2">{contact.taxNumber}</dd>
                </>
              )}
              {contact.tcNumber && (
                <>
                  <dt className="text-juris-ink-3">TC Kimlik</dt>
                  <dd className="mono text-juris-ink-2">{contact.tcNumber}</dd>
                </>
              )}
            </dl>
            {contact.notes && (
              <>
                <div className="sep my-4" />
                <div className="label mb-2">Notlar</div>
                <p className="text-sm text-juris-ink-2 whitespace-pre-wrap">{contact.notes}</p>
              </>
            )}
          </div>

          <div className="card p-6">
            <SectionHead
              title="Dosyalar"
              small
              actions={
                <Link
                  href={`/ops/new?clientId=${id}`}
                  className="btn btn-sm btn-ghost"
                >
                  + Yeni Dosya
                </Link>
              }
            />
            {contact.matters.length === 0 ? (
              <div className="text-sm text-juris-ink-3 py-4 text-center">
                Bu kişiye bağlı dosya yok.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-juris-line-2">
                {contact.matters.map((m) => {
                  const chip = matterStatusChip(m.status);
                  return (
                    <Link
                      key={m.id}
                      href={`/ops/${m.id}`}
                      className="py-3 flex items-center gap-3 hover:bg-juris-paper-2 -mx-2 px-2 rounded transition-colors"
                    >
                      <Briefcase size={14} className="text-juris-ink-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-juris-navy truncate">
                          {m.title}
                        </div>
                        <div className="text-[11px] text-juris-ink-4 mono">{m.matterNumber}</div>
                      </div>
                      <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-6">
            <SectionHead title="Faturalar" small />
            {contact.invoices.length === 0 ? (
              <div className="text-sm text-juris-ink-3 py-4 text-center">Fatura yok.</div>
            ) : (
              <div className="flex flex-col divide-y divide-juris-line-2">
                {contact.invoices.map((inv) => {
                  const chip = invoiceStatusChip(inv.status);
                  return (
                    <div key={inv.id} className="py-3 flex items-center gap-3">
                      <Receipt size={14} className="text-juris-ink-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold mono">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-juris-ink-4">
                          {formatDateTR(inv.issuedAt)}
                        </div>
                      </div>
                      <div className="mono text-sm font-semibold text-juris-navy">
                        {formatTRY(inv.total.toString())}
                      </div>
                      <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: summary */}
        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Özet" small />
            <dl className="grid grid-cols-[130px_1fr] gap-y-2.5 text-sm">
              <dt className="text-juris-ink-3">Aktif Dosya</dt>
              <dd className="font-semibold text-juris-navy">
                {contact.matters.filter((m) => m.status === "ACTIVE").length}
              </dd>
              <dt className="text-juris-ink-3">Toplam Dosya</dt>
              <dd>{contact.matters.length}</dd>
              <dt className="text-juris-ink-3">Toplam Fatura</dt>
              <dd className="mono font-semibold text-juris-navy">
                {formatTRY(totalBilled, { short: true })}
              </dd>
              <dt className="text-juris-ink-3">Kayıt</dt>
              <dd className="text-juris-ink-2">{formatDateTR(contact.createdAt)}</dd>
            </dl>
          </div>

          {contact.leads.length > 0 && (
            <div className="card p-6">
              <SectionHead title="Fırsatlar" small />
              <ul className="flex flex-col gap-2 text-sm">
                {contact.leads.map((l) => (
                  <li key={l.id}>
                    <div className="font-medium text-juris-navy">{l.title}</div>
                    <div className="text-[11px] text-juris-ink-4">{l.stage}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
