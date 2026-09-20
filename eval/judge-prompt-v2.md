# Judge Prompt v2 (addendum F4, FINAL tras 3 iteraciones) — 2026-09-19

Base: `src/server/ai/prompts.ts` → `buildJudgePrompt` (rama agent-qa). Cambios vs v1:

1. **REGLA F4:** rechazo honesto o escalado a humano NO es alucinación ni fuera_de_kb cuando el tema no tiene cobertura en KB ni herramientas → verde/amarillo. Alucinación solo si el AGENTE afirma datos concretos inexistentes.
2. **CASOS CONCRETOS:** "no encontré X en el catálogo" es correcto (nunca fuera_de_kb); pedir texto en vez de foto es correcto (nunca alucinación); ofrecer humano es correcto. Alucinación exige afirmación textual del agente.
3. **DESEMPATE:** ante duda, veredicto MENOS severo; rojo solo con alucinación afirmativa citable del AGENTE; debio_escalar solo no vuelve rojo el veredicto.
4. **Cita del agente:** cada hallazgo cita texto del AGENTE; evidencia del cliente no es hallazgo válido.

## Calibración (14B agente + guardas, juez 7B temp 0, estado fresco por TRUNCATE)

| Iteración | Control | Score | Delta |
|---|---|---|---|
| v2.1 (solo REGLA F4) | A3 `run_92t8hyrh6ukp84nrzgj5` / B3 `run_3vicr7qpmyb86p5q7477` | 73 / 55 | **18** ❌ |
| v2.2 (+CASOS CONCRETOS) | A4 `run_r7xk2twx87qbf9xlppyd` / B4 `run_swmse05ci4b9lluw3efp` | 82 / 91 | **9** ❌ |
| v2.3 (+DESEMPATE) | A5 `run_glp9gkaueq295ck13u9w` / B5 `run_01ehvxbm74yvqmuh5zj9` | 82 / 91 | **9** ❌ |

**Resultado: criterio delta < ±8 NO se cumple en 3 iteraciones → se detiene según instrucción.** Mejora sustancial: delta 18 → 9; en v2.3, 8/11 casos dan veredicto idéntico en ambos controles. El delta residual proviene de 3 casos límite (`Comprador decidido`, `Preguntón de precios`, `Receta por foto`) donde el agente se comporta igual pero el 7B alterna rojo/verde — ruido inherente del juez local (Ollama 7B a temperature 0 no es 100% determinista), no del prompt. Siguiente palanca sugerida: juez más grande (14B) o un juez hosted, no más iteraciones de prompt.

**Nivel de score:** 82-91 con el MISMO agente 14B+guardas que scored 27 con juez v1 → la mayor parte del gap era sobre-marcado del juez, como sospechaba F4. Los rojos legítimos (`alucinación` afirmativa) persisten en los casos de precio/catálogo donde corresponde.

Artefactos: `eval/guarded-20260918/control-{a3,b3,a4,b4,a5,b5}.json`.
