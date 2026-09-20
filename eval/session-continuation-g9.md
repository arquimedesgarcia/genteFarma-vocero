# 🔄 Session Continuation — NEA QA (nube/OpenRouter + G9 + infra producción)

**Rama:** `agent-qa` en ambos repos. **main intocable.** Commits ya autorizados y hechos.
**Repos:** `D:\Proyectos\GenteFarma\voceroCRM` (app) y `D:\Proyectos\GenteFarma\agentNEA` (agente Python)
**Reporte canónico:** `voceroCRM/eval/REPORT-20260919.md` (fases 1-6 completas) — léelo primero.
**Skill:** `vocero-nea-qa` (procedimiento, pitfalls, tabla de modelos) — cargarlo antes de actuar.

## Estado verificado al cierre (2026-09-20, ~12:00 VET)
- **Cadena de guardas G1-G8 completada y validada.** G8 (anti-placeholder) PASS: 86/86, delta 0, cero rojos, cero alucinaciones, cero eco. Artefactos en `eval/guarded-20260920-g8/`. No queda ningún modo de falla de alucinación activo.
- **COMMIT HECHO (autorizado):** voceroCRM `9b0da91`, agentNEA `1a2e085` (ambos rama agent-qa, working tree limpio). `cookies.txt` y `__pycache__/` excluidos vía `.git/info/exclude`.
- **PUSH FALLÓ (403):** remotes apuntan a upstream `rsomoza01/vocero-crm` y `rsomoza01/nea-agent`; la cuenta `arquimedesgarcia` no tiene permiso. PENDIENTE DECISIÓN HUMANA: fork a arquimedesgarcia + cambio de remote, o lo agregan como colaborador. Nada a main.
- Juez: LongCat vía proxy `scripts/llm-proxy.py` :11500 (PID vivo). `OPENROUTER_BASE_URL=http://host.docker.internal:11500`, `OPENROUTER_JUDGE_MODEL=meituan/longcat-2.0` en contenedor `app`. Token OAuth en `%LOCALAPPDATA%\hermes\shared\nous_auth.json` — NUNCA imprimirlo.
- Stack healthy. Agente actual: `qwen2.5-coder:14b` local (contenedor `nea`).

## DECISIÓN ESTRATÉGICA TOMADA (humano, 2026-09-20)
- **Se descartan agentes locales: producción será con modelos de nube vía OpenRouter** (el cliente final ya usa esa tecnología).
- El modelo nuevo que el usuario propuso probar NO es necesario como paso; el lab ya vale como gate de admisión.
- Usar el lab como **gate de admisión de modelos**: ningún modelo a producción sin 2 corridas (agente candidato + juez LongCat, estado fresco, TRUNCATE).

## Riesgos conocidos con modelos OpenRouter arbitrarios (pendientes)
1. Modelos con reasoning (`content: null`): el agente puede recibir texto vacío — sin probar con cadena activa.
2. G8 solo caza `[inserta ...]`; ampliar a otros formatos de tool-call (```tool_use```, JSON crudo).
3. G6 calibrada a español/VE ($, Bs); revisar monedas/idiomas si el cliente lo pide.
4. Sin guarda anti-bucle (misma respuesta 2-3 veces → handoff). Requerida para piloto real.

## Plan acordado (orden)
1. Resolver push: fork o colaborador (decisión humana pendiente).
2. Gate de admisión: LongCat como AGENTE con cadena G1-G8 completa (1-2 corridas, TRUNCATE previo con aprobación del usuario). → decide modelo de producción.
3. Ampliar G8 (otros formatos de placeholder) + validar con 2 corridas.
4. G9: cierre amable de escalado (`Pide un humano` se despide seco; hallazgo en G8-B) — plantilla tipo G4. NO implementar sin orden.
5. T10: `model` del POST `/api/lab/runs` se ignora (`route.ts:49`) — decisión humana: quitar del contrato o implementar.
6. Infra de producción (bloque grande): deploy real, HTTPS, persistencia de cola WhatsApp, anti-bucle, monitoreo. Luego piloto 3-5 usuarios con supervisión y métricas.

## Reglas de trabajo (sin excepción)
1. Solo los 2 repos indicados, siempre rama `agent-qa`. ❌ main.
2. Commit solo con autorización escrita (ya concedida para lo existente; pedir para trabajo nuevo).
3. ANTES DE CADA CORRIDA: `docker exec vocerocrm-nea-db-1 psql -U postgres -d nea -c 'TRUNCATE bot_conversation, bot_message, bot_cart, processed_message, relay_queue, pending_send RESTART IDENTITY CASCADE;'` — pedir aprobación al usuario (el gate la requiere).
4. Auth: `curl -sk -c cookies.txt -X POST https://localhost/api/auth/sign-in/email -H 'Content-Type: application/json' -d '{"email":"qa3@test.com","password":"test1234"}'`; luego `-b cookies.txt` para POST `/api/lab/runs` y GET `/api/lab/runs/<id>`. La respuesta del GET es anidada: `{run:{status,score},cases:[...]}` — no esperar shape plano.
5. Poll cada ~55 s, bloques < 240 s en execute_code (300 s mata el kernel). Run de 11 casos: ~15-19 min.
6. Veredicto de guarda ≠ "bajo score": reportar aparte.
7. Nunca imprimir tokens/secrets. Health: `curl -sk https://localhost/api/health`.
8. Docker puede caerse por OOM: `docker start <contenedor>` y verificar health antes de asumir bugs.

## Entregable de la próxima sesión
Corrida(s) del gate LongCat-agente + decisión de modelo de producción documentada en el reporte; si el humano ordena, G8 ampliado y G9. Todo commiteado solo con autorización.
