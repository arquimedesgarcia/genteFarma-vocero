import { withAuth } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { getEvolutionCredentialsByOrg } from "@/server/whatsapp/evolution-credentials";

export const dynamic = "force-dynamic";

const QR_TIMEOUT_MS = 15000;

function qrError(status: number, detail: string) {
  return Response.json(
    { ok: false, error: { code: "qr_unavailable", message: detail } },
    { status }
  );
}

/**
 * POST /api/settings/whatsapp/evolution/qr
 *
 * Devuelve el código QR de reconexión de la instancia de Evolution GO de ESTA
 * organización (multi-tenant): descifra el token de la instancia guardado en
 * `evolution_credentials` y llama a
 *   GET {EVOLUTION_BASE_URL}/instance/qr?instanceName=<name>
 * con header `apikey: <instance-token>` (el token de la instancia, NO la
 * clave global — la global responde `not authorized`).
 *
 * Permite al dueño volver a vincular su WhatsApp escaneando el QR desde
 * Ajustes → WhatsApp, sin entrar a Evolution GO.
 *
 * Respuesta: { ok: true, instanceName, qrcode: "data:image/png;base64,..." }
 * El QR es de un solo uso y expira en ~20s: regenerarlo justo antes de escanear.
 */
export const POST = withAuth(async (session) => {
  const env = getEnv();
  const base = env.EVOLUTION_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    return qrError(503, "EVOLUTION_BASE_URL no está configurada (canal Evolution)");
  }

  const creds = await getEvolutionCredentialsByOrg(session.organizationId);
  if (!creds || !creds.instanceToken) {
    return qrError(409, "No hay instancia de Evolution guardada para esta cuenta");
  }
  if (!creds.instanceName) {
    return qrError(409, "La instancia guardada no tiene nombre");
  }

  const url = `${base}/instance/qr?instanceName=${encodeURIComponent(
    creds.instanceName
  )}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { apikey: creds.instanceToken },
      signal: AbortSignal.timeout(QR_TIMEOUT_MS),
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    return qrError(503, `No se pudo contactar Evolution GO: ${cause}`);
  }

  const text = await res.text();
  let json: { data?: { qrcode?: string }; error?: string } | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok || !json?.data?.qrcode) {
    const msg =
      json?.error ??
      (res.status === 400
        ? "Sin QR disponible ahora mismo (la instancia ya está conectada o debe reconectarse). Inténtalo de nuevo."
        : `Evolution GO respondió ${res.status}`);
    return qrError(res.status === 400 ? 409 : 502, String(msg));
  }

  return Response.json({
    ok: true,
    instanceName: creds.instanceName,
    qrcode: json.data.qrcode, // "data:image/png;base64,..."
  });
});
