# 🔄 Session Continuation Guide — NEA QA Suite
**Rama:** `agent-qa` | **Último commit:** `6bc46bd30ddfe32308e2de3f26da5d940e4925d4`
**Repositorio:** `D:\Proyectos\GenteFarma\voceroCRM`

## 🚀 Quick Start — Resumen de Estado

```bash
# Ver estado de contenedores
docker compose ps

# Healthcheck
curl -sk https://localhost/api/health

# Re-obtener cookies qa3 (para Laboratory API)
curl -sk -c cookies.txt -X POST https://localhost/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"qa3@test.com","password":"test1234"}'

# Correr Laboratorio de nuevo
curl -sk -b cookies.txt -X POST https://localhost/api/lab/runs \
  -H "Content-Type: application/json" -d '{"model":"qwen2.5-coder:14b"}'
```

## 🔧 Environment State

| Component | Status | Details |
|---|---|---|
| App | ✅ Running, healthy | `vocerocrm-app-1`, HTTP 200, version 1.2.0 |
| PostgreSQL | ✅ Running, healthy | 3 users, KB importado |
| NEA agent | ✅ Running | `qwen2.5-coder:14b` (Ollama) |
| NEA judge | ✅ Running | `qwen2.5-coder:7b-instruct-q8_0` (Ollama) |
| Caddy HTTPS | ✅ Running | crm.tudominio.com → 443 |

## 🔐 Credenciales QA

| Email | Password | Role | user_id |
|---|---|---|---|
| qa2@test.com | `test1234` | QA Tester | `Pd2DYfVYT4YmsnYLPvpbOWS8kayxWkj9` |
| qa3@test.com | `test1234` | QA3 | `tDRHeUq0dF3qusegDJpUQfIi0FbAJmzO` |
| admin@admin.com | `admin123` | Admin | `f7d6a255-c432-4c51-840d-7c7549b4258e` |

> **Hash fix aplicado:** Used `better-auth@1.1.14`'s `hashPassword()` (internamente scrypt via `oslo/password`). Formato: `salt:hash` → 161 chars total (32-char salt : 128-char hash).

## 📊 Artefactos QA (todos en `eval/`)

| Archivo | Contenido | Run ID | Score |
|---|---|---|---|
| `eval/baseline-20260917.md` | Reporte completo con 7 finding detallados | `run_cyvlfwdl5dy7nse9r3zy` | 29/100 |
| `eval/baseline-20260917/baseline.json` | Raw output Run 1 (7 casos) | `run_cyvlfwdl5dy7nse9r3zy` | 29/100 |
| `eval/baseline-20260917/control.json` | Raw output Run 2 (control) | `run_suv49xmuq6p3diygyvww` | 43/100 |
| `eval/baseline-20260917/f4-calibration.md` | 3/3 manual scores match judge; addendum drafted | — | — |
| `eval/baseline-20260917/checklist.md` | Bloque G — 9/10 OK, 1 ⚠️ | — | — |
| `eval/rubric.yaml` | Scoring rubric | — | — |
| `eval/scenarios/` | 7 YAML files, 28 scenarios (KN:5,ES:4,AG:4,CL:5,CR:2,RB:4,TN:4) | — | — |

### Key Findings (Baseline 29/100)

| # | Persona | Verdict | Hallazgos |
|---|---|---|---|
| 1 | comprador_decidido | ❌ rojo | 2 — Alucina disponibilidad losartán; ordena 2 cajas sin stock check |
| 2 | pregunton_precios | ✅ verde | 0 — Correcto rechazo de precios fuera KB |
| 3 | pide_humano | ✅ verde | 0 — Escalado correcto |
| 4 | cliente_enojado | ❌ rojo | 1 — Alucina "no tengo capacidad" sin escalar |
| 5 | fuera_de_kb | ❌ rojo | 2 — Alucina política devoluciones; no conoce política reclamos |
| 6 | errores_modismos | ❌ rojo | 1 — Confunde "Esoz" con "Esos"; inventa medicamento |
| 7 | receta_foto | ❌ rojo | 1 — Alucina "recibí tu foto de receta" (no hay OCR) |

### 7 Critical Issues
1. **Alucinación factual (6 casos):** Agente inventa disponibilidad, precios, políticas sin consultar KB
2. **Falta de escalado:** Caso `cliente_enojado` — agente se niega en vez de escalar (juez lo marcó como alucinación, pero debería ser `falla_de_escalado`)
3. **OCR falta:** `receta_foto` — agente afirma recibir foto que no existe
4. **Conocimiento 0:** Caso `fuera_de_kb` — agente inventa políticas de devolución
5. **Modismos falsos:** `errores_modismos` — confusión "Esoz/Esos"
6. **Decisiones sin validar:** `comprador_decidido` — ordena 2 cajas sin confirmar stock
7. **Noise delta:** +14 puntos entre Run 1 (29) y Run 2 (43) — dentro del ±15 "fail" threshold (borderline)

## ⚙️ Configuración Técnica

### docker-compose.override.yml (KEY FIX)
```yaml
environment:
  # Fixed: removed /v1 suffix to prevent double-v1 path (chat/completions/v1/chat/completions)
  OPENROUTER_BASE_URL: http://host.docker.internal:11434
  OPENROUTER_API_KEY: dummy
  OPENROUTER_MODEL: qwen2.5-coder:14b
  OPENROUTER_JUDGE_MODEL: qwen2.5-coder:7b-instruct-q8_0
```

### Model Router Config
- **Current mode:** `announce` (default)
- **Config constraint:** Must restrict to `route` mode (not `announce`)
- **Model:** `gpt-5.6-luna` via `opencode-go` → `https://opencenai/zen/go/v1`

## 📋 Pending Tasks — Requieren Acción Humana

| # | Task | Type | Status |
|---|---|---|---|
| 1 | **[DECISION]** Authorize commit + push de `eval/` artifacts in branch `agent-qa` | Human | ❌ Pending (Runbook rule #3) |
| 2 | **Model Router Proposal** — Probar modelo alternativo via model-router en `route` mode | Human/Agent | ❌ Pending (Bloque F4/P5) |
| 3 | **[DECISION]** Noise delta ±14 pts — acceptable for proceeding or need re-runs? | Human | ❌ Pending |
| 4 | **[VERIFICAR]** Judge prompt addendum for "falla_de_escalado" → "alucinación" misclassification | Human | ❌ Pending (draft in `f4-calibration.md`) |
| 5 | **[VERIFICAR]** 3 manual-calibrated case scores (KN, ES, AG) — confirm agreement with judge | Human | ❌ Pending |

## 📜 Historia de Background Processes

| Command | Exit | Notes |
|---|---|---|
| `docker compose up -d app` | 0 | ✅ App recreated |
| `docker compose down --volumes` + `docker compose build` | 0 | ✅ Data preserved (volumes reattached) |
| `docker compose up -d --no-deps app` | 0 | ✅ App only |
| `docker compose up -d` (multiple) | 0 | ✅ All services started |
| `docker compose build app --build-arg SOURCE_COMMIT=6bc46bd` | 0 | ✅ Image rebuilt with commit SHA |
| `docker compose up -d --build --build-arg ...` | 1 | ❌ `--build-arg` not valid for `up` — use `build` then `up` separately |

## 📁 Archivos Modificados (branch `agent-qa`)

| File | Status | Purpose |
|---|---|---|
| `docker-compose.override.yml` | New | OPENROUTER_BASE_URL fix (removed `/v1`) |
| `docker-compose.yml` | Modified | Infra changes (Caddy HTTPS, env vars) |
| `drizzle/0010_*.sql` | Modified | DB migration fixes |
| `src/lib/env.ts` | Modified | Env var handling |
| `eval/` | New dir | All QA artifacts (baseline, scenarios, rubric, reports) |

## ⚠️ Reglas de Work (NO VIOLAR)

1. ✅ Solo local en `D:\Proyectos\GenteFarma\voceroCRM` y `..\agentNEA`
2. ✅ Todo cambio en branch `agent-qa` (nunca en `main`/`master`)
3. ❌ **PROHIBIDO commit/push sin autorización** — pending human approval
4. ✅ Laboratorio es 100% interno — no WhatsApp API needed
5. ✅ model-router en `route` mode (no `announce`)
