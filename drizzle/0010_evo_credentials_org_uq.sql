-- Índice único sobre organization_id en evolution_credentials.
-- El código (saveEvolutionCredentials) usa onConflictDoUpdate({target: organizationId})
-- que exige un UNIQUE constraint sobre esa columna. Estaba en schema.ts pero faltaba
-- en las migraciones (la tabla se creó fuera de drizzle), por lo que el ON CONFLICT
-- lanzaba 42P10 ("there is no unique or exclusion constraint matching the ON CONFLICT
-- specification") → 500 "Error interno" al guardar una instancia.
CREATE UNIQUE INDEX IF NOT EXISTS "evolution_credentials_org_uq"
  ON "evolution_credentials" ("organization_id");
