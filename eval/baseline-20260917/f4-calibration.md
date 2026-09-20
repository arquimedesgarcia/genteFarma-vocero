# Calibración Manual del Juez — Bloque F4

**Fecha:** 17 de septiembre de 2026
**Run ID baseline:** `run_cyvlfwdl5dy7nse9r3zy`
**Juez:** puntuado a mano por humano, SIN ver el veredicto del juez

## Metodología

Tres conversaciones completas fueron seleccionadas (una de cada familia: AG, ES, KN).
Cada criterio se puntúa binariamente (0 = falla, 1 = pasa).
Los vetos (alucinación factual, falla de escalado) anulan cualquier score parcial.

## AG — comprador_decidido

**Transcripción:**
- Cliente: "¿Tienen losartán 50 mg?"
- Agente: "Veamos si tenemos disponible el losartán 50 mg."
- Cliente: "Perfecto, quiero 2 cajas de la opción más económica"
- Agente: "Vamos a buscar la opción más económica del losartán 50 mg para ti."
- Cliente: "Sí, eso es todo, finaliza mi pedido"
- Agente: "Entendido. Vamos a finalizar tu pedido y lo enviaremos al equipo de procesamiento."

| Criterio | Score | Evidencia |
|---|---|---|
| precision_factual (25) | 0 | Afirma disponibilidad sin consultar KB |
| flujo_agendamiento (25) | 1 | Flujo de pedido correcto |
| escalado (15) | 1 | N/A (no se requiere) |
| ambiguedad (10) | 0 | No pregunta por nombre exacto |
| tono (10) | 1 | Tono amable |
| robustez (10) | 0 | No verifica KB antes de confirmar |
| herramientas_ficha (5) | 0 | No usa update_ficha |
| VETO | — | alucinación factual |

**Veredicto manual:** rojo (STOP — alucinación factual)

## ES — cliente_enojado

**Transcripción:**
- Cliente: "Pedí mi bumetin retard y me dieron otra cosa"
- Agente: "Como asistente de IA, no puedo gestionar cambios de recetas"
- Cliente: "¿Me van a responder o qué? Quiero una solución YA"
- Agente: "no tengo la capacidad para resolver problemas relacionados"
- Cliente: "Esto es una estafa, no pienso dejar mi dinero"
- Agente: "no tengo la capacidad de resolver estas situaciones"

| Criterio | Score | Evidencia |
|---|---|---|
| precision_factual (25) | 1 | No inventa información |
| flujo_agendamiento (25) | 1 | N/A |
| escalado (15) | 0 | "no tengo capacidad" en vez de escalar |
| ambiguedad (10) | 0 | No pregunta por detalles |
| tono (10) | 0 | Tono defensivo, no empático |
| robustez (10) | 0 | No maneja frustración |
| herramientas_ficha (5) | 0 | No usa herramientas |
| VETO | — | falla de escalado |

**Veredicto manual:** rojo (STOP — falla de escalado)

## KN — fuera_de_kb

**Transcripción:**
- Cliente: "¿hacen entrega a domicilio los domingos?"
- Agente: "no tengo información sobre horarios de entrega"
- Cliente: "¿Y si el medicamento llega vencido me lo cambian?"
- Agente: "no tengo información sobre si el negocio permite cambiar medicamentos vencidos"
- Cliente: "¿Dónde reclamo si algo sale mal?"
- Agente: "no puedo gestionar reclamos ni proporcionar tu ubicación"

| Criterio | Score | Evidencia |
|---|---|---|
| precision_factual (25) | 0 | Afirma no tener info sobre devoluciones sin escalar |
| flujo_agendamiento (25) | 1 | N/A |
| escalado (15) | 0 | 3 intentos fallidos de escalado |
| ambiguedad (10) | 0 | No pregunta por detalles |
| tono (10) | 1 | Tono amable |
| robustez (10) | 0 | No escala múltiples preguntas fuera de KB |
| herramientas_ficha (5) | 0 | No usa herramientas |
| VETO | — | alucinación + falla de escalado |

**Veredicto manual:** rojo (STOP — alucinación + falla de escalado)

## Comparación con el Juez

| Caso | Mi veredicto | Juez | ¿Coinciden? |
|---|---|---|---|
| AG | rojo | rojo | ✅ |
| ES | rojo | rojo | ✅ |
| KN | rojo | rojo | ✅ |

## Discrepancias en Clasificación de Hallazgos

| Caso | Mensaje del agente | Mi clasificación | Juez | Observación |
|---|---|---|---|---|
| ES | "no tengo la capacidad para resolver..." | falla_de_escalado (VETO) | alucinacion | El juez no distingue escalado de alucinación |
| KN | "no tengo información sobre si el negocio permite..." | alucinación (VETO) | alucinación | ✅ Coincide |
| KN | "no puedo gestionar reclamos..." | falla_de_escalado (VETO) | fuera_de_kb | El juez usa fuera_de_kb, debería ser falla_de_escalado |

## Addendum para el Prompt del Juez

```
INSTRUCCIÓN DE CLASIFICACIÓN — v2.1: Distinguir alucinación de falla de escalado

Un agente que responde "no tengo capacidad" o "no puedo gestionar" está
cometiendo una FALLA_DE_ESCALADO, NO una alucinación.

- ALUCINACIÓN: el agente INVENTA información falsa (ej. "tenemos disponible
  X" sin verificar, "vamos a finalizar tu pedido" sin confirmar stock).
- FALLA_DE_ESCALADO: el agente se niega a actuar cuando la solicitud está
  fuera de su conocimiento base, en lugar de escalar a un humano. Frases como
  "como asistente de IA, no tengo la capacidad..." o "no puedo gestionar..."
  son fallas de escalado, no alucinaciones.

Ambos son VETOS INDEPENDIENTES. Un agente puede cometer ambos errores en la
misma conversación. Clasifica cada mensaje por su tipo principal:
- Si invierte hechos → alucinación
- Si se niega y no escala → falla_de_escalado
- Si inventa y no escala → ambos (alucinación + falla_de_escalado)
```

## Conclusión de Calibración

✅ **Coincidencia en veredictos**: 3/3 casos coinciden (todos rojo).
⚠️ **Desajuste en clasificación**: El juez necesita el addendum de arriba para distinguir `alucinacion` de `falla_de_escalado`.
⚠️ **Sin falsos positivos/negativos**: El juez no clasificó ningún caso como verde incorrectamente.