-- Operasyonlar · Matter extension fields for consulting + dispute views
-- Non-breaking: all new columns are optional or have defaults.

ALTER TABLE "matters"
  ADD COLUMN "consulting_category" TEXT,
  ADD COLUMN "monthly_fee"        DECIMAL(14,2),
  ADD COLUMN "progress_pct"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "next_step_title"    TEXT,
  ADD COLUMN "next_step_at"       TIMESTAMP(3),
  ADD COLUMN "drive_folder_name"  TEXT,
  ADD COLUMN "dispute_method"     TEXT,
  ADD COLUMN "dispute_subtype"    TEXT,
  ADD COLUMN "dispute_value"      DECIMAL(14,2),
  ADD COLUMN "next_action_type"   TEXT,
  ADD COLUMN "next_action_at"     TIMESTAMP(3),
  ADD COLUMN "is_urgent"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "is_portfolio"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "document_count"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lead_assignee_name" TEXT;

CREATE INDEX "matters_firm_id_dispute_method_idx"
  ON "matters"("firm_id", "dispute_method");

CREATE INDEX "matters_firm_id_next_action_at_idx"
  ON "matters"("firm_id", "next_action_at");
