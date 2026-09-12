import { createHmac, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Orígenes permitidos para CORS (el SAAS). Configurable por env; admite varios por coma. */
function allowedOrigins(): string[] {
  const raw = process.env.SSO_ALLOWED_ORIGIN || "https://app.gentefarma.com";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function withCors(res: Response, req?: Request): Response {
  const origins = allowedOrigins();
  const origin = req?.headers.get("origin");
  // Si el origen de la petición está permitido, reflejo ese mismo origen para
  // que el navegador NO bloquee con CORS (soporta app.gentefarma.com y el
  // dominio de Firebase Hosting del SAAS, p.ej. *.web.app).
  const allow =
    origin && origins.includes(origin) ? origin : origins[0] ?? "https://app.gentefarma.com";
  res.headers.set("Access-Control-Allow-Origin", allow);
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, X-SSO-Signature, Authorization");
  res.headers.set("Vary", "Origin");
  return res;
}

export async function OPTIONS(req: Request) {
  return withCors(new Response(null, { status: 204 }), req);
}

/** Comparación en tiempo constante para firmas hex. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * POST /api/auth/sso  { email }
 * Llamado por el SAAS (app.gentefarma.com) con firma HMAC del body.
 * Emite un token de un solo uso (60 s) y devuelve la URL de verify.
 */
export async function POST(req: Request) {
  const env = getEnv();
  if (!env.SSO_SHARED_SECRET) {
    return withCors(Response.json({ error: "disabled" }, { status: 404 }), req);
  }

  const raw = await req.text();
  let body: { email?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return withCors(Response.json({ error: "invalid_body" }, { status: 400 }), req);
  }
  const email = (body.email ?? "").toString().trim().toLowerCase();
  if (!email) {
    return withCors(Response.json({ error: "email_required" }, { status: 400 }), req);
  }

  // Verificar firma HMAC-SHA256 del body con el secreto compartido.
  const sig = req.headers.get("x-sso-signature") ?? "";
  const expected = createHmac("sha256", env.SSO_SHARED_SECRET).update(raw).digest("hex");
  if (!timingSafeEqualHex(sig, expected)) {
    return withCors(Response.json({ error: "bad_signature" }, { status: 401 }), req);
  }

  // El email debe existir en el CRM (nunca se crean cuentas nuevas).
  const db = getDb();
  const users = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);
  if (!users[0]) {
    return withCors(Response.json({ error: "account_not_found" }, { status: 404 }), req);
  }

  // Token opaco de un solo uso, 60 s de vida.
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHmac("sha256", env.SSO_SHARED_SECRET).update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60_000);
  await db.insert(schema.ssoToken).values({
    tokenHash,
    email,
    redirectTo: "/inbox",
    expiresAt,
  });

  const url = `${env.APP_BASE_URL}/api/auth/sso/verify?token=${encodeURIComponent(token)}`;
  return withCors(Response.json({ url }), req);
}
