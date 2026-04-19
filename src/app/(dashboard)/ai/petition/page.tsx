import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/tenancy";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { PetitionDraftForm } from "./petition-form";

export const metadata = { title: "Dilekçe Taslağı · AI" };

export default async function PetitionPage() {
  const { firmId, role } = await requireTenant();
  if (!can(role, "ai.use")) redirect("/command");

  const matters = await prisma.matter.findMany({
    where: { firmId, status: { in: ["ACTIVE", "ON_HOLD"] } },
    orderBy: { matterNumber: "desc" },
    select: { id: true, matterNumber: true, title: true },
    take: 100,
  });

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto">
      <SectionHead
        title="Dilekçe Taslağı"
        subtitle="AI, verdiğiniz bilgileri kullanarak mahkemeye sunulabilir kalitede bir dilekçe taslağı üretir. Çıktı her zaman avukat kontrolünden geçmelidir."
      />
      <PetitionDraftForm matters={matters} />
    </div>
  );
}
