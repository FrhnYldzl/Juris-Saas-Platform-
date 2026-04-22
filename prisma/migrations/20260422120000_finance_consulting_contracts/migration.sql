-- Finance · Danışmanlık Sözleşmeleri (Retainer listesi)
-- ConsultingContract modeli + iki enum
-- Ay başı / Ay ortası retainer akışını izlemek için kullanılır

CREATE TYPE "ConsultingDueType" AS ENUM ('AY_BASI', 'AY_ORTASI');

CREATE TYPE "ConsultingContractStatus" AS ENUM ('AKTIF', 'BEKLEMEDE', 'PASIF');

CREATE TABLE "consulting_contracts" (
    "id"                TEXT NOT NULL,
    "firm_id"           TEXT NOT NULL,
    "company_name"      TEXT NOT NULL,
    "due_type"          "ConsultingDueType" NOT NULL,
    "retainer_fee"      DECIMAL(14,2) NOT NULL,
    "sgk_fee"           DECIMAL(14,2),
    "tenure_years"      INTEGER NOT NULL DEFAULT 0,
    "tenure_months"     INTEGER NOT NULL DEFAULT 0,
    "last_collected_at" TIMESTAMP(3),
    "next_due_at"       TIMESTAMP(3),
    "status"            "ConsultingContractStatus" NOT NULL DEFAULT 'AKTIF',
    "is_overdue"        BOOLEAN NOT NULL DEFAULT false,
    "assignee_name"     TEXT,
    "notes"             TEXT,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "consulting_contracts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consulting_contracts_firm_id_idx"              ON "consulting_contracts"("firm_id");
CREATE INDEX "consulting_contracts_firm_id_status_idx"       ON "consulting_contracts"("firm_id", "status");
CREATE INDEX "consulting_contracts_firm_id_due_type_idx"     ON "consulting_contracts"("firm_id", "due_type");

ALTER TABLE "consulting_contracts" ADD CONSTRAINT "consulting_contracts_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
