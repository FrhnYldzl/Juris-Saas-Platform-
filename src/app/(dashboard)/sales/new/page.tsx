import { SectionHead } from "@/components/ui/section-head";
import { ContactForm } from "../contact-form";

export const metadata = { title: "Yeni Kişi · Satış" };

export default function NewContactPage() {
  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto">
      <SectionHead
        title="Yeni Kişi"
        subtitle="Müvekkil, müvekkil adayı veya iş ortağı kaydı"
      />
      <ContactForm />
    </div>
  );
}
