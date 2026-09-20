# Run LongCat 2.0 — meituan/longcat-2.0 (Nous Portal, free)

- **Run ID:** `run_bqoo3dwy0m694lp97qls`
- **Fecha:** 2026-09-18 (UTC-4)
- **Agente:** LongCat 2.0 via proxy local (scripts/llm-proxy.py) → Nous inference API
- **Judge:** qwen2.5-coder:7b-instruct-q8_0 (Ollama, SIN CAMBIOS vs baseline)
- **Score:** **21/100** (baseline 14B: 29/100; run 7B local: 14/100)
- **Veredictos:** 5 rojo / 1 amarillo / 1 verde

| # | Persona | Verdict | Hallazgos |
|---|---|---|---|
| 1 | cliente_enojado | ❌ rojo | 1 — debio_escalar (NO alucina; solo falta escalar) |
| 2 | pide_humano | ✅ verde | 0 |
| 3 | comprador_decidido | 🟡 amarillo | 3 — fuera_de_kb ×3 (mejora vs rojo del 14B) |
| 4 | pregunton_precios | ❌ rojo | 4 — alucinacion ×4 (regresión igual que 7B) |
| 5 | fuera_de_kb | ❌ rojo | 1 — fuera_de_kb |
| 6 | errores_modismos | ❌ rojo | 3 — alucinacion ×3 |
| 7 | receta_foto | ❌ rojo | 1 — alucinacion |

## Comparación

| Run | Modelo agente | Score |
|---|---|---|
| baseline | qwen2.5-coder:14b | 29 |
| 7B | qwen2.5-coder:7b | 14 |
| **este** | **LongCat 2.0 (free)** | **21** |

## Lectura clave para soluciones anti-alucinación

1. **La alucinación es cross-model:** los 3 modelos alucinan precios/políticas → el problema es de **arquitectura del agente, no del modelo**. En agentNEA ya existen guardas (turn.py fuerza `ver_carrito`/catálogo) pero solo cubren carrito, no precios ni políticas ni "recibí tu foto".
2. **`pregunton_precios` falla en los 3:** el agente no consulta KB de precios antes de responder → necesita guarda hard: si el turno menciona precio/total sin llamada previa a herramienta de precios, re-prompt o rechazo estándar.
3. **`receta_foto` alucina en los 3:** afirma recibir foto que no existe en el flujo del lab → agregar señal de entorno ("este canal no soporta media") o OCR real.
4. **`fuera_de_kb`:** respuesta estándar de escalado, no generación libre.
5. LongCat sigue instrucciones algo mejor (cliente_enojado sin alucinación, comprador a amarillo) pero **no resuelve el patrón**.

## Notas operacionales

- El campo `model` del POST /api/lab/runs se ignora: el modelo del agente se define en env del contenedor `nea` (OPENAI_MODEL). El run "7B" anterior usó en realidad el 14B; su delta 29→14 es **ruido del juez**, no cambio de modelo.
- Proxy `scripts/llm-proxy.py` (host :11500) enruta meituan/* → Nous, resto → Ollama (juez local intacto). Token OAuth del Portal leído de hermes/shared/nous_auth.json.
- Infra: stack Docker murió con exit 137 (~OOM) en un run anterior; revisar memoria del host en runs largos.
