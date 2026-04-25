# trust360 — DOSSIER

**Identity:** AI trust evaluation engine — pure multi-LLM ensemble pipeline
**Version:** v0.1
**Status:** `lab` — local dev, validated test suite
**Authority:** John Coates
**Repo:** ethikslabs/trust360
**Port:** 3000

---

## Visual Identity

| Field | Value |
|-------|-------|
| Glyph | 🛡 |
| Color | `#b45309` |

---

## What This Repo Owns

trust360 is a pure functional, stage-based evaluation pipeline. Given a question and optional evidence, it runs three LLMs in parallel, computes MOS (Mean Opinion Score) consensus, and returns a structured trust assessment.

It is a shared engine — proof360 calls it to confirm triggered gaps. Any 360 product that needs to evaluate a trust claim can call it.

**The boundary — by design:**
- No auth, no persistence, no retrieval, no model weighting, no agents.
- Stateless. Nothing stored between calls.
- A pure evaluator. It does not decide what to evaluate — callers do.

---

## Role in the 360 Stack

```
IMPERIUM (control plane)
└── trust360 (trust evaluation engine — shared)
    ├── called by proof360 (gap confirmation, parallel)
    └── callable by any 360 product needing trust evaluation
```

---

## Architecture

### Six-stage pipeline (`src/pipeline.js` → `src/stages/`)

| Stage | What it does |
|-------|-------------|
| `createContext` | UUID v4 trace ID, copies `question`/`evidence`/`metadata` into context |
| `buildPrompt` | Structured evaluation prompt from template; includes evidence block if present |
| `runLLMEnsemble` | GPT-4, GPT-3.5-turbo, Claude 3 Opus in parallel (`Promise.allSettled`, 20s timeout each via AbortController). Throws only if ALL fail; partial failure → 206. |
| `parseOutputs` | Parse + validate JSON from each response (score 1–10, reasoning string, confidence 0–1, assumptions array). Excludes invalid. |
| `computeConsensus` | MOS (arithmetic mean), population variance, agreement: high (var < 0.5) / medium (< 1.5) / low (≥ 1.5) |
| `buildResponse` | Formats `{ traceId, consensus, models, metrics }` |

Context accumulates across stages: `request → traceId + question + evidence + metadata → prompt → rawResponses → validResponses → consensus → response`

### Response

```json
{
  "traceId": "uuid",
  "consensus": { "score": 7.3, "variance": 0.4, "agreement": "high" },
  "models": [ ... ],
  "metrics": { ... }
}
```

HTTP 200 = all models responded. HTTP 206 = partial failure (some models failed).

---

## Stack

- **API:** Node.js + Fastify, port 3000
- **LLMs:** GPT-4, GPT-3.5-turbo (OpenAI), Claude 3 Opus (Anthropic)
- **Testing:** vitest, 25 property-based test files via fast-check, 100+ generated cases each
- **No database, no persistence, no auth**

---

## Key Files

| File | Purpose |
|------|---------|
| `src/pipeline.js` | Stage registry + `executePipeline()` entry point |
| `src/server.js` | Fastify routes, 200 vs 206 logic, error handler |
| `src/config/models.js` | `MODEL_CONFIG` — 3 LLM providers |
| `src/utils/llm-wrapper.js` | Single `callLLM()` over OpenAI + Anthropic SDKs |
| `src/utils/consensus.js` | `calculateMOS()`, `calculateVariance()`, `classifyAgreement()` |

---

## Testing

```
tests/unit/          — individual stage and utility functions
tests/integration/   — end-to-end with mocked LLM calls
tests/properties/    — 25 files, 100+ generated cases each (fast-check)
```

Requirements traceability: stage source files reference spec requirements (e.g., `// Requirements: 3.1, 3.2`). Formal spec in `.kiro/specs/trust360-v0-1-pipeline/`.

---

## Open Items

- No production deploy path defined
- VERITAS integration: trust360 is the current evaluation engine; long-term VERITAS governs trust credentials
- HTTP 206 partial failure handling on the caller side (proof360 fallback confirms all gaps if trust360 unavailable)

---

## Related

- `proof360/` — primary caller (gap confirmation)
- `VERITAS/` — future trust credential layer (trust360 is the evaluation engine; VERITAS governs publication)
- `WHY.md` — origin story and the Ethiks360 context — why any of this exists

---

## MCP Surface (planned)

```
mcp://trust360/
└── tools/
    └── evaluate_trust        — POST /trust; { question, evidence? } → MOS consensus score, variance, per-model results
```

---

## A2A Agent Card

```json
{
  "agent_id": "trust360",
  "display_name": "trust360 — Multi-LLM trust evaluation engine",
  "owner": "john-coates",
  "version": "0.1.0",
  "port": 3000,
  "capabilities": [
    "trust_evaluation",
    "llm_ensemble",
    "mos_consensus"
  ],
  "authority_level": "product",
  "contact_protocol": "http",
  "human_principal": "john-coates"
}
```

---

## Deployment

| Field | Value |
|-------|-------|
| GitHub | `ethikslabs/trust360` |
| EC2 | no — local only (called by proof360 via localhost) |
| URL | local only |
| Deploy method | not deployed |
| PM2 name | n/a |
| Local port | 3000 |

---

## Commercial

| Field | Value |
|-------|-------|
| Status | pre-revenue |
| Founder | john-coates |
| ABN / UEN | pending |
| Capital path | revenue |
| Revenue model | Trust evaluation-as-a-service — per-call MOS ensemble fee; shared engine callable by any 360 product needing trust claim evaluation |
| IP boundary | Six-stage pure functional pipeline, MOS consensus engine, multi-LLM parallel evaluation, partial-failure protocol (206 response), stateless-by-design guarantee |
| Stack dependency | VECTOR (LLM ensemble calls, future migration from direct Anthropic/OpenAI) |
| First customer | internal: proof360 (gap confirmation — called in parallel, live) |

### Traction

| Metric | Value | Source |
|--------|-------|--------|
| Tests passing | 25 property files, 100+ cases each | manual |
| Called by proof360 | live | manual |

---

*Last updated: 2026-04-25*
*Authority: john-coates*
