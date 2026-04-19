import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { MatterForm } from "../matter-form";
import { SectionHead } from "@/components/ui/section-head";

export const metadata = { title: "Yeni Dosya" };

export default async function NewMatterPage() {
  const { firmId } = await requireTenant();
  const clients = await prisma.contact.findMany({
    where: { firmId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, companyName: true, type: true },
  });

  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto">
      <SectionHead
        title="Yeni Dosya"
        subtitle="Yeni bir dava veya danışmanlık dosyası oluşturun"
      />
      <MatterForm clients={clients} />
    </div>
  );
}
