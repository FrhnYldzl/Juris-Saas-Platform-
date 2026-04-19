import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { formatTRY } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";

export const metadata = { title: "Komuta Merkezi" };

export default async function CommandPage() {
  const { firmId, name } = await requireTenant();

  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);

  const [activeMatters, openLeads, invoicedThisMonth, upcomingHearings] = await Promise.all([
    prisma.matter.count({ where: { firmId, status: "ACTIVE" } }),
    prisma.lead.count({
      where: { firmId, stage: { notIn: ["WON", "LOST"] } },
    }),
    prisma.invoice.aggregate({
      where: { firmId, issuedAt: { gte: mStart, lte: mEnd }, status: { in: ["SENT", "PAID"] } },
      _sum: { total: true },
    }),
    prisma.calendarEvent.count({
      where: { firmId, type: "HEARING", startsAt: { gte: now } },
    }),
  ]);

  const invoiced = invoicedThisMonth._sum.total?.toNumber() ?? 0;
  const firstName = name.split(" ")[0] ?? name;

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="mb-7">
        <div className="display text-[28px] text-juris-navy">İyi günler, {firstName}.</div>
        <div className="text-sm text-juris-ink-3 mt-1">
          Firmanızın günlük durumu. Tüm modüllerden beslenen özet.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <Kpi
          label="Aktif Dosyalar"
          value={activeMatters}
          sub="tüm statüler"
          emphasized
        />
        <Kpi
          label="Açık Fırsatlar"
          value={openLeads}
          sub="CRM'de pipeline"
        />
        <Kpi
          label="Bu Ay Fatura"
          value={formatTRY(invoiced, { short: true })}
          sub="gönderilen + ödenen"
        />
        <Kpi
          label="Yaklaşan Duruşma"
          value={upcomingHearings}
          sub="30 gün içinde"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <SectionHead
            title="Bugünün Gündemi"
            subtitle="Toplantılar, duruşmalar, son tarihler"
            small
          />
          <div className="text-sm text-juris-ink-3 py-8 text-center">
            Bugün için kayıtlı etkinlik yok.
          </div>
        </div>

        <div className="card p-6">
          <SectionHead
            title="Son Hareketler"
            subtitle="Ekipten son güncellemeler"
            small
          />
          <div className="text-sm text-juris-ink-3 py-8 text-center">
            Henüz hareket yok. Dosya, müvekkil ya da fatura eklediğinizde burada görüneceksiniz.
          </div>
        </div>
      </div>
    </div>
  );
}
