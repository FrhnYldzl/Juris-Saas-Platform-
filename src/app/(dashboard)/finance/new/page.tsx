import Link from "next/link";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { InvoiceForm } from "../invoice-form";

export const metadata = { title: "Yeni Fatura · Finans" };

export default async function NewInvoicePage() {
  const { firmId } = await requireTenant();

  const [clients, matters] = await Promise.all([
    prisma.contact.findMany({
      where: { firmId, isClient: true },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, companyName: true, type: true,
        _count: { select: { matters: true } },
      },
    }),
    prisma.matter.findMany({
      where: { firmId, status: { in: ["ACTIVE", "ON_HOLD"] } },
      orderBy: { matterNumber: "desc" },
      select: { id: true, matterNumber: true, title: true, clientId: true },
    }),
  ]);

  const clientOpts = clients.map((c) => ({
    id: c.id,
    label: c.type === "COMPANY" ? c.companyName ?? c.name : c.name,
    hasMatters: c._count.matters > 0,
  }));

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto">
      <SectionHead
        title="Yeni Fatura"
        subtitle="Müvekkil + kalemler + KDV"
      />
      {clientOpts.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-juris-ink-3 mb-4">
            Önce müvekkil kaydı oluşturmanız gerekiyor. Satış → Yeni Kişi adımıyla
            başlayın, &ldquo;Müvekkil mi?&rdquo; kutusunu işaretleyin.
          </p>
          <Link href="/sales/new" className="btn btn-primary">Yeni Müvekkil Ekle</Link>
        </div>
      ) : (
        <InvoiceForm clients={clientOpts} matters={matters} />
      )}
    </div>
  );
}
