-- provider_id faltaba en migraciones (existe en schema.ts pero no se generó migration).
-- Agrega la columna para multi-tenant Firebase catalog matching.
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "provider_id" text;
