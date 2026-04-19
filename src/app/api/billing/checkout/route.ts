import { NextResponse } from "next/server";
import { z } from "zod";
import { PlanTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { getStripe, stripeEnabled } from "@/lib/billing/stripe";
import { stripePriceId } from "@/lib/billing/plans";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  tier: z.enum(["STARTER", "PROFESSIONAL"]),
  period: z.enum(["monthly", "yearly"]),
});

export async function POST(req: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json(
      { error: "Stripe yapılandırılmamış. Yöneticiyle iletişime geçin." },
      { status: 503 },
    );
  }

  const { firmId, userId, role, email } = await requireTenant();
  if (role !== "OWNER" && role !== "PARTNER") {
    return NextResponse.json({ error: "Sadece ortaklar abonelik yönetebilir" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const priceId = stripePriceId(parsed.data.tier as PlanTier, parsed.data.period);
  if (!priceId) {
    return NextResponse.json(
      { error: `${parsed.data.tier} ${parsed.data.period} fiyatı env'de tanımlı değil` },
      { status: 500 },
    );
  }

  const stripe = getStripe();

  // Reuse existing Stripe customer if any
  const existing = await prisma.subscription.findUnique({ where: { firmId } });
  let customerId = existing?.stripeCustomerId ?? null;

  if (!customerId) {
    const firm = await prisma.firm.findUnique({ where: { id: firmId } });
    const customer = await stripe.customers.create({
      email: email,
      name: firm?.name,
      metadata: { firmId },
    });
    customerId = customer.id;

    await prisma.subscription.upsert({
      where: { firmId },
      create: {
        firmId,
        tier: "FREE",
        status: "INCOMPLETE",
        stripeCustomerId: customerId,
      },
      update: { stripeCustomerId: customerId },
    });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: firmId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/settings/billing?checkout=cancelled`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { firmId, tier: parsed.data.tier },
    },
    metadata: { firmId, tier: parsed.data.tier, period: parsed.data.period },
  });

  await audit({
    firmId,
    actorId: userId,
    action: "billing.checkout_started",
    entityType: "subscription",
    diff: { tier: parsed.data.tier, period: parsed.data.period },
  });

  return NextResponse.json({ url: session.url });
}
