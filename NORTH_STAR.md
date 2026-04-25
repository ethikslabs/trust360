# NORTH_STAR — trust360

**Role:** AI trust evaluation pipeline
**Tier:** 360 — shared evaluation engine
**Winning looks like:** Any product in the stack can submit a question and evidence and get a consensus trust score with full model provenance. No black box, no single model opinion.

---

## What trust360 is

trust360 is a pure evaluator. Six-stage functional pipeline: createContext → buildPrompt → runLLMEnsemble → parseOutputs → computeConsensus → buildResponse. Three LLMs run in parallel, a MOS consensus score is computed, the result carries full model provenance. It has no opinion — it has a process. The process is the product.

## What trust360 refuses

- No persistence — stateless by design, no database
- No agents — pure function, no background processes
- No auth — trust360 trusts its caller (callers are internal stack members)
- No direct customer interaction — it is an engine, not a product surface

## Boundary

trust360 is called by: proof360 (gap confirmation), any 360 product needing trust evaluation
trust360 calls: VECTOR (three LLM calls in parallel)
trust360 returns: `{ traceId, consensus, models, metrics }`

## Winning

proof360 flags a compliance gap. trust360 confirms it against three models. The consensus score gives the reseller confidence to raise it with the customer. One call, three opinions, one answer.

---

*Authority: john-coates*
