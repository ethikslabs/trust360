# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
cp .env.example .env       # first time: add OPENAI_API_KEY, ANTHROPIC_API_KEY
npm install
npm run dev                # watch mode, port 3000
npm start                  # production

npm test                   # all tests once (vitest --run)
npm run test:watch         # watch mode
npm run test:coverage      # with v8 coverage report
npm run test:properties    # property-based tests only

# Run a single test file
npx vitest --run tests/unit/create-context.test.js
npx vitest --run tests/properties/mos-calculation.test.js
```

## Pipeline Architecture

Trust360 is a **pure functional, stage-based pipeline**. The core contract: every stage is an async function `(ctx) => ctx` — it receives the full context object, augments it, and returns it. No side effects. No shared state.

**Stage execution order** (`src/pipeline.js` → `src/stages/`):

1. `createContext` — generates UUID v4 trace ID, copies `question`/`evidence`/`metadata` from request into context
2. `buildPrompt` — generates structured evaluation prompt from template; conditionally includes evidence block
3. `runLLMEnsemble` — calls 3 models in parallel via `Promise.allSettled()`: GPT-4, GPT-3.5-turbo, Claude 3 Opus (20s timeout each via AbortController); throws only if ALL fail; partial failure → 206 response
4. `parseOutputs` — parses JSON from each raw response, validates schema (score 1–10, reasoning string, confidence 0–1, assumptions array), excludes invalid
5. `computeConsensus` — MOS (arithmetic mean), population variance, agreement classification: high (var < 0.5), medium (< 1.5), low (≥ 1.5)
6. `buildResponse` — formats final `{ traceId, consensus, models, metrics }` response

The context object accumulates across stages: `request → traceId + question + evidence + metadata → prompt → rawResponses → validResponses → consensus → response`.

## Key Files

| File | Purpose |
|------|---------|
| `src/pipeline.js` | Stage registry + `executePipeline()` entry point |
| `src/server.js` | Fastify routes, status code logic (200 vs 206), error handler |
| `src/config/models.js` | `MODEL_CONFIG` — the 3 LLM providers and their configs |
| `src/utils/llm-wrapper.js` | Single `callLLM()` abstraction over OpenAI + Anthropic SDKs |
| `src/utils/consensus.js` | `calculateMOS()`, `calculateVariance()`, `classifyAgreement()` |
| `src/utils/validation.js` | `isValidModelResponse()` — schema guard for LLM JSON output |
| `src/utils/logger.js` | Pino logger with `logStage*()` and `logModel*()` helpers |
| `src/types.js` | JSDoc typedefs for all core shapes |

## Testing

Three test categories in `tests/`:
- **Unit** (`tests/unit/`) — individual stage and utility functions
- **Integration** (`tests/integration/trust-endpoint.test.js`) — end-to-end with mocked LLM calls
- **Property-based** (`tests/properties/`) — 25 files, 100+ generated cases each via fast-check; cover MOS invariants, agreement thresholds, stage ordering, partial failure handling

Requirements traceability: stage source files reference spec requirements (e.g., `// Requirements: 3.1, 3.2`). Formal spec lives in `.kiro/specs/trust360-v0-1-pipeline/`.

## Architectural Constraints

By design: **no auth, no persistence, no retrieval, no model weighting, no agents**. The pipeline is a pure evaluator. Requests are stateless — nothing is stored between calls. See `.kiro/specs/trust360-v0-1-pipeline/requirements.md` requirement 10 for the explicit exclusion list.
