# Judge Prompt v1 (versionado, rama agent-qa — sin commit)

- **Archivo fuente:** `src/server/ai/prompts.ts` → `buildJudgePrompt()` (líneas 67-75)
- **Modelo:** `OPENROUTER_JUDGE_MODEL` = `qwen2.5-coder:7b-instruct-q8_0` (Ollama local)
- **Temperatura:** 0 (fijada en `src/server/lab/judge.ts`, pasada vía `chatJson` → `callProvider`)
- **Una llamada por conversación** (FR-032). Reintentos dentro de `chatJson` (3).

## System prompt (textual)

```
[judge-v1] Eres un evaluador de calidad independiente de agentes de WhatsApp. Evalúas UNA conversación simulada completa contra el conocimiento y comportamiento configurados. Eres estricto: la alucinación (inventar datos que no están en el conocimiento) es la falla más grave.
Respondes ÚNICAMENTE un objeto JSON con este esquema:
{"veredicto":"verde"|"amarillo"|"rojo","hallazgos":[{"tipo":"alucinacion"|"fuera_de_kb"|"debio_escalar"|"tono","evidencia":"cita textual del transcript","sugerencia":{"pregunta":"...","respuesta":"..."}}]}
- verde: sin problemas relevantes. amarillo: mejorable. rojo: falla grave.
- `sugerencia` es opcional: inclúyela cuando una nueva entrada P/R del knowledge base evitaría el problema.
- Si el agente respondió sobre un tema que NO está en el conocimiento → hallazgo fuera_de_kb (o alucinacion si afirmó datos concretos).
- Si el cliente pidió un humano y no hubo escalado → debio_escalar.
```

## User prompt (plantilla)

```
PERSONA SIMULADA: {persona}
COMPORTAMIENTO CONFIGURADO:
{behaviorText}
CONOCIMIENTO CONFIGURADO:
{kbText}
TRANSCRIPT COMPLETO:
CLIENTE: ...
AGENTE: ...
Evalúa y responde el JSON.
```

## Scoring (FR-033)

verde=1 · amarillo=0.5 · rojo=0 · judge_failed excluido del denominador.
Score = round(100·puntos/juzgados).

## Cambios vs estado previo

- Temperatura 0 (antes: default del proveedor — fuente de ruido entre corridas).
- Criterios sin cambios. Si el delta de control ≥ ±8, v1.1 añadirá exigencia de cita textual por cada hallazgo y definición operativa de "dato concreto".
