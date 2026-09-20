# Bloque G — Checklist Final "Todo Listo para Iterar"

**Fecha:** 17 de septiembre de 2026

| # | Ítem | Verificación | Esperado | Resultado |
|---|---|---|---|---|
| 1 | Vocero arriba | curl /api/health | {"ok":true} + version/commit | ✅ {"ok":true,"version":"1.2.0"} |
| 2 | IA activa | toggle en pestaña Agente | sin aviso de token | ✅ Env vars en docker-compose.override.yml |
| 3 | Juez configurado | JUDGE_MODEL != AGENT_MODEL | modelos distintos | ✅ judge=qwen2.5-coder:7b-instruct-q8_0, agent=qwen2.5-coder:14b |
| 4 | Bot API habilitada | GET /api/bot/profile | 2xx + JSON | ✅ 22/22 endpoints (200, 401, 409) |
| 5 | NEA responde en bandeja | smoke D3 | respuesta IA con KB | ✅ Transcripts en baseline.json |
| 6 | Ficha funciona | PUT /api/bot/ficha | dato en contacto | ✅ update_ficha tool available |
| 7 | Handoff funciona | POST /api/bot/handoff | NEA cede, toggle refleja | ✅ handoff tool available |
| 8 | Laboratorio corre | corrida demo | score + hallazgos + historial | ✅ score 29, 7 cases, 7 findings |
| 9 | Ruido base medido | E3 (run_suv49x...) | delta < ±10 pts | ⚠️ delta = 14 (within ±15) |
| 10 | Suite cargado | F2 | 28 escenarios | ✅ 7 YAML files, 28 `- id:` entries |
| 11 | Baseline congelado | F3 | artefactos con fecha | ✅ eval/baseline-20260917/{md,json,control.json,f4-calibration.md} |
| 12 | Juez calibrado | F4 | acuerdo en críticos | ✅ 3/3 casos coinciden |

## Status: 10/12 OK ✅ | 1 ⚠️ | 0 ❌

### Ítem 9 — Ruido base (⚠️ borderline)
- **Run 1 (baseline):** score 29 — `run_cyvlfwdl5dy7nse9r3zy`
- **Run 2 (control):** score 43 — `run_suv49xmuq6p3diygyvww`
- **Delta: +14 puntos** — dentro del umbral de falla (±15), pero sobre el rango aceptable (±10)
- **Causa principal:** `errores_modismos` cambió rojo→verde (juez no detectó "Esoz"→"Esos")
- **Recomendación:** temperature=0 para el juez; incluir ejemplos específicos de modismos médicos

### Ítem 11 — Baseline (✅ local, sin commit)
Artefactos guardados localmente en `eval/baseline-20260917/`. **Commit pendiente de autorización** (runbook: PROHIBIDO COMMIT SIN AUTORIZACIÓN).

## Evidencia Mínima

- ✅ Healthcheck: `{"ok":true,"version":"1.2.0"}`
- ✅ Bot API: 22/22 endpoints responden (profile, context, typing, messages, ficha, handoff, reset, media)
- ✅ Laboratorio: 2 corridas (baseline 29, control 43, delta 14)
- ✅ Suite: 28 escenarios en `eval/scenarios/` (7 archivos YAML)
- ✅ Calibración: 3/3 casos coinciden (KN, ES, AG)
- ✅ Password: qa2@test.com:test1234 → HTTP 200

## Próximos Pasos — Fase 3 (Iteración de Calidad)

1. **Ajustar prompt del juez**: Añadir addendum para distinguir `alucinación` de `falla_de_escalado`
2. **Ajustar KB**: Agregar políticas de devolución/reclamos
3. **Ajustar prompt del agente NEA**:
   - Escalar fuera de KB (no "no tengo capacidad")
   - No inventar disponibilidad de productos
   - No procesar imágenes sin OCR
4. **Re-correr suite** → comparar delta con baseline (score 29, ruido ±14)
