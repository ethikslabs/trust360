/**
 * Property-based test for success status code
 * 
 * Feature: trust360-v0-1-pipeline, Property 20
 * 
 * Property 20: Success Status Code
 * **Validates: Requirements 8.1**
 * 
 * For any request where all models succeed and all stages complete successfully,
 * the system should return HTTP status 200.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { createServer } from '../../src/server.js';

// Mock LLM wrapper module
vi.mock('../../src/utils/llm-wrapper.js', () => ({
  callLLM: vi.fn()
}));

import { callLLM } from '../../src/utils/llm-wrapper.js';

describe('Feature: trust360-v0-1-pipeline, Property 20: Success Status Code', () => {
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
    
    // Mock LLM wrapper to return successful responses with slight delay
    callLLM.mockImplementation(async () => {
      // Add small delay to ensure positive execution time
      await new Promise(resolve => setTimeout(resolve, 1));
      return JSON.stringify({
        score: 7,
        reasoning: 'Test reasoning for property test',
        confidence: 0.8,
        assumptions: ['Test assumption']
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 status when all models succeed', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that when all models return valid
     * responses, the system returns HTTP 200 status.
     * 
     * Strategy:
     * - Mock all LLM calls to succeed
     * - Generate random valid requests
     * - Verify 200 status code is returned
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
          
          // Verify 200 status code
          expect(response.statusCode).toBe(200);
          
          // Verify response structure
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('traceId');
          expect(body).toHaveProperty('consensus');
          expect(body).toHaveProperty('models');
          expect(body).toHaveProperty('metrics');
          
          // Verify metrics show no failures
          expect(body.metrics.failedModels).toBe(0);
          expect(body.metrics.successfulModels).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 200 with complete response structure', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that 200 responses include
     * all required fields in the response structure.
     * 
     * Strategy:
     * - Generate random valid requests
     * - Verify response has all required fields
     * - Verify field types are correct
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
          
          expect(response.statusCode).toBe(200);
          
          const body = JSON.parse(response.body);
          
          // Verify traceId
          expect(body).toHaveProperty('traceId');
          expect(typeof body.traceId).toBe('string');
          
          // Verify consensus
          expect(body).toHaveProperty('consensus');
          expect(body.consensus).toHaveProperty('mos');
          expect(body.consensus).toHaveProperty('variance');
          expect(body.consensus).toHaveProperty('agreement');
          
          // Verify models array
          expect(body).toHaveProperty('models');
          expect(Array.isArray(body.models)).toBe(true);
          expect(body.models.length).toBeGreaterThan(0);
          
          // Verify metrics
          expect(body).toHaveProperty('metrics');
          expect(body.metrics).toHaveProperty('totalModels');
          expect(body.metrics).toHaveProperty('successfulModels');
          expect(body.metrics).toHaveProperty('failedModels');
          expect(body.metrics).toHaveProperty('executionTimeMs');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 200 consistently for successful requests', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that 200 status is returned
     * consistently across multiple successful requests.
     * 
     * Strategy:
     * - Execute multiple requests sequentially
     * - Verify all return 200 status
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
            
            expect(response.statusCode).toBe(200);
            
            const body = JSON.parse(response.body);
            expect(body.metrics.failedModels).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 200 with valid consensus metrics', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that 200 responses include
     * valid consensus metrics (MOS, variance, agreement).
     * 
     * Strategy:
     * - Generate random requests
     * - Verify consensus metrics are within valid ranges
     * - Verify agreement classification is valid
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
          
          expect(response.statusCode).toBe(200);
          
          const body = JSON.parse(response.body);
          const { consensus } = body;
          
          // Verify MOS is in valid range [1, 10]
          expect(consensus.mos).toBeGreaterThanOrEqual(1);
          expect(consensus.mos).toBeLessThanOrEqual(10);
          
          // Verify variance is non-negative
          expect(consensus.variance).toBeGreaterThanOrEqual(0);
          
          // Verify agreement is valid classification
          expect(['high', 'medium', 'low']).toContain(consensus.agreement);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 200 with all model responses included', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that when all models succeed,
     * all model responses are included in the response.
     * 
     * Strategy:
     * - Generate random requests
     * - Verify models array contains all successful responses
     * - Verify each model response has required fields
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
          
          expect(response.statusCode).toBe(200);
          
          const body = JSON.parse(response.body);
          
          // Verify all models are in the response
          expect(body.models.length).toBe(body.metrics.successfulModels);
          expect(body.models.length).toBe(body.metrics.totalModels);
          
          // Verify each model response has required fields
          body.models.forEach(model => {
            expect(model).toHaveProperty('model');
            expect(model).toHaveProperty('score');
            expect(model).toHaveProperty('confidence');
            expect(model).toHaveProperty('reasoning');
            expect(model).toHaveProperty('assumptions');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 200 with valid execution metrics', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that 200 responses include
     * valid execution metrics.
     * 
     * Strategy:
     * - Generate random requests
     * - Verify metrics are valid and consistent
     * - Verify execution time is positive
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
          
          expect(response.statusCode).toBe(200);
          
          const body = JSON.parse(response.body);
          const { metrics } = body;
          
          // Verify metrics consistency
          expect(metrics.totalModels).toBe(metrics.successfulModels + metrics.failedModels);
          expect(metrics.failedModels).toBe(0);
          expect(metrics.successfulModels).toBeGreaterThan(0);
          
          // Verify execution time is non-negative
          expect(metrics.executionTimeMs).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 200 for requests with evidence', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that 200 status is returned
     * for successful requests with evidence field.
     * 
     * Strategy:
     * - Generate requests with question and evidence
     * - Verify 200 status is returned
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
          
          expect(response.statusCode).toBe(200);
          
          const body = JSON.parse(response.body);
          expect(body.metrics.failedModels).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 200 for requests with metadata', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that 200 status is returned
     * for successful requests with metadata field.
     * 
     * Strategy:
     * - Generate requests with question and metadata
     * - Verify 200 status is returned
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(fc.string(), fc.jsonValue()),
        async (question, metadata) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, metadata }
          });
          
          expect(response.statusCode).toBe(200);
          
          const body = JSON.parse(response.body);
          expect(body.metrics.failedModels).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 200 with unique trace IDs for each request', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that each successful request
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
            
            expect(response.statusCode).toBe(200);
            
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

  it('should return 200 with valid JSON response', async () => {
    /**
     * **Validates: Requirements 8.1**
     * 
     * This property test verifies that 200 responses are valid JSON
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
          
          expect(response.statusCode).toBe(200);
          
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
});
