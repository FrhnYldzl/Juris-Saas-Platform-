import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Trophy } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { leadStageLabel } from "@/lib/labels";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { ConvertButton } from "./convert-button";

export const metadata = { title: "Fırsat Detayı" };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { firmId } = await requireTenant();

  const lead = await prisma.lead.findFirst({
    where: { id, firmId },
    include: {
      contact: true,
      owner: { select: { name: true } },
    },
  });
  if (!lead) notFound();

  const stageTone =
    lead.stage === "WON" ? "green" :
    lead.stage === "LOST" ? "red" :
    lead.stage === "NEGOTIATION" || lead.stage === "PROPOSAL" ? "amber" :
    "";

  const canConvert = lead.stage !== "WON" && lead.stage !== "LOST";

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto">
      <div className="mb-4">
        <Breadcrumb
          crumbs={[
            { label: "Satış",     href: "/sales" },
            { label: "Pipeline",  href: "/sales" },
            { label: lead.title },
          ]}
        />
      </div>

      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className={`chip chip-${stageTone}`}>{leadStageLabel(lead.stage)}</span>
            {lead.source && <span className="chip">{lead.source}</span>}
            <span className="text-[11px] text-juris-ink-4">
              %{lead.probability} olasılık
            </span>
          </div>
          <h1 className="display text-[28px] text-juris-navy">{lead.title}</h1>
          {lead.contact && (
            <div className="text-sm text-juris-ink-3 mt-1">
              <Link href={`/sales/${lead.contact.id}`} className="hover:text-juris-red">
                {lead.contact.type === "COMPANY"
                  ? lead.contact.companyName ?? lead.contact.name
                  : lead.contact.name}
              </Link>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {canConvert && lead.contact && (
            <ConvertButton
              leadId={lead.id}
              defaultTitle={lead.title}
              contactName={
                lead.contact.type === "COMPANY"
                  ? lead.contact.companyName ?? lead.contact.name
                  : lead.contact.name
              }
            />
          )}
          <Link href={`/bd/${id}/edit`} className="btn btn-ghost">
            <Pencil size={14} /> Düzenle
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Açıklama" small />
            <p className="text-sm text-juris-ink-2 whitespace-pre-wrap leading-relaxed">
              {lead.description ?? "—"}
            </p>
          </div>

          {!canConvert && lead.stage === "WON" && (
            <div
              className="rounded-lg p-6 border flex items-start gap-3"
              style={{ background: "var(--success-bg)", borderColor: "rgba(31,122,78,0.2)" }}
            >
              <Trophy className="text-juris-success flex-shrink-0 mt-0.5" size={20} />
              <div>
                <div className="font-semibold text-juris-success mb-1">Kazanıldı</div>
                <div className="text-sm text-juris-ink-2">
                  Bu fırsat müvekkile dönüştürüldü. Bağlı dosyalara Dosyalar sekmesinden ulaşabilirsiniz.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Özet" small />
            <dl className="grid grid-cols-[130px_1fr] gap-y-2.5 text-sm">
              <dt className="text-juris-ink-3">Değer</dt>
              <dd className="mono font-semibold text-juris-navy">
                {lead.value ? formatTRY(lead.value.toString()) : "—"}
              </dd>
              <dt className="text-juris-ink-3">Olasılık</dt>
              <dd>%{lead.probability}</dd>
              <dt className="text-juris-ink-3">Beklenen</dt>
              <dd>{formatDateTR(lead.expectedCloseAt)}</dd>
              <dt className="text-juris-ink-3">Sahip</dt>
              <dd className="text-juris-ink-2">{lead.owner?.name ?? "—"}</dd>
              <dt className="text-juris-ink-3">Oluşturuldu</dt>
              <dd className="text-juris-ink-2">{formatDateTR(lead.createdAt)}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
