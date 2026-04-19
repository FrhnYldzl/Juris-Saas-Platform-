import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { PlanTier, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeEnabled } from "@/lib/billing/stripe";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Disable body parsing so we can verify Stripe signatures against the raw body
export const preferredRegion = "auto";

function tierFromMetadata(metadata?: Stripe.Metadata | null): PlanTier | null {
  const t = metadata?.tier;
  if (t === "FREE" || t === "STARTER" || t === "PROFESSIONAL" || t === "ENTERPRISE") return t;
  return null;
}

function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case "active": return "ACTIVE";
    case "trialing": return "TRIALING";
    case "past_due": return "PAST_DUE";
    case "canceled": return "CANCELED";
    case "incomplete": return "INCOMPLETE";
    case "incomplete_expired": return "INCOMPLETE_EXPIRED";
    default: return "INCOMPLETE";
  }
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const firmId = (sub.metadata?.firmId as string) || null;
  const tier = tierFromMetadata(sub.metadata) ?? "STARTER";

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price.id ?? null;

  // Resolve firmId via metadata OR stored customer mapping
  let resolvedFirmId = firmId;
  if (!resolvedFirmId) {
    const existing = await prisma.subscription.findUnique({
      where: { stripeCustomerId: customerId },
    });
    resolvedFirmId = existing?.firmId ?? null;
  }
  if (!resolvedFirmId) {
    logger.warn({ sub: sub.id }, "No firmId for subscription webhook; skipping");
    return;
  }

  await prisma.subscription.update({
    where: { firmId: resolvedFirmId },
    data: {
      tier,
      status: mapStatus(sub.status),
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  await prisma.auditLog.create({
    data: {
      firmId: resolvedFirmId,
      action: `billing.${sub.status}`,
      entityType: "subscription",
      entityId: sub.id,
      diff: JSON.parse(JSON.stringify({ tier, status: sub.status, priceId })),
    },
  });
}

export async function POST(req: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    logger.warn({ err }, "Invalid Stripe webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription : session.subscription.id;
          const sub = await getStripe().subscriptions.retrieve(subId);
          // Propagate our metadata from the checkout session
          const firmId = session.client_reference_id ?? (session.metadata?.firmId as string);
          const tier = (session.metadata?.tier as string) ?? null;
          if (firmId && tier) {
            sub.metadata = { ...sub.metadata, firmId, tier };
          }
          await upsertSubscription(sub);
        }
        break;
      }

      default:
        logger.debug({ type: event.type }, "Stripe webhook: ignored event");
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Stripe webhook processing failed");
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
