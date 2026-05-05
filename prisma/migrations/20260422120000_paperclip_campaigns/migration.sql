-- Sales & Marketing · UTM Campaigns
-- Registered via Paperclip API (POST /api/paperclip/campaigns)

CREATE TABLE "campaigns" (
    "id"            TEXT NOT NULL,
    "firm_id"       TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "utm_source"    TEXT NOT NULL,
    "utm_medium"    TEXT NOT NULL,
    "utm_campaign"  TEXT NOT NULL,
    "utm_term"      TEXT,
    "utm_content"   TEXT,
    "channel"       TEXT,
    "starts_at"     TIMESTAMP(3),
    "ends_at"       TIMESTAMP(3),
    "budget"        DECIMAL(14, 2),
    "notes"         TEXT,
    "active"        BOOLEAN NOT NULL DEFAULT true,
    "created_via"   TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "campaigns_firm_id_utm_campaign_key" ON "campaigns"("firm_id", "utm_campaign");
CREATE INDEX "campaigns_firm_id_active_idx" ON "campaigns"("firm_id", "active");

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
