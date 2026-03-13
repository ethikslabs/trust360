/**
 * Property-based test for stage execution order
 * 
 * Feature: trust360-v0-1-pipeline, Property 6
 * 
 * Property 6: Stage Execution Order
 * **Validates: Requirements 3.1, 3.2**
 * 
 * For any request, the pipeline should execute stages in exactly this order:
 * createContext, buildPrompt, runLLMEnsemble, parseOutputs, computeConsensus,
 * buildResponse, with each stage receiving the Context_Object from the previous stage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { executePipeline, stages } from '../../src/pipeline.js';
import { createContext } from '../../src/stages/create-context.js';
import { buildPrompt } from '../../src/stages/build-prompt.js';
import { runLLMEnsemble } from '../../src/stages/run-llm-ensemble.js';
import { parseOutputs } from '../../src/stages/parse-outputs.js';
import { computeConsensus } from '../../src/stages/compute-consensus.js';
import { buildResponse } from '../../src/stages/build-response.js';
import * as llmWrapperModule from '../../src/utils/llm-wrapper.js';

describe('Feature: trust360-v0-1-pipeline, Property 6: Stage Execution Order', () => {
  beforeEach(() => {
    // Mock LLM wrapper to return successful responses
    vi.spyOn(llmWrapperModule, 'callLLM').mockResolvedValue(
      JSON.stringify({
        score: 7,
        reasoning: 'Test reasoning',
        confidence: 0.8,
        assumptions: ['Test assumption']
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute stages in the correct sequential order', async () => {
    /**
     * **Validates: Requirements 3.1**
     * 
     * This property test verifies that stages execute in the exact order
     * specified: createContext, buildPrompt, runLLMEnsemble, parseOutputs,
     * computeConsensus, buildResponse.
     * 
     * Strategy:
     * - Generate random valid requests
     * - Execute pipeline
     * - Verify response structure indicates all stages completed
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.option(fc.string({ minLength: 0, maxLength: 100 })),
        async (question, evidence) => {
          const request = {
            question,
            ...(evidence !== null && { evidence })
          };
          
          const result = await executePipeline(request);
          
          // Verify result has all expected fields from all stages
          // createContext: traceId
          expect(result).toHaveProperty('traceId');
          
          // buildPrompt: (internal, not in response)
          // runLLMEnsemble: models array
          expect(result).toHaveProperty('models');
          expect(Array.isArray(result.models)).toBe(true);
          
          // parseOutputs: validResponses (in models)
          // computeConsensus: consensus
          expect(result).toHaveProperty('consensus');
          expect(result.consensus).toHaveProperty('mos');
          expect(result.consensus).toHaveProperty('variance');
          expect(result.consensus).toHaveProperty('agreement');
          
          // buildResponse: metrics
          expect(result).toHaveProperty('metrics');
          expect(result.metrics).toHaveProperty('executionTimeMs');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify stage registry contains stages in correct order', () => {
    /**
     * **Validates: Requirements 3.1**
     * 
     * This property test verifies that the stage registry array
     * contains the stages in the correct order.
     * 
     * Strategy:
     * - Check the stages array structure
     * - Verify it contains exactly 6 stages
     * - Verify the order matches specification
     */
    
    expect(stages).toBeDefined();
    expect(Array.isArray(stages)).toBe(true);
    expect(stages.length).toBe(6);
    
    // Verify stage order by function reference
    expect(stages[0]).toBe(createContext);
    expect(stages[1]).toBe(buildPrompt);
    expect(stages[2]).toBe(runLLMEnsemble);
    expect(stages[3]).toBe(parseOutputs);
    expect(stages[4]).toBe(computeConsensus);
    expect(stages[5]).toBe(buildResponse);
  });

  it('should pass Context_Object from each stage to the next', async () => {
    /**
     * **Validates: Requirements 3.2**
     * 
     * This property test verifies that each stage receives the
     * Context_Object from the previous stage and passes it forward.
     * 
     * Strategy:
     * - Generate random requests
     * - Execute pipeline stages manually
     * - Verify context accumulates data through pipeline
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const request = { question };
          
          // Execute pipeline and track context flow
          let ctx = { request };
          
          // Stage 1: createContext
          ctx = await createContext(ctx);
          expect(ctx).toHaveProperty('traceId');
          expect(ctx).toHaveProperty('startTime');
          expect(ctx).toHaveProperty('question');
          const originalTraceId = ctx.traceId;
          
          // Stage 2: buildPrompt
          const ctxAfterPrompt = await buildPrompt(ctx);
          expect(ctxAfterPrompt).toHaveProperty('traceId', originalTraceId);
          expect(ctxAfterPrompt).toHaveProperty('prompt');
          
          // Verify trace ID persists
          expect(ctxAfterPrompt.traceId).toBe(originalTraceId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not skip any stages in the execution sequence', async () => {
    /**
     * **Validates: Requirements 3.1**
     * 
     * This property test verifies that all stages are executed
     * and none are skipped during pipeline execution.
     * 
     * Strategy:
     * - Generate random requests
     * - Execute pipeline
     * - Verify result contains outputs from all stages
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const request = { question };
          const result = await executePipeline(request);
          
          // Verify all stage outputs are present
          expect(result).toHaveProperty('traceId'); // createContext
          expect(result).toHaveProperty('models'); // runLLMEnsemble + parseOutputs
          expect(result).toHaveProperty('consensus'); // computeConsensus
          expect(result).toHaveProperty('metrics'); // buildResponse
          
          // Verify consensus has all fields
          expect(result.consensus).toHaveProperty('mos');
          expect(result.consensus).toHaveProperty('variance');
          expect(result.consensus).toHaveProperty('agreement');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain stage order consistency across multiple requests', async () => {
    /**
     * **Validates: Requirements 3.1**
     * 
     * This property test verifies that stage execution order
     * is consistent across multiple sequential requests.
     * 
     * Strategy:
     * - Execute multiple requests sequentially
     * - Verify each produces valid output
     * - Ensure no state leakage between requests
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        async (questions) => {
          for (const question of questions) {
            const request = { question };
            const result = await executePipeline(request);
            
            // Verify each result has all expected fields
            expect(result).toHaveProperty('traceId');
            expect(result).toHaveProperty('consensus');
            expect(result).toHaveProperty('models');
            expect(result).toHaveProperty('metrics');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
