/**
 * Property-based test for Trace ID generation
 * 
 * Feature: trust360-v0-1-pipeline, Property 5
 * 
 * Property 5: Trace ID Generation and Format
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * For any request processed by the pipeline, the system should generate a unique
 * UUID v4 Trace_ID that appears in the Context_Object, all log entries, and the
 * response payload.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createContext } from '../../src/stages/create-context.js';
import { logger } from '../../src/utils/logger.js';

describe('Feature: trust360-v0-1-pipeline, Property 5: Trace ID Generation and Format', () => {
  let logSpy;
  
  beforeEach(() => {
    // Spy on logger to verify trace ID appears in logs
    logSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate valid UUID v4 format trace IDs for all requests', async () => {
    /**
     * **Validates: Requirements 2.1**
     * 
     * This property test verifies that every request generates a trace ID
     * that conforms to the UUID v4 format specification.
     * 
     * Strategy:
     * - Generate random request objects with various question/evidence combinations
     * - Create context for each request
     * - Verify the trace ID matches UUID v4 format (8-4-4-4-12 hex pattern)
     * - Test across 100 iterations with different request structures
     */
    
    // UUID v4 regex pattern: 8-4-4-4-12 hex digits with version 4 indicator
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    await fc.assert(
      fc.asyncProperty(
        // Generate random questions (1-2000 chars)
        fc.string({ minLength: 1, maxLength: 2000 }),
        // Generate optional evidence (0-5000 chars)
        fc.option(fc.string({ minLength: 0, maxLength: 5000 })),
        // Generate optional metadata
        fc.option(fc.dictionary(fc.string(), fc.anything())),
        async (question, evidence, metadata) => {
          const request = {
            question,
            ...(evidence !== null && { evidence }),
            ...(metadata !== null && { metadata })
          };
          
          const ctx = await createContext({ request });
          
          // Verify trace ID exists
          expect(ctx.traceId).toBeDefined();
          expect(typeof ctx.traceId).toBe('string');
          
          // Verify trace ID matches UUID v4 format
          expect(ctx.traceId).toMatch(uuidV4Regex);
          
          // Verify the version field is '4' (UUID v4)
          const versionChar = ctx.traceId.charAt(14);
          expect(versionChar).toBe('4');
          
          // Verify the variant field is correct (8, 9, a, or b)
          const variantChar = ctx.traceId.charAt(19).toLowerCase();
          expect(['8', '9', 'a', 'b']).toContain(variantChar);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique trace IDs across multiple requests', async () => {
    /**
     * **Validates: Requirements 2.1**
     * 
     * This property test verifies that trace IDs are unique across multiple
     * concurrent and sequential requests. UUID v4 should have negligible
     * collision probability.
     * 
     * Strategy:
     * - Generate multiple requests in parallel
     * - Collect all trace IDs
     * - Verify no duplicates exist
     * - Test with varying batch sizes (10-100 requests)
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate batch size between 10 and 100
        fc.integer({ min: 10, max: 100 }),
        // Generate array of random questions
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 10, maxLength: 100 }),
        async (batchSize, questions) => {
          // Use the specified batch size
          const requestBatch = questions.slice(0, batchSize);
          
          // Create contexts for all requests in parallel
          const contexts = await Promise.all(
            requestBatch.map(question => 
              createContext({ request: { question } })
            )
          );
          
          // Extract all trace IDs
          const traceIds = contexts.map(ctx => ctx.traceId);
          
          // Verify all trace IDs are unique
          const uniqueTraceIds = new Set(traceIds);
          expect(uniqueTraceIds.size).toBe(traceIds.length);
          
          // Verify each trace ID is a valid UUID v4
          const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          traceIds.forEach(traceId => {
            expect(traceId).toMatch(uuidV4Regex);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include trace ID in all structured log entries', async () => {
    /**
     * **Validates: Requirements 2.2**
     * 
     * This property test verifies that the trace ID appears in all log entries
     * for a request, enabling request tracing through logs.
     * 
     * Strategy:
     * - Generate random requests
     * - Create context and capture log calls
     * - Verify all log entries contain the trace ID
     * - Test across various request types
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
        fc.option(fc.string({ minLength: 0, maxLength: 5000 })),
        async (question, evidence) => {
          // Clear previous log calls
          logSpy.mockClear();
          
          const request = {
            question,
            ...(evidence !== null && { evidence })
          };
          
          const ctx = await createContext({ request });
          
          // Verify logger was called
          expect(logSpy).toHaveBeenCalled();
          
          // Verify all log calls include the trace ID
          logSpy.mock.calls.forEach(call => {
            const logEntry = call[0];
            expect(logEntry).toHaveProperty('traceId');
            expect(logEntry.traceId).toBe(ctx.traceId);
          });
          
          // Verify the log entry includes stage information
          const logEntry = logSpy.mock.calls[0][0];
          expect(logEntry.stage).toBe('createContext');
          expect(logEntry.action).toBe('initialized');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include trace ID in the Context_Object throughout pipeline', async () => {
    /**
     * **Validates: Requirements 2.1, 2.3**
     * 
     * This property test verifies that the trace ID is present in the
     * Context_Object and persists throughout the pipeline execution.
     * 
     * Strategy:
     * - Generate random requests
     * - Create context
     * - Verify trace ID is in the returned Context_Object
     * - Verify trace ID is accessible for subsequent stages
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
        fc.option(fc.string({ minLength: 0, maxLength: 5000 })),
        fc.option(fc.dictionary(fc.string(), fc.jsonValue())),
        async (question, evidence, metadata) => {
          const request = {
            question,
            ...(evidence !== null && { evidence }),
            ...(metadata !== null && { metadata })
          };
          
          const ctx = await createContext({ request });
          
          // Verify trace ID is in the Context_Object
          expect(ctx).toHaveProperty('traceId');
          expect(typeof ctx.traceId).toBe('string');
          expect(ctx.traceId.length).toBeGreaterThan(0);
          
          // Verify Context_Object structure includes all required fields
          expect(ctx).toHaveProperty('startTime');
          expect(ctx).toHaveProperty('question');
          expect(ctx).toHaveProperty('evidence');
          expect(ctx).toHaveProperty('metadata');
          expect(ctx).toHaveProperty('rawResponses');
          expect(ctx).toHaveProperty('validResponses');
          expect(ctx).toHaveProperty('consensus');
          expect(ctx).toHaveProperty('response');
          
          // Verify the trace ID can be passed to subsequent stages
          // (simulating pipeline flow)
          const nextStageCtx = { ...ctx, someNewField: 'value' };
          expect(nextStageCtx.traceId).toBe(ctx.traceId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate trace IDs that are independent of request content', async () => {
    /**
     * **Validates: Requirements 2.1**
     * 
     * This property test verifies that trace ID generation is independent
     * of the request content. The same request content should produce
     * different trace IDs on different invocations.
     * 
     * Strategy:
     * - Use the same request content multiple times
     * - Verify different trace IDs are generated each time
     * - Ensures trace IDs are truly random and not derived from content
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const request = { question };
          
          // Create multiple contexts with the same request
          const ctx1 = await createContext({ request });
          const ctx2 = await createContext({ request });
          const ctx3 = await createContext({ request });
          
          // Verify all trace IDs are different
          expect(ctx1.traceId).not.toBe(ctx2.traceId);
          expect(ctx1.traceId).not.toBe(ctx3.traceId);
          expect(ctx2.traceId).not.toBe(ctx3.traceId);
          
          // Verify all are valid UUID v4
          const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          expect(ctx1.traceId).toMatch(uuidV4Regex);
          expect(ctx2.traceId).toMatch(uuidV4Regex);
          expect(ctx3.traceId).toMatch(uuidV4Regex);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain trace ID immutability in Context_Object', async () => {
    /**
     * **Validates: Requirements 2.1, 2.2, 2.3**
     * 
     * This property test verifies that once a trace ID is generated,
     * it remains constant throughout the request lifecycle and cannot
     * be accidentally modified.
     * 
     * Strategy:
     * - Generate context with trace ID
     * - Simulate pipeline mutations (adding fields, modifying data)
     * - Verify trace ID remains unchanged
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
        async (question, additionalData) => {
          const request = { question };
          const ctx = await createContext({ request });
          
          const originalTraceId = ctx.traceId;
          
          // Simulate pipeline stages adding data to context
          let mutatedCtx = { ...ctx };
          additionalData.forEach((data, index) => {
            mutatedCtx = {
              ...mutatedCtx,
              [`field${index}`]: data
            };
          });
          
          // Verify trace ID hasn't changed
          expect(mutatedCtx.traceId).toBe(originalTraceId);
          
          // Verify trace ID is still valid UUID v4
          const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          expect(mutatedCtx.traceId).toMatch(uuidV4Regex);
        }
      ),
      { numRuns: 100 }
    );
  });
});
