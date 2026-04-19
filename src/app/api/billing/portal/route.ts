import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { getStripe, stripeEnabled } from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens a Stripe Billing Portal session so the firm owner can manage
 * payment methods, invoices, and cancel the subscription.
 */
export async function POST(req: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "Stripe yapılandırılmamış" }, { status: 503 });
  }

  const { firmId, role } = await requireTenant();
  if (role !== "OWNER" && role !== "PARTNER") {
    return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  }

  const sub = await prisma.subscription.findUnique({ where: { firmId } });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "Abonelik kaydı yok. Önce bir plan seçin." },
      { status: 404 },
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const session = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
