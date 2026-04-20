-- BD · Network Yönetimi — Resource + ResourceContact + ResourceEvent

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('COMPANY', 'DIRECT_PARTNER', 'NETWORK');

-- CreateEnum
CREATE TYPE "ResourceHeat" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateTable
CREATE TABLE "resources" (
    "id"             TEXT NOT NULL,
    "firm_id"        TEXT NOT NULL,
    "type"           "ResourceType" NOT NULL,
    "name"           TEXT NOT NULL,
    "description"    TEXT,
    "tags"           TEXT[] DEFAULT ARRAY[]::TEXT[],
    "heat"           "ResourceHeat" NOT NULL DEFAULT 'WARM',
    "score"          INTEGER NOT NULL DEFAULT 50,
    "lead_count"     INTEGER NOT NULL DEFAULT 0,
    "revenue_try"    DECIMAL(14,2),
    "last_contact_at" TIMESTAMP(3),
    "owner_id"       TEXT,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resources_firm_id_type_idx" ON "resources"("firm_id", "type");
CREATE INDEX "resources_firm_id_heat_idx" ON "resources"("firm_id", "heat");

ALTER TABLE "resources" ADD CONSTRAINT "resources_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resources" ADD CONSTRAINT "resources_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "resource_contacts" (
    "id"            TEXT NOT NULL,
    "firm_id"       TEXT NOT NULL,
    "resource_id"   TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "role"          TEXT,
    "email"         TEXT,
    "phone"         TEXT,
    "linkedin_url"  TEXT,
    "heat"          "ResourceHeat" NOT NULL DEFAULT 'WARM',
    "last_contact_at" TIMESTAMP(3),
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resource_contacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resource_contacts_firm_id_idx" ON "resource_contacts"("firm_id");
CREATE INDEX "resource_contacts_resource_id_idx" ON "resource_contacts"("resource_id");

ALTER TABLE "resource_contacts" ADD CONSTRAINT "resource_contacts_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_contacts" ADD CONSTRAINT "resource_contacts_resource_id_fkey"
    FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "resource_events" (
    "id"              TEXT NOT NULL,
    "firm_id"         TEXT NOT NULL,
    "resource_id"     TEXT,
    "date"            TIMESTAMP(3) NOT NULL,
    "event_type"      TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "organizer"       TEXT,
    "attendee_count"  INTEGER,
    "lead_count"      INTEGER,
    "lead_user_name"  TEXT,
    "calendar_synced" BOOLEAN NOT NULL DEFAULT false,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resource_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resource_events_firm_id_date_idx" ON "resource_events"("firm_id", "date");

ALTER TABLE "resource_events" ADD CONSTRAINT "resource_events_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_events" ADD CONSTRAINT "resource_events_resource_id_fkey"
    FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
