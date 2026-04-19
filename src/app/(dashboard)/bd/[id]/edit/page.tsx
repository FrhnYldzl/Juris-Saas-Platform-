import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { LeadForm } from "../../lead-form";

export const metadata = { title: "Fırsat Düzenle" };

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { firmId } = await requireTenant();

  const [lead, contacts, users] = await Promise.all([
    prisma.lead.findFirst({ where: { id, firmId } }),
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
  if (!lead) notFound();

  const contactOpts = contacts.map((c) => ({
    id: c.id,
    label: c.type === "COMPANY" ? c.companyName ?? c.name : c.name,
  }));

  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto">
      <SectionHead title="Fırsat Düzenle" subtitle={lead.title} />
      <LeadForm
        lead={{
          id: lead.id,
          title: lead.title,
          contactId: lead.contactId,
          ownerId: lead.ownerId,
          source: lead.source,
          stage: lead.stage,
          value: lead.value?.toString() ?? null,
          probability: lead.probability,
          expectedCloseAt: lead.expectedCloseAt,
          description: lead.description,
        }}
        contacts={contactOpts}
        users={users}
      />
    </div>
  );
}
