import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { matterStatusChip, matterTypeLabel } from "@/lib/labels";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { ChevronLeft, FileText, Clock, Scale } from "lucide-react";

export const metadata = { title: "Dosya Detayı" };

export default async function MatterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { firmId } = await requireTenant();

  const matter = await prisma.matter.findFirst({
    where: { id, firmId },
    include: {
      client: true,
      assignees: { include: { user: { select: { id: true, name: true } } } },
      documents: { orderBy: { createdAt: "desc" }, take: 10 },
      events: { orderBy: { startsAt: "asc" }, take: 10, where: { startsAt: { gte: new Date() } } },
      invoices: { orderBy: { issuedAt: "desc" } },
      timeEntries: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });

  if (!matter) notFound();

  const chip = matterStatusChip(matter.status);
  const totalBilled = matter.invoices.reduce((s, i) => s + i.total.toNumber(), 0);
  const totalHours = matter.timeEntries.reduce((s, t) => s + t.durationMin, 0) / 60;

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      <Link href="/ops" className="inline-flex items-center gap-1 text-xs text-juris-ink-3 hover:text-juris-navy mb-4">
        <ChevronLeft size={14} /> Dosyalar
      </Link>

      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="mono text-xs text-juris-ink-3">{matter.matterNumber}</span>
            <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
            <span className="chip">{matterTypeLabel(matter.type)}</span>
          </div>
          <h1 className="display text-[28px] text-juris-navy">{matter.title}</h1>
          {matter.client && (
            <div className="text-sm text-juris-ink-3 mt-1">
              {matter.client.type === "COMPANY"
                ? matter.client.companyName ?? matter.client.name
                : matter.client.name}
            </div>
          )}
        </div>
        <Link href={`/ops/${id}/edit`} className="btn btn-ghost">Düzenle</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Özet" small />
            <dl className="grid grid-cols-[160px_1fr] gap-y-2.5 text-sm">
              <dt className="text-juris-ink-3">Açıklama</dt>
              <dd className="text-juris-ink-2 leading-relaxed">
                {matter.description ?? "—"}
              </dd>
              <dt className="text-juris-ink-3">Karşı Taraf</dt>
              <dd className="text-juris-ink-2">{matter.opposingParty ?? "—"}</dd>
              <dt className="text-juris-ink-3">Mahkeme</dt>
              <dd className="text-juris-ink-2">{matter.courtName ?? "—"}</dd>
              <dt className="text-juris-ink-3">Esas No</dt>
              <dd className="mono text-juris-ink-2">{matter.courtFileNo ?? "—"}</dd>
              <dt className="text-juris-ink-3">Açılış</dt>
              <dd className="text-juris-ink-2">{formatDateTR(matter.openedAt)}</dd>
              {matter.closedAt && (
                <>
                  <dt className="text-juris-ink-3">Kapanış</dt>
                  <dd className="text-juris-ink-2">{formatDateTR(matter.closedAt)}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="card p-6">
            <SectionHead title="Belgeler" small />
            {matter.documents.length === 0 ? (
              <div className="text-sm text-juris-ink-3 py-4 text-center">Belge yok</div>
            ) : (
              <div className="flex flex-col divide-y divide-juris-line-2">
                {matter.documents.map((d) => (
                  <div key={d.id} className="py-2.5 flex items-center gap-3">
                    <FileText size={16} className="text-juris-ink-3" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{d.name}</div>
                      <div className="text-[11px] text-juris-ink-4">
                        {formatDateTR(d.createdAt)} · {(d.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <SectionHead title="Zaman Kayıtları" small />
            {matter.timeEntries.length === 0 ? (
              <div className="text-sm text-juris-ink-3 py-4 text-center">Kayıt yok</div>
            ) : (
              <div className="flex flex-col divide-y divide-juris-line-2">
                {matter.timeEntries.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center gap-3 text-sm">
                    <Clock size={14} className="text-juris-ink-3" />
                    <div className="flex-1">{t.description}</div>
                    <div className="mono text-juris-navy">
                      {(t.durationMin / 60).toFixed(1)}h
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side */}
        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Ücret & Faturalama" small />
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="text-juris-ink-3">Yöntem</dt>
              <dd className="text-juris-ink-2">
                {matter.billingType === "HOURLY" ? "Saatlik"
                  : matter.billingType === "FLAT_FEE" ? "Sabit"
                  : matter.billingType === "CONTINGENCY" ? "Başarı"
                  : "Retainer"}
              </dd>
              {matter.hourlyRate && (
                <>
                  <dt className="text-juris-ink-3">Saatlik</dt>
                  <dd className="mono">{formatTRY(matter.hourlyRate.toString())}/sa</dd>
                </>
              )}
              {matter.flatFee && (
                <>
                  <dt className="text-juris-ink-3">Sabit</dt>
                  <dd className="mono">{formatTRY(matter.flatFee.toString())}</dd>
                </>
              )}
              <dt className="text-juris-ink-3">Toplam Saat</dt>
              <dd className="mono">{totalHours.toFixed(1)}h</dd>
              <dt className="text-juris-ink-3">Faturalanan</dt>
              <dd className="mono font-semibold text-juris-navy">
                {formatTRY(totalBilled, { short: true })}
              </dd>
            </dl>
          </div>

          <div className="card p-6">
            <SectionHead title="Sorumlular" small />
            {matter.assignees.length === 0 ? (
              <div className="text-sm text-juris-ink-3">—</div>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {matter.assignees.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="text-juris-ink-2">{a.user.name}</span>
                    <span className="text-[11px] text-juris-ink-4">{a.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-6">
            <SectionHead title="Yaklaşan Etkinlikler" small />
            {matter.events.length === 0 ? (
              <div className="text-sm text-juris-ink-3">Yok</div>
            ) : (
              <ul className="flex flex-col gap-2">
                {matter.events.map((e) => (
                  <li key={e.id} className="text-sm">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-[11px] text-juris-ink-4">
                      {formatDateTR(e.startsAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
