import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";

export const metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const { firmId } = await requireTenant();
  const firm = await prisma.firm.findUnique({ where: { id: firmId } });
  if (!firm) return null;

  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto">
      <SectionHead title="Firma Ayarları" subtitle="Firma bilgileri, yetkiler, veri politikası" />

      <div className="card p-6 mb-5">
        <h4 className="label mb-3">Firma Bilgileri</h4>
        <dl className="grid grid-cols-[180px_1fr] gap-y-3 text-sm">
          <dt className="text-juris-ink-3">Firma Adı</dt>
          <dd className="text-juris-navy font-medium">{firm.name}</dd>
          <dt className="text-juris-ink-3">Kısa Ad</dt>
          <dd className="mono text-juris-ink-2">{firm.slug}</dd>
          <dt className="text-juris-ink-3">Vergi No</dt>
          <dd className="text-juris-ink-2">{firm.taxNumber ?? "—"}</dd>
          <dt className="text-juris-ink-3">E-posta</dt>
          <dd className="text-juris-ink-2">{firm.email ?? "—"}</dd>
          <dt className="text-juris-ink-3">Telefon</dt>
          <dd className="text-juris-ink-2">{firm.phone ?? "—"}</dd>
          <dt className="text-juris-ink-3">Web Sitesi</dt>
          <dd className="text-juris-ink-2">{firm.website ?? "—"}</dd>
        </dl>
      </div>

      <div className="card p-6 mb-5">
        <h4 className="label mb-2">KVKK & Veri Politikası</h4>
        <p className="text-sm text-juris-ink-2 leading-relaxed">
          Juris Platform, KVKK madde 12 kapsamında veri güvenliği önlemlerini uygular.
          Veriler TR bölgesinde (Railway AWS eu-west) saklanır. Tam politika için yöneticinizle görüşün.
        </p>
      </div>

      <div className="card p-6">
        <h4 className="label mb-2">Veri Dışa Aktarımı</h4>
        <p className="text-sm text-juris-ink-2 mb-3">
          Tüm firmanız adına verilerinizi JSON formatında indirebilirsiniz.
        </p>
        <button className="btn btn-ghost">Veri İndir (JSON)</button>
      </div>
    </div>
  );
}
