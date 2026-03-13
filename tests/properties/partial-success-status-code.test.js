/**
 * Property-based test for partial success status code
 * 
 * Feature: trust360-v0-1-pipeline, Property 21
 * 
 * Property 21: Partial Success Status Code
 * **Validates: Requirements 8.2**
 * 
 * For any request where some models fail but at least 1 succeeds and all stages
 * complete, the system should return HTTP status 206.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { createServer } from '../../src/server.js';

// Mock LLM wrapper module
vi.mock('../../src/utils/llm-wrapper.js', () => ({
  callLLM: vi.fn()
}));

import { callLLM } from '../../src/utils/llm-wrapper.js';

describe('Feature: trust360-v0-1-pipeline, Property 21: Partial Success Status Code', () => {
  let server;

  beforeAll(async () => {
    server = createServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock LLM wrapper to simulate partial success
    // First call succeeds, subsequent calls fail
    let callCount = 0;
    callLLM.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // First model succeeds
        return JSON.stringify({
          score: 7,
          reasoning: 'Test reasoning for property test',
          confidence: 0.8,
          assumptions: ['Test assumption']
        });
      } else {
        // Subsequent models fail
        throw new Error('Model timeout or failure');
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 206 status when some models fail but at least one succeeds', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that when some models fail but
     * at least one succeeds, the system returns HTTP 206 status.
     * 
     * Strategy:
     * - Mock LLM calls to simulate partial success
     * - Generate random valid requests
     * - Verify 206 status code is returned
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.option(fc.string({ minLength: 0, maxLength: 100 })),
        async (question, evidence) => {
          const payload = {
            question,
            ...(evidence !== null && { evidence })
          };
          
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload
          });
          
          // Verify 206 status code
          expect(response.statusCode).toBe(206);
          
          // Verify response structure
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('traceId');
          expect(body).toHaveProperty('consensus');
          expect(body).toHaveProperty('models');
          expect(body).toHaveProperty('metrics');
          
          // Verify metrics show some failures
          expect(body.metrics.failedModels).toBeGreaterThan(0);
          expect(body.metrics.successfulModels).toBeGreaterThan(0);
          expect(body.metrics.successfulModels).toBeLessThan(body.metrics.totalModels);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 206 with complete response structure despite failures', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that 206 responses include
     * all required fields even when some models fail.
     * 
     * Strategy:
     * - Generate random valid requests
     * - Verify response has all required fields
     * - Verify consensus is computed from successful models only
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          expect(response.statusCode).toBe(206);
          
          const body = JSON.parse(response.body);
          
          // Verify all required fields are present
          expect(body).toHaveProperty('traceId');
          expect(body).toHaveProperty('consensus');
          expect(body).toHaveProperty('models');
          expect(body).toHaveProperty('metrics');
          
          // Verify consensus is computed
          expect(body.consensus).toHaveProperty('mos');
          expect(body.consensus).toHaveProperty('variance');
          expect(body.consensus).toHaveProperty('agreement');
          
          // Verify models array contains only successful models
          expect(body.models.length).toBe(body.metrics.successfulModels);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 206 with valid consensus from successful models only', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that consensus is computed
     * only from successful models when some fail.
     * 
     * Strategy:
     * - Generate random requests
     * - Verify consensus metrics are valid
     * - Verify consensus is based on successful models
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          expect(response.statusCode).toBe(206);
          
          const body = JSON.parse(response.body);
          const { consensus, models } = body;
          
          // Verify consensus is valid
          expect(consensus.mos).toBeGreaterThanOrEqual(1);
          expect(consensus.mos).toBeLessThanOrEqual(10);
          expect(consensus.variance).toBeGreaterThanOrEqual(0);
          expect(['high', 'medium', 'low']).toContain(consensus.agreement);
          
          // Verify consensus is computed from successful models
          expect(models.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 206 with accurate failure metrics', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that metrics accurately reflect
     * the number of successful and failed models.
     * 
     * Strategy:
     * - Generate random requests
     * - Verify metrics are consistent
     * - Verify failedModels > 0 and successfulModels > 0
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          expect(response.statusCode).toBe(206);
          
          const body = JSON.parse(response.body);
          const { metrics } = body;
          
          // Verify metrics consistency
          expect(metrics.totalModels).toBe(metrics.successfulModels + metrics.failedModels);
          
          // Verify partial success: some succeeded, some failed
          expect(metrics.successfulModels).toBeGreaterThan(0);
          expect(metrics.failedModels).toBeGreaterThan(0);
          
          // Verify execution time is positive
          expect(metrics.executionTimeMs).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 206 consistently for partial success scenarios', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that 206 status is returned
     * consistently across multiple partial success requests.
     * 
     * Strategy:
     * - Execute multiple requests sequentially
     * - Verify all return 206 status
     * - Verify consistency of response structure
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        async (questions) => {
          for (const question of questions) {
            const response = await server.inject({
              method: 'POST',
              url: '/trust',
              payload: { question }
            });
            
            expect(response.statusCode).toBe(206);
            
            const body = JSON.parse(response.body);
            expect(body.metrics.failedModels).toBeGreaterThan(0);
            expect(body.metrics.successfulModels).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 206 with only successful model responses in models array', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that the models array contains
     * only successful model responses, not failed ones.
     * 
     * Strategy:
     * - Generate random requests
     * - Verify models array length matches successfulModels count
     * - Verify each model response is valid
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          expect(response.statusCode).toBe(206);
          
          const body = JSON.parse(response.body);
          
          // Verify models array contains only successful responses
          expect(body.models.length).toBe(body.metrics.successfulModels);
          
          // Verify each model response has required fields
          body.models.forEach(model => {
            expect(model).toHaveProperty('model');
            expect(model).toHaveProperty('score');
            expect(model).toHaveProperty('confidence');
            expect(model).toHaveProperty('reasoning');
            expect(model).toHaveProperty('assumptions');
            
            // Verify score is valid
            expect(model.score).toBeGreaterThanOrEqual(1);
            expect(model.score).toBeLessThanOrEqual(10);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 206 for partial success with evidence', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that 206 status is returned
     * for partial success requests with evidence field.
     * 
     * Strategy:
     * - Generate requests with question and evidence
     * - Verify 206 status is returned
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question, evidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence }
          });
          
          expect(response.statusCode).toBe(206);
          
          const body = JSON.parse(response.body);
          expect(body.metrics.failedModels).toBeGreaterThan(0);
          expect(body.metrics.successfulModels).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 206 with unique trace IDs for each request', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that each partial success request
     * gets a unique trace ID.
     * 
     * Strategy:
     * - Execute multiple requests
     * - Collect trace IDs
     * - Verify all are unique
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 10 }),
        async (questions) => {
          const traceIds = [];
          
          for (const question of questions) {
            const response = await server.inject({
              method: 'POST',
              url: '/trust',
              payload: { question }
            });
            
            expect(response.statusCode).toBe(206);
            
            const body = JSON.parse(response.body);
            traceIds.push(body.traceId);
          }
          
          // Verify all trace IDs are unique
          const uniqueTraceIds = new Set(traceIds);
          expect(uniqueTraceIds.size).toBe(traceIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 206 with valid JSON response', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that 206 responses are valid JSON
     * and can be parsed correctly.
     * 
     * Strategy:
     * - Generate random requests
     * - Verify response body is valid JSON
     * - Verify no parsing errors
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          expect(response.statusCode).toBe(206);
          
          // Verify response is valid JSON
          expect(() => JSON.parse(response.body)).not.toThrow();
          
          const body = JSON.parse(response.body);
          expect(typeof body).toBe('object');
          expect(body).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should differentiate 206 from 200 based on failure count', async () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * This property test verifies that 206 is returned when
     * failedModels > 0, distinguishing it from 200 status.
     * 
     * Strategy:
     * - Verify 206 responses always have failedModels > 0
     * - Verify this distinguishes from 200 (all success)
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          expect(response.statusCode).toBe(206);
          
          const body = JSON.parse(response.body);
          
          // 206 must have at least one failure
          expect(body.metrics.failedModels).toBeGreaterThan(0);
          
          // 206 must have at least one success
          expect(body.metrics.successfulModels).toBeGreaterThan(0);
          
          // Total must be sum of successful and failed
          expect(body.metrics.totalModels).toBe(
            body.metrics.successfulModels + body.metrics.failedModels
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
