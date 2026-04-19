import { SectionHead } from "@/components/ui/section-head";
import { ContentForm } from "../content-form";

export const metadata = { title: "Yeni İçerik · Pazarlama" };

export default function NewContentPage() {
  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto">
      <SectionHead
        title="Yeni İçerik"
        subtitle="Blog, LinkedIn, bülten, podcast — kanala göre taslak"
      />
      <ContentForm />
    </div>
  );
}
