import type { PlanTier } from "@prisma/client";

export interface PlanDef {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPriceTRY: number;
  yearlyPriceTRY: number;
  stripePriceIdMonthly?: string; // filled from env at runtime
  stripePriceIdYearly?: string;
  popular?: boolean;
  limits: {
    users: number;          // 0 = unlimited
    matters: number;
    aiCallsPerMonth: number;
    storageGb: number;
    clientPortalAccess: boolean;
    aiAdvanced: boolean;
    prioritySupport: boolean;
  };
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    tier: "FREE",
    name: "Başlangıç",
    description: "Solo avukat, tanışma amaçlı",
    monthlyPriceTRY: 0,
    yearlyPriceTRY: 0,
    limits: {
      users: 1,
      matters: 10,
      aiCallsPerMonth: 20,
      storageGb: 1,
      clientPortalAccess: false,
      aiAdvanced: false,
      prioritySupport: false,
    },
    features: [
      "1 kullanıcı",
      "10 aktif dosya",
      "Aylık 20 AI çağrısı",
      "1 GB belge depolama",
      "E-posta ile sınırlı destek",
    ],
  },
  {
    tier: "STARTER",
    name: "Ofis",
    description: "Küçük bürolar için temel modüller",
    monthlyPriceTRY: 1490,
    yearlyPriceTRY: 14900,
    limits: {
      users: 5,
      matters: 100,
      aiCallsPerMonth: 500,
      storageGb: 25,
      clientPortalAccess: true,
      aiAdvanced: false,
      prioritySupport: false,
    },
    features: [
      "5 kullanıcı",
      "100 aktif dosya",
      "Aylık 500 AI çağrısı",
      "25 GB belge depolama",
      "Müvekkil portalı (sınırsız müvekkil)",
      "Fatura + zaman kaydı",
      "E-posta destek",
    ],
  },
  {
    tier: "PROFESSIONAL",
    name: "Profesyonel",
    description: "Yerleşik bürolar için",
    monthlyPriceTRY: 3990,
    yearlyPriceTRY: 39900,
    popular: true,
    limits: {
      users: 20,
      matters: 0, // unlimited
      aiCallsPerMonth: 3000,
      storageGb: 200,
      clientPortalAccess: true,
      aiAdvanced: true,
      prioritySupport: true,
    },
    features: [
      "20 kullanıcı",
      "Sınırsız dosya",
      "Aylık 3.000 AI çağrısı",
      "200 GB belge depolama",
      "Müvekkil portalı + dosya mesajlaşma",
      "İleri AI: dilekçe taslağı, sözleşme analizi",
      "Dedike destek + eğitim oturumu",
      "API erişimi",
    ],
  },
  {
    tier: "ENTERPRISE",
    name: "Kurumsal",
    description: "Büyük ortaklıklar için",
    monthlyPriceTRY: 0, // custom
    yearlyPriceTRY: 0,
    limits: {
      users: 0,
      matters: 0,
      aiCallsPerMonth: 0, // custom
      storageGb: 1000,
      clientPortalAccess: true,
      aiAdvanced: true,
      prioritySupport: true,
    },
    features: [
      "Sınırsız kullanıcı",
      "Sınırsız dosya + AI çağrısı",
      "1 TB+ depolama",
      "SSO (Google Workspace, Azure AD)",
      "KVKK tam uyum paketi + veri ikametgâhı",
      "Özel entegrasyonlar (UYAP, GİB tam entegrasyon)",
      "SLA ve özel hukuki destek",
    ],
  },
];

export function planByTier(tier: PlanTier): PlanDef | undefined {
  return PLANS.find((p) => p.tier === tier);
}

/**
 * Resolve Stripe price ID from env (so we don't hard-code live IDs in code).
 * Env convention: STRIPE_PRICE_<TIER>_<PERIOD>
 *   e.g. STRIPE_PRICE_STARTER_MONTHLY, STRIPE_PRICE_PROFESSIONAL_YEARLY
 */
export function stripePriceId(tier: PlanTier, period: "monthly" | "yearly"): string | undefined {
  const key = `STRIPE_PRICE_${tier}_${period.toUpperCase()}`;
  return process.env[key];
}
