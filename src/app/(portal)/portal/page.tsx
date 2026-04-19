import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { matterStatusChip } from "@/lib/labels";
import { formatDateTR, formatTRY } from "@/lib/utils";

export const metadata = { title: "Portal" };

export default async function ClientPortalPage() {
  const { firmId, email } = await requireTenant();

  const contact = await prisma.contact.findFirst({
    where: { firmId, email, isClient: true },
    include: {
      matters: { orderBy: { updatedAt: "desc" } },
      invoices: { orderBy: { issuedAt: "desc" } },
    },
  });

  if (!contact) {
    return (
      <div className="card p-12 text-center">
        <h2 className="display text-xl text-juris-navy mb-2">Müvekkil kaydı bulunamadı</h2>
        <p className="text-sm text-juris-ink-3">
          Portal erişiminiz için avukatınızla görüşün.
        </p>
      </div>
    );
  }

  const openMatters = contact.matters.filter((m) => m.status === "ACTIVE").length;
  const unpaid = contact.invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((s, i) => s + i.total.toNumber(), 0);

  return (
    <>
      <div className="mb-7">
        <div className="display text-[28px] text-juris-navy">Hoş geldiniz, {contact.name}</div>
        <div className="text-sm text-juris-ink-3 mt-1">
          Dosyalarınız, belgeleriniz ve faturalarınız
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        <Kpi label="Açık Dosya" value={openMatters} emphasized />
        <Kpi label="Tüm Dosyalar" value={contact.matters.length} />
        <Kpi label="Bekleyen Tutar" value={formatTRY(unpaid, { short: true })} />
      </div>

      <SectionHead title="Dosyalarınız" small />
      <div className="card overflow-hidden mb-8">
        {contact.matters.length === 0 ? (
          <div className="p-8 text-center text-sm text-juris-ink-3">Dosya yok</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Dosya No</th>
                <th className="text-left px-4 py-3 font-semibold">Başlık</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-left px-4 py-3 font-semibold">Açılış</th>
              </tr>
            </thead>
            <tbody>
              {contact.matters.map((m) => {
                const chip = matterStatusChip(m.status);
                return (
                  <tr key={m.id} className="border-t border-juris-line-2">
                    <td className="px-4 py-3 mono text-xs text-juris-navy">{m.matterNumber}</td>
                    <td className="px-4 py-3 font-medium">{m.title}</td>
                    <td className="px-4 py-3">
                      <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-juris-ink-3">
                      {formatDateTR(m.openedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
