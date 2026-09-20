# T3 — Calibración del juez (2026-09-18, rama agent-qa)

## Resultado: delta 0 — criterio ±8 CUMPLIDO (iteración 1)

| Corrida | Run ID | Score | Notas |
|---|---|---|---|
| Control A2 | `run_si2sivzqcd6p02f9oabi` | **14** | agente 14B, respondió completo |
| Control B2 | `run_t8u7fvax3f88btep1fgh` | **14** | mismo procedimiento, delta=0 |

Veredictos idénticos en ambos controles (mismos 6 rojos, mismo verde `pide_humano`); solo varía el conteo de hallazgos por caso (1-4).

## Cambios aplicados (sin commit)

1. **Temperatura 0** para el juez: `src/lib/ai/index.ts` (opts.temperature → callProvider) + `src/server/lab/judge.ts` (`{ judge: true, temperature: 0 }`). Antes usaba el default del proveedor.
2. **Prompt versionado:** `eval/judge-prompt-v1.md` (criterios sin cambios respecto al código).

## Corrección de procedimiento: reset de estado entre corridas

Descubierto durante T3: **el ruido 29→14→21 histórico no era (solo) del juez**. NEA persiste el estado conversacional de los teléfonos de prueba (5210000000001-7) en su Postgres; en corridas sucesivas el agente responde con silencio ("conversación cerrada por falta de rumbo") y todos los casos caen a rojo (corridas B original: 0/100, y `run_uzjrxz2n4dn0iao24loo`: 0/100 — evidencia en `eval/baseline-20260917/control-b.json` con transcripts sin mensajes del agente).

**Procedimiento de corrida independiente (obligatorio):**

```bash
# Antes de CADA corrida del Laboratorio:
docker exec vocerocrm-nea-db-1 psql -U postgres -d nea -c \
  'TRUNCATE bot_conversation, bot_message, bot_cart, processed_message, relay_queue, pending_send RESTART IDENTITY CASCADE;'
```

(Solo BD local de QA `nea`; no toca el Postgres del CRM. Cascada a offered_slots y med_queries.)

**Corridas contaminadas por estado (no comparables):** run_huip…, run_8j5n…, run_bqoo…, run_oomsoznm…, run_uzjrxz… Los controles válidos son A2 y B2, y el baseline del 17-sep (que corrió con estado fresco).

## Artefactos

- `eval/baseline-20260917/control-a2.json`, `control-b2.json`
- `eval/judge-prompt-v1.md`
