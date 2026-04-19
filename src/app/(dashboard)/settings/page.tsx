import Link from "next/link";
import { ChevronRight, ScrollText, CreditCard } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { SectionHead } from "@/components/ui/section-head";
import { planByTier } from "@/lib/billing/plans";

export const metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const { firmId, role } = await requireTenant();
  const [firm, sub] = await Promise.all([
    prisma.firm.findUnique({ where: { id: firmId } }),
    prisma.subscription.findUnique({ where: { firmId } }),
  ]);
  if (!firm) return null;

  const canAudit = can(role, "audit.view");
  const canBilling = role === "OWNER" || role === "PARTNER";
  const plan = planByTier(sub?.tier ?? "FREE");

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

      {canBilling && (
        <Link
          href="/settings/billing"
          className="card p-5 mb-5 flex items-center gap-4 hover:border-juris-navy-200 hover:shadow-juris-md transition-all group"
        >
          <div className="w-11 h-11 rounded-md bg-juris-navy-100 flex items-center justify-center text-juris-navy">
            <CreditCard size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-juris-navy mb-0.5">Abonelik & Faturalama</h4>
            <p className="text-xs text-juris-ink-3">
              Mevcut plan: <span className="font-medium">{plan?.name ?? "Başlangıç"}</span>
              {sub?.status && sub.status !== "TRIALING" && ` · ${sub.status}`}
            </p>
          </div>
          <ChevronRight size={18} className="text-juris-ink-4 group-hover:text-juris-red flex-shrink-0" />
        </Link>
      )}

      {canAudit && (
        <Link
          href="/settings/audit"
          className="card p-5 mb-5 flex items-center gap-4 hover:border-juris-navy-200 hover:shadow-juris-md transition-all group"
        >
          <div className="w-11 h-11 rounded-md bg-juris-navy-100 flex items-center justify-center text-juris-navy">
            <ScrollText size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-juris-navy mb-0.5">Audit Log</h4>
            <p className="text-xs text-juris-ink-3">
              Firmanızdaki tüm eylemlerin denetim izi — KVKK madde 12
            </p>
          </div>
          <ChevronRight size={18} className="text-juris-ink-4 group-hover:text-juris-red flex-shrink-0" />
        </Link>
      )}

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
        <button className="btn btn-ghost" disabled>Veri İndir (JSON) — yakında</button>
      </div>
    </div>
  );
}
