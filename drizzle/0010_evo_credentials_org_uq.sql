-- La tabla evolution_credentials no existía en migraciones (solo en schema.ts).
-- En bases limpias fallaba 42P01. Se crea aquí antes del índice.
CREATE TABLE IF NOT EXISTS "evolution_credentials" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "instance_name" text NOT NULL,
  "instance_token_hash" text NOT NULL,
  "instance_token_cipher" text NOT NULL,
  "instance_token_iv" text NOT NULL,
  "instance_token_tag" text NOT NULL,
  "instance_id" text,
  "jid" text,
  "status" text NOT NULL DEFAULT 'connected' CHECK ("status" IN ('connected','reconnect_required')),
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);
ALTER TABLE "evolution_credentials" ADD CONSTRAINT "evolution_credentials_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;

-- Índice único sobre organization_id en evolution_credentials.
-- El código (saveEvolutionCredentials) usa onConflictDoUpdate({target: organizationId})
-- que exige un UNIQUE constraint sobre esa columna.
CREATE UNIQUE INDEX IF NOT EXISTS "evolution_credentials_org_uq"
  ON "evolution_credentials" ("organization_id");
