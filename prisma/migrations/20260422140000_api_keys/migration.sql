-- API Keys for Paperclip + generic public API surface

CREATE TABLE "api_keys" (
    "id"              TEXT NOT NULL,
    "firm_id"         TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "prefix"          TEXT NOT NULL,
    "key_hash"        TEXT NOT NULL,
    "scopes"          TEXT[] DEFAULT ARRAY[]::TEXT[],
    "service"         TEXT,
    "last_used_at"    TIMESTAMP(3),
    "last_used_ip"    TEXT,
    "expires_at"      TIMESTAMP(3),
    "revoked_at"      TIMESTAMP(3),
    "created_by_id"   TEXT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX "api_keys_firm_id_idx" ON "api_keys"("firm_id");
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
