-- Sprint 4 schema additions: messaging, subscription, content calendar.

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED');

-- CreateEnum
CREATE TYPE "ContentChannel" AS ENUM ('BLOG', 'LINKEDIN', 'INSTAGRAM', 'X', 'NEWSLETTER', 'PODCAST', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('IDEA', 'DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "matter_messages" (
    "id"         TEXT NOT NULL,
    "firm_id"    TEXT NOT NULL,
    "matter_id"  TEXT NOT NULL,
    "sender_id"  TEXT NOT NULL,
    "body"       TEXT NOT NULL,
    "read_at"    TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matter_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matter_messages_firm_id_idx" ON "matter_messages"("firm_id");

-- CreateIndex
CREATE INDEX "matter_messages_matter_id_created_at_idx" ON "matter_messages"("matter_id", "created_at");

-- AddForeignKey
ALTER TABLE "matter_messages" ADD CONSTRAINT "matter_messages_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matter_messages" ADD CONSTRAINT "matter_messages_matter_id_fkey"
    FOREIGN KEY ("matter_id") REFERENCES "matters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matter_messages" ADD CONSTRAINT "matter_messages_sender_id_fkey"
    FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id"                      TEXT NOT NULL,
    "firm_id"                 TEXT NOT NULL,
    "tier"                    "PlanTier" NOT NULL DEFAULT 'FREE',
    "status"                  "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "stripe_customer_id"      TEXT,
    "stripe_subscription_id"  TEXT,
    "stripe_price_id"         TEXT,
    "current_period_start"    TIMESTAMP(3),
    "current_period_end"      TIMESTAMP(3),
    "trial_ends_at"           TIMESTAMP(3),
    "cancel_at_period_end"    BOOLEAN NOT NULL DEFAULT false,
    "created_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"              TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_firm_id_key" ON "subscriptions"("firm_id");
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "content_items" (
    "id"           TEXT NOT NULL,
    "firm_id"      TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "summary"      TEXT,
    "channel"      "ContentChannel" NOT NULL DEFAULT 'BLOG',
    "status"       "ContentStatus"  NOT NULL DEFAULT 'IDEA',
    "author"       TEXT,
    "publish_at"   TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "url"          TEXT,
    "tags"         TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_items_firm_id_publish_at_idx" ON "content_items"("firm_id", "publish_at");

-- CreateIndex
CREATE INDEX "content_items_firm_id_status_idx" ON "content_items"("firm_id", "status");

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
