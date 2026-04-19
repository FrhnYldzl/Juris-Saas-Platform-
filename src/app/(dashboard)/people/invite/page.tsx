import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/tenancy";
import { can } from "@/lib/rbac";
import { SectionHead } from "@/components/ui/section-head";
import { InviteForm } from "./invite-form";

export const metadata = { title: "Üye Davet Et" };

export default async function InvitePage() {
  const { role } = await requireTenant();
  if (!can(role, "user.invite")) redirect("/people");

  return (
    <div className="px-6 py-8 max-w-[700px] mx-auto">
      <SectionHead
        title="Üye Davet Et"
        subtitle="Yeni avukat, stajyer veya idari personel ekle"
      />
      <InviteForm canAssignOwner={role === "OWNER"} />
    </div>
  );
}
