import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { LeadForm } from "../lead-form";

export const metadata = { title: "Yeni Fırsat · BD" };

export default async function NewLeadPage() {
  const { firmId } = await requireTenant();

  const [contacts, users] = await Promise.all([
    prisma.contact.findMany({
      where: { firmId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, companyName: true, type: true },
    }),
    prisma.user.findMany({
      where: { firmId, active: true, role: { not: "CLIENT" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const contactOpts = contacts.map((c) => ({
    id: c.id,
    label: c.type === "COMPANY" ? c.companyName ?? c.name : c.name,
  }));

  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto">
      <SectionHead
        title="Yeni Fırsat"
        subtitle="Müvekkil adayı + beklenen değer + aşama"
      />
      <LeadForm contacts={contactOpts} users={users} />
    </div>
  );
}
