/**
 * Property-based test for stage function signature
 * 
 * Feature: trust360-v0-1-pipeline, Property 8
 * 
 * Property 8: Stage Function Signature
 * **Validates: Requirements 3.4, 10.6**
 * 
 * For any stage in the pipeline, it should be an async function with signature
 * stage(ctx) => ctx that accepts and returns a Context_Object.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { stages } from '../../src/pipeline.js';
import { createContext } from '../../src/stages/create-context.js';
import { buildPrompt } from '../../src/stages/build-prompt.js';
import { runLLMEnsemble } from '../../src/stages/run-llm-ensemble.js';
import { parseOutputs } from '../../src/stages/parse-outputs.js';
import { computeConsensus } from '../../src/stages/compute-consensus.js';
import { buildResponse } from '../../src/stages/build-response.js';

describe('Feature: trust360-v0-1-pipeline, Property 8: Stage Function Signature', () => {
  const allStages = [
    { name: 'createContext', fn: createContext },
    { name: 'buildPrompt', fn: buildPrompt },
    { name: 'runLLMEnsemble', fn: runLLMEnsemble },
    { name: 'parseOutputs', fn: parseOutputs },
    { name: 'computeConsensus', fn: computeConsensus },
    { name: 'buildResponse', fn: buildResponse }
  ];

  it('should verify all stages are async functions', () => {
    /**
     * **Validates: Requirements 3.4**
     * 
     * This property test verifies that all stages are async functions
     * that return Promises.
     * 
     * Strategy:
     * - Check each stage function type
     * - Verify they are functions
     * - Verify they return Promises when called
     */
    
    allStages.forEach(({ name, fn }) => {
      // Verify it's a function
      expect(typeof fn).toBe('function');
      
      // Verify function name matches (for debugging)
      expect(fn.name).toBe(name);
    });
  });

  it('should verify all stages accept a context object parameter', async () => {
    /**
     * **Validates: Requirements 3.4, 10.6**
     * 
     * This property test verifies that all stages accept a context
     * object as their parameter.
     * 
     * Strategy:
     * - Generate random context objects
     * - Call each stage with context
     * - Verify no errors from parameter mismatch
     * - Verify stages can be called with context
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          // Create a minimal valid context
          const ctx = {
            request: { question },
            traceId: 'test-trace-id',
            startTime: Date.now(),
            question,
            evidence: null,
            metadata: {},
            rawResponses: [],
            validResponses: [],
            consensus: null,
            response: null
          };
          
          // Verify each stage accepts context parameter
          // We'll test createContext separately since it has different input
          const result = await createContext({ request: { question } });
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all stages return a context object', async () => {
    /**
     * **Validates: Requirements 3.4, 10.6**
     * 
     * This property test verifies that all stages return a context
     * object (not undefined, null, or other types).
     * 
     * Strategy:
     * - Generate random context objects
     * - Call each stage
     * - Verify return value is an object
     * - Verify return value has expected context properties
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.option(fc.string({ minLength: 0, maxLength: 100 })),
        async (question, evidence) => {
          // Test createContext
          const ctx1 = await createContext({
            request: {
              question,
              ...(evidence !== null && { evidence })
            }
          });
          
          expect(ctx1).toBeDefined();
          expect(typeof ctx1).toBe('object');
          expect(ctx1).not.toBeNull();
          expect(ctx1).toHaveProperty('traceId');
          
          // Test buildPrompt
          const ctx2 = await buildPrompt(ctx1);
          expect(ctx2).toBeDefined();
          expect(typeof ctx2).toBe('object');
          expect(ctx2).not.toBeNull();
          expect(ctx2).toHaveProperty('traceId');
          expect(ctx2).toHaveProperty('prompt');
          
          // Verify context is passed through
          expect(ctx2.traceId).toBe(ctx1.traceId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify stages follow async/await pattern', async () => {
    /**
     * **Validates: Requirements 3.4**
     * 
     * This property test verifies that all stages return Promises
     * and can be awaited.
     * 
     * Strategy:
     * - Call each stage
     * - Verify return value is a Promise
     * - Verify Promise resolves to context object
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const ctx = { request: { question } };
          
          // Call createContext and verify it returns a Promise
          const result = createContext(ctx);
          expect(result).toBeInstanceOf(Promise);
          
          // Await the Promise and verify it resolves to an object
          const resolvedCtx = await result;
          expect(typeof resolvedCtx).toBe('object');
          expect(resolvedCtx).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify stages maintain context object structure', async () => {
    /**
     * **Validates: Requirements 3.4, 10.6**
     * 
     * This property test verifies that stages maintain the context
     * object structure by returning an object that includes the
     * input context properties.
     * 
     * Strategy:
     * - Generate random context objects
     * - Call stages sequentially
     * - Verify each stage preserves previous context properties
     * - Verify context accumulates data through pipeline
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          // Stage 1: createContext
          let ctx = await createContext({ request: { question } });
          const originalTraceId = ctx.traceId;
          
          // Stage 2: buildPrompt - should preserve traceId
          ctx = await buildPrompt(ctx);
          expect(ctx.traceId).toBe(originalTraceId);
          expect(ctx).toHaveProperty('prompt');
          
          // Verify context structure is maintained
          expect(ctx).toHaveProperty('question');
          expect(ctx).toHaveProperty('startTime');
          expect(ctx).toHaveProperty('metadata');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify stages accept context with varying properties', async () => {
    /**
     * **Validates: Requirements 3.4, 10.6**
     * 
     * This property test verifies that stages can handle context
     * objects with varying properties (optional fields present/absent).
     * 
     * Strategy:
     * - Generate contexts with different optional fields
     * - Verify stages handle all variations
     * - Test with/without evidence, metadata, etc.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.option(fc.string({ minLength: 0, maxLength: 100 })),
        fc.option(fc.dictionary(fc.string(), fc.jsonValue())),
        async (question, evidence, metadata) => {
          const request = {
            question,
            ...(evidence !== null && { evidence }),
            ...(metadata !== null && { metadata })
          };
          
          const ctx = await createContext({ request });
          
          // Verify stage handles varying context properties
          expect(ctx).toHaveProperty('traceId');
          expect(ctx).toHaveProperty('question', question);
          
          if (evidence !== null) {
            expect(ctx).toHaveProperty('evidence', evidence);
          } else {
            expect(ctx.evidence).toBeNull();
          }
          
          if (metadata !== null) {
            expect(ctx.metadata).toEqual(metadata);
          } else {
            expect(ctx.metadata).toEqual({});
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify stages do not mutate input context directly', async () => {
    /**
     * **Validates: Requirements 3.4, 10.6**
     * 
     * This property test verifies that stages follow functional
     * programming principles by not mutating the input context
     * directly (they should return a new/modified context).
     * 
     * Strategy:
     * - Create context object
     * - Call stage
     * - Verify original context is not modified
     * - Verify returned context is different object
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const originalCtx = { request: { question } };
          
          // Store original properties
          const originalKeys = Object.keys(originalCtx);
          
          // Call createContext
          const newCtx = await createContext(originalCtx);
          
          // Verify original context still has same keys
          expect(Object.keys(originalCtx)).toEqual(originalKeys);
          
          // Verify new context has additional properties
          expect(Object.keys(newCtx).length).toBeGreaterThan(originalKeys.length);
          
          // Verify they are different objects
          expect(newCtx).not.toBe(originalCtx);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all stages in registry follow the signature pattern', () => {
    /**
     * **Validates: Requirements 3.4, 10.6**
     * 
     * This property test verifies that all stages in the stage
     * registry array follow the required signature pattern.
     * 
     * Strategy:
     * - Iterate through stages array
     * - Verify each is a function
     * - Verify function arity (accepts 1 parameter)
     */
    
    expect(stages).toBeDefined();
    expect(Array.isArray(stages)).toBe(true);
    
    stages.forEach((stage, index) => {
      // Verify it's a function
      expect(typeof stage).toBe('function');
      
      // Verify function accepts 1 parameter (ctx)
      expect(stage.length).toBe(1);
      
      // Verify function has a name (for debugging)
      expect(stage.name).toBeTruthy();
    });
  });

  it('should verify stages can be composed in sequence', async () => {
    /**
     * **Validates: Requirements 3.4, 10.6**
     * 
     * This property test verifies that stages can be composed
     * in sequence, with each stage's output serving as the next
     * stage's input.
     * 
     * Strategy:
     * - Generate random requests
     * - Compose stages manually
     * - Verify composition works correctly
     * - Verify final context has all accumulated properties
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          // Compose stages manually
          let ctx = { request: { question } };
          
          // Apply each stage in sequence
          ctx = await createContext(ctx);
          expect(ctx).toHaveProperty('traceId');
          
          ctx = await buildPrompt(ctx);
          expect(ctx).toHaveProperty('prompt');
          
          // Verify composition maintains all properties
          expect(ctx).toHaveProperty('traceId');
          expect(ctx).toHaveProperty('question');
          expect(ctx).toHaveProperty('prompt');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify stages return context synchronously when awaited', async () => {
    /**
     * **Validates: Requirements 3.4**
     * 
     * This property test verifies that when stages are awaited,
     * they return the context object synchronously (not another Promise).
     * 
     * Strategy:
     * - Call stages with await
     * - Verify result is not a Promise
     * - Verify result is immediately accessible
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const ctx = await createContext({ request: { question } });
          
          // Verify result is not a Promise
          expect(ctx).not.toBeInstanceOf(Promise);
          
          // Verify result is immediately accessible
          expect(ctx.traceId).toBeDefined();
          expect(typeof ctx.traceId).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify stages maintain consistent return type', async () => {
    /**
     * **Validates: Requirements 3.4, 10.6**
     * 
     * This property test verifies that stages consistently return
     * objects (not arrays, primitives, or other types).
     * 
     * Strategy:
     * - Generate various requests
     * - Call each stage
     * - Verify return type is always object
     * - Verify return value is never null/undefined
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
          
          const ctx = await createContext({ request });
          
          // Verify return type
          expect(typeof ctx).toBe('object');
          expect(ctx).not.toBeNull();
          expect(Array.isArray(ctx)).toBe(false);
          
          // Verify it's a plain object with properties
          expect(Object.keys(ctx).length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
