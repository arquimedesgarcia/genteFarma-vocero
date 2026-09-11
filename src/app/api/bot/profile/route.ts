import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireBotKey, resolveOrgFromConversation, resolveOrgFromWaIdentity, resolveInstanceOrg } from "@/server/bot/auth";
import { serializeBotProfile } from "@/server/bot/profile";

export const dynamic = "force-dynamic";

/**
 * Perfil del agente + knowledge base para un cerebro externo.
 * GET /api/bot/profile → {profile, kb, resources}. Sin caché: cada consulta
 * refleja lo que el dueño dejó en la UI al momento (el TTL vive del lado del
 * bot, que es quien sabe cada cuánto le conviene releer).
 *
 * MULTI-TENANT: acepta `?conversationId=` u `?waIdentity=` para resolver la org
 * del tenant (igual que /api/bot/context). Si no se pasa ninguno, cae al
 * fallback legacy (resolveInstanceOrg) — compatible con bots que no envían tenant.
 */
export async function GET(req: Request) {
  const denied = requireBotKey(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  const waIdentity = url.searchParams.get("waIdentity");

  const organizationId = (conversationId && await resolveOrgFromConversation(conversationId))
    ?? (waIdentity && await resolveOrgFromWaIdentity(waIdentity))
    ?? await resolveInstanceOrg();
  if (!organizationId) {
    return apiError(409, "no_org", "No se pudo resolver la organización del tenant");
  }

  const db = getDb();
  const profiles = await db
    .select()
    .from(schema.agentProfile)
    .where(eq(schema.agentProfile.organizationId, organizationId))
    .limit(1);
  const profile = profiles[0];
  if (!profile) {
    // Condición esperada (instancia sin perfil): el bot cae a su brief local.
    return apiError(404, "no_profile", "La instancia no tiene perfil de agente");
  }

  const kb = await db
    .select()
    .from(schema.kbEntry)
    .where(eq(schema.kbEntry.organizationId, organizationId))
    .orderBy(asc(schema.kbEntry.createdAt));

  return Response.json(serializeBotProfile(profile, kb));
}
