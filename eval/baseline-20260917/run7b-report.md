# Run 7B — qwen2.5-coder:7b-instruct-q8_0 (bajo costo)

- **Run ID:** `run_8j5n28out7g5oyhi3670`
- **Fecha:** 2026-09-18 (UTC-4)
- **Score:** **14/100** (baseline 14B: 29/100; control 14B: 43/100)
- **Veredictos:** 6 rojo / 1 verde

| # | Persona | Verdict | Hallazgos |
|---|---|---|---|
| 1 | cliente_enojado | ❌ rojo | 1 — fuera_de_kb |
| 2 | pide_humano | ✅ verde | 0 — escalado correcto |
| 3 | comprador_decidido | ❌ rojo | 3 — alucinacion, fuera_de_kb, debio_escalar |
| 4 | pregunton_precios | ❌ rojo | 4 — alucinacion ×4 (inventa precios; baseline era verde) |
| 5 | fuera_de_kb | ❌ rojo | 1 — fuera_de_kb (inventa políticas) |
| 6 | errores_modismos | ❌ rojo | 3 — alucinacion ×2, debio_escalar |
| 7 | receta_foto | ❌ rojo | 1 — alucinacion (sigue afirmando recibir foto sin OCR) |

## Comparación vs baseline (14B)

- Regresión principal: `pregunton_precios` pasa de **verde → rojo** (4 alucinaciones de precios, antes rechazaba precios fuera de KB).
- `comprador_decidido` empeora: 2 → 3 hallazgos (suma `debio_escalar`).
- Patrón dominante sigue siendo **alucinación factual** (7 de 10 hallazgos son `alucinacion` o `fuera_de_kb`).
- Único caso estable en verde: `pide_humano`.

## Conclusión

El 7B local **no es viable como agente NEA**: −15 puntos vs baseline y regresa en el caso que el 14B manejaba mejor (precios). Su rol razonable sigue siendo **judge**, donde ya calibra 3/3 con scoring manual.

## Incidente operacional

Durante el primer intento (`run_huip6nlntcmf3ytbvx8f`, marcado failed "Interrumpida por un reinicio del servidor") todo el stack Docker se detuvo con exit 137 (~OOM) a los ~22 min de run. Relevante para runs largos: monitorear memoria del host.
