import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { PLANS, planByTier } from "@/lib/billing/plans";
import { stripeEnabled } from "@/lib/billing/stripe";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { BillingActions, UpgradeToTier } from "./billing-actions";

export const metadata = { title: "Abonelik · Ayarlar" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { firmId, role } = await requireTenant();
  if (role !== "OWNER" && role !== "PARTNER") redirect("/settings");

  const params = await searchParams;
  const sub = await prisma.subscription.findUnique({ where: { firmId } });
  const currentTier = sub?.tier ?? "FREE";
  const currentPlan = planByTier(currentTier);
  const stripeOk = stripeEnabled();

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-xs text-juris-ink-3 hover:text-juris-navy mb-4"
      >
        <ChevronLeft size={14} /> Ayarlar
      </Link>

      <SectionHead
        title="Abonelik & Faturalama"
        subtitle="Juris Platform abonelik planınız — Stripe üzerinden güvenli ödeme"
      />

      {params.checkout === "success" && (
        <div className="card p-4 mb-5 border-juris-success/30 flex items-start gap-3"
             style={{ background: "rgba(31,122,78,0.04)" }}>
          <CheckCircle2 size={18} className="text-juris-success flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-juris-success mb-1">Ödeme başarılı</div>
            <p className="text-sm text-juris-ink-2">
              Aboneliğiniz aktifleşiyor. Birkaç saniye sonra yenileyin.
            </p>
          </div>
        </div>
      )}
      {params.checkout === "cancelled" && (
        <div className="card p-4 mb-5 border-juris-warn/30 flex items-start gap-3"
             style={{ background: "rgba(180,112,28,0.04)" }}>
          <XCircle size={18} className="text-juris-warn flex-shrink-0 mt-0.5" />
          <div className="text-sm text-juris-ink-2">Ödeme iptal edildi.</div>
        </div>
      )}

      {!stripeOk && (
        <div className="card p-5 mb-6 border-juris-warn/30" style={{ background: "rgba(180,112,28,0.04)" }}>
          <div className="font-semibold text-[#7a4f15] mb-1">Stripe yapılandırılmamış</div>
          <p className="text-sm text-juris-ink-2">
            <code className="mono text-[11px]">STRIPE_SECRET_KEY</code> ve{" "}
            <code className="mono text-[11px]">STRIPE_WEBHOOK_SECRET</code> Railway
            Variables&apos;a eklenince abonelik aktif olur. Kurulum rehberi:{" "}
            <code className="mono text-[11px]">docs/stripe.md</code>.
          </p>
        </div>
      )}

      {/* Current subscription */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="label mb-1">Mevcut Plan</div>
            <div className="flex items-center gap-3">
              <h3 className="display text-2xl text-juris-navy">
                {currentPlan?.name ?? "—"}
              </h3>
              {sub && (
                <span
                  className={`chip ${
                    sub.status === "ACTIVE" ? "chip-green"
                    : sub.status === "TRIALING" ? "chip-blue"
                    : sub.status === "PAST_DUE" ? "chip-amber"
                    : sub.status === "CANCELED" ? "chip-red"
                    : ""
                  }`}
                >
                  {sub.status}
                </span>
              )}
            </div>
            {sub?.currentPeriodEnd && (
              <div className="text-xs text-juris-ink-3 mt-2">
                {sub.cancelAtPeriodEnd ? "İptal tarihi" : "Yenileme tarihi"}:{" "}
                <span className="font-medium text-juris-navy">
                  {formatDateTR(sub.currentPeriodEnd)}
                </span>
              </div>
            )}
          </div>
          <BillingActions hasSub={Boolean(sub?.stripeCustomerId)} disabled={!stripeOk} />
        </div>
      </div>

      {/* Plan grid */}
      <h4 className="display text-xl text-juris-navy mb-4">Planlar</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const isUpgrade = !isCurrent && plan.tier !== "FREE" && plan.tier !== "ENTERPRISE";
          return (
            <div
              key={plan.tier}
              className={`card p-5 flex flex-col relative ${
                plan.popular ? "border-juris-red/40 ring-2 ring-juris-red/15" : ""
              }`}
            >
              {plan.popular && (
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider"
                  style={{ background: "#BC2F2C" }}
                >
                  En Popüler
                </div>
              )}
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-juris-red">
                  {plan.tier}
                </div>
                <h5 className="display text-xl text-juris-navy mt-1">{plan.name}</h5>
                <p className="text-xs text-juris-ink-3 mt-1">{plan.description}</p>
              </div>
              <div className="mb-4">
                {plan.tier === "ENTERPRISE" ? (
                  <div className="text-xl font-semibold text-juris-navy">Özel</div>
                ) : plan.monthlyPriceTRY === 0 ? (
                  <div className="text-2xl font-semibold text-juris-navy">Ücretsiz</div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-juris-navy">
                        {formatTRY(plan.monthlyPriceTRY, { short: true })}
                      </span>
                      <span className="text-xs text-juris-ink-3">/ay</span>
                    </div>
                    <div className="text-[11px] text-juris-ink-4 mt-0.5">
                      Yıllık {formatTRY(plan.yearlyPriceTRY, { short: true })} (%2 avantaj)
                    </div>
                  </>
                )}
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-juris-ink-2 mb-5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <CheckCircle2 size={12} className="text-juris-success mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {plan.tier === "ENTERPRISE" ? (
                <a
                  href="mailto:iletisim@jurishukuk.com?subject=Juris Platform Kurumsal Plan"
                  className="btn btn-ghost w-full justify-center"
                >
                  Bizimle Görüş
                </a>
              ) : isCurrent ? (
                <button className="btn btn-ghost w-full justify-center" disabled>
                  Mevcut Plan
                </button>
              ) : isUpgrade && stripeOk ? (
                <UpgradeToTier tier={plan.tier as "STARTER" | "PROFESSIONAL"} />
              ) : (
                <button className="btn btn-ghost w-full justify-center" disabled>
                  {plan.tier === "FREE" ? "—" : "Mevcut değil"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

