-- Sales · Pipeline expansion
-- + 2 yeni LeadStage (CONTRACT, SIGNING)
-- + Lead tablosuna pipeline alanları (pricingModel/nextAction/clientName/topic/assigneeName)
-- + ProposalTemplate modeli (Teklif Şablonları — Drive senkron)

-- Add new enum values (Postgres requires ALTER TYPE ... ADD VALUE ...)
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'CONTRACT';
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'SIGNING';

-- Lead table extensions
ALTER TABLE "leads"
  ADD COLUMN "client_name"       TEXT,
  ADD COLUMN "topic"             TEXT,
  ADD COLUMN "pricing_model"     TEXT,
  ADD COLUMN "next_action_text"  TEXT,
  ADD COLUMN "next_action_at"    TIMESTAMP(3),
  ADD COLUMN "assignee_name"     TEXT;

-- ProposalTemplate enum + table
CREATE TYPE "ProposalTemplateModel" AS ENUM ('RETAINER', 'FLAT_FEE', 'PROJECT', 'RETAINER_PLUS_PROJECT', 'FILE_BASED');

CREATE TABLE "proposal_templates" (
    "id"            TEXT NOT NULL,
    "firm_id"       TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "model"         "ProposalTemplateModel" NOT NULL,
    "section_count" INTEGER NOT NULL,
    "usage_count"   INTEGER NOT NULL DEFAULT 0,
    "last_used_at"  TIMESTAMP(3),
    "drive_url"     TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "proposal_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "proposal_templates_firm_id_idx" ON "proposal_templates"("firm_id");

ALTER TABLE "proposal_templates" ADD CONSTRAINT "proposal_templates_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
