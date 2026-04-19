import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { ContactForm } from "../../contact-form";

export const metadata = { title: "Kişi Düzenle" };

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { firmId } = await requireTenant();
  const contact = await prisma.contact.findFirst({ where: { id, firmId } });
  if (!contact) notFound();

  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto">
      <SectionHead
        title="Kişi Düzenle"
        subtitle={contact.type === "COMPANY" ? contact.companyName ?? contact.name : contact.name}
      />
      <ContactForm
        contact={{
          id: contact.id,
          type: contact.type,
          name: contact.name,
          companyName: contact.companyName,
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          taxNumber: contact.taxNumber,
          tcNumber: contact.tcNumber,
          isClient: contact.isClient,
          notes: contact.notes,
        }}
      />
    </div>
  );
}
