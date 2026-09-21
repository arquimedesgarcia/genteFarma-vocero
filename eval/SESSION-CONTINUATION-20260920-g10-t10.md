# 🔄 Session Continuation — NEA QA (G10 + T10)

**Fecha de corte:** 2026-09-20 ~23:59 VET
**Rama:** `agent-qa` en ambos repos, TODO commiteado y pusheado:
- `arquimedesgarcia/genteFarma-nea` → `53d6bc7` (guardas G4/G6/G7/G8 + G9)
- `arquimedesgarcia/genteFarma-vocero` → `7fe9e88` (reportes fases 1-7 + artefactos)
**Repos:** `D:\Proyectos\GenteFarma\voceroCRM` (app) y `D:\Proyectos\GenteFarma\agentNEA` (agente Python)
**Reporte canónico:** `voceroCRM/eval/REPORT-20260919.md` (fases 1-7). Léelo primero.
**Remote:** push SOLO a `gentefarma` (repos propios). PROHIBIDO pushear a `rsomoza01/vocero-crm` ni `rsomoza01/nea-agent` sin autorización escrita.

## Estado verificado al cierre
- **Cadena de guardas G1-G9 completa y validada**: G6 91/91, G7 86/95, G8 86/86/86/91 (4 corridas), G9 91/95 (`Pide un humano` verde en ambas). Cero eco/placeholder/vetos activados.
- **Juez:** `meituan/longcat-2.0` vía proxy `scripts/llm-proxy.py` en 127.0.0.1:11500 (contenedor `app`: `OPENROUTER_BASE_URL=http://host.docker.internal:11500`, sin `/v1`). Token OAuth en `%LOCALAPPDATA%\hermes\shared\nous_auth.json` — NUNCA imprimirlo. Verificación rápida del proxy: `curl -sk -X POST http://127.0.0.1:11500/v1/chat/completions -d '{"model":"meituan/longcat-2.0","messages":[{"role":"user","content":"ok"}],"max_tokens":5}' -H 'Content-Type: application/json'` (el endpoint ES con `/v1`; `POST /chat/completions` sin `/v1` da 404).
- **Agente:** `qwen2.5-coder:14b` local, contenedor `nea` reconstruido 2026-09-20T22:46Z con G1-G9, healthy.
- **Stack:** healthy (`curl -sk https://localhost/api/health`).
- Nada pendiente de commit.

## Tarea 1 — G10 (implementación + validación)
Modo de falla detectado en G9-A (`run_9qtt7xhs3fnn7iwin6lj`, caso `pregunton_precios`):
1. El agente afirmó composición/uso farmacológico ("Daflón 500 es un AINE que se usa para...") sin dato de herramienta.
2. Prometió "Voy a buscar alternativas genéricas" sin llamar ninguna herramienta (narración de intención, no cubierta por G8 que solo atrapa `[inserta ...]`).

Implementación propuesta (requiere confirmación del usuario antes de delegar):
- `guards.py`: regex de afirmaciones de composición/indicación farmacológica (AINE, antiinflamatorio, antibiótico, "sirve para", "trata", etc.) en `final_text` sin herramienta de catálogo en el turno → veto con plantilla honesta constante. Y regex de promesas de búsqueda futura ("voy a buscar", "déjame verificar", "busco y te aviso") sin tool call → veto con plantilla de búsqueda honesta o silencio de acción.
- `turn.py`: G10 como `elif` final tras G9, sin romper G1-G9.
- Delegar a Claude Code Sonnet print mode (skill `vocero-nea-qa` tiene el comando exacto), verificar 3 niveles, rebuild `nea` con `--build`.
- Validar: TRUNCATE (pedir permiso) + 2 corridas, criterio: cero alucinación de composición en `pregunton_precios` en ambas, sin regresiones, delta < 8. Máx 1 iteración de ajuste de regex.
- Reporte fase 8 + skill (tabla de guardas) + push con autorización.

## Tarea 2 — T10 (decisión ya tomada por el usuario: OPCIÓN A pendiente de confirmación)
El usuario no llegó a elegir. Opciones que se le presentaron:
- A: eliminar `model` del POST `/api/lab/runs` (contrato y UI) — recomendada si no comparará modelos por API.
- B: implementarlo (route.ts:49 lo ignora hoy).
Al reabrir, preguntar A o B, ejecutar y validar con 1 corrida.

## Reglas de trabajo (sin excepción)
1. Solo los 2 repos indicados, rama `agent-qa`, push solo a remote `gentefarma`.
2. ❌ PROHIBIDO commit/push sin autorización escrita del usuario.
3. TRUNCATE antes de cada corrida (pedir aprobación): `docker exec vocerocrm-nea-db-1 psql -U postgres -d nea -c 'TRUNCATE bot_conversation, bot_message, bot_cart, processed_message, relay_queue, pending_send RESTART IDENTITY CASCADE;'`
4. Auth: `curl -sk -c cookies.txt -X POST https://localhost/api/auth/sign-in/email -H 'Content-Type: application/json' -d '{"email":"qa3@test.com","password":"test1234"}'`; run: `curl -sk -b cookies.txt -X POST https://localhost/api/lab/runs -H 'Content-Type: application/json' -d '{"model":"qwen2.5-coder:14b"}'`.
5. Poll cada ~55-60 s con JSON tolerante (status anidado en `run.status`; el run tarda ~15-25 min; respuesta vacía → reintentar).
6. Veredicto de guarda ≠ "bajo score": reportar vetos aparte.
7. Modo de falla nuevo → documentar como candidato (G11…) y detener.
8. Nunca imprimir tokens/secrets. Docker puede caerse por OOM: `docker start <contenedor>` y verificar health.

## Runs huérfanos a ignorar
`run_vap3lmt7muxgin8v27ps`, `run_2sn2pjmmdephctdctmih`.
