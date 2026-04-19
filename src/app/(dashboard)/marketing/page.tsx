import { SectionHead } from "@/components/ui/section-head";
import { Kpi } from "@/components/ui/kpi";
import { EmptyState } from "@/components/ui/empty-state";
import { Megaphone } from "lucide-react";

export const metadata = { title: "Pazarlama" };

export default function MarketingPage() {
  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Kpi label="Trafik (30g)" value="—" sub="GA4 bağlanınca" emphasized />
        <Kpi label="SEO Pozisyon" value="—" sub="GSC bağlanınca" />
        <Kpi label="İçerik" value="—" sub="yayınlanan" />
        <Kpi label="Sosyal" value="—" sub="takipçi" />
      </div>
      <SectionHead
        title="İçerik & Kanallar"
        subtitle="Google Analytics, Search Console, LinkedIn ve WordPress entegrasyonları"
      />
      <div className="card">
        <EmptyState
          icon={Megaphone}
          title="Pazarlama entegrasyonları bekleniyor"
          description="Entegrasyonlar sayfasından GA4, Search Console, LinkedIn ve WordPress'i bağlayın. Veriler otomatik akmaya başlayacak."
        />
      </div>
    </div>
  );
}
