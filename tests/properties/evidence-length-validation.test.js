/**
 * Property-based test for evidence length validation
 * 
 * Feature: trust360-v0-1-pipeline, Property 2
 * 
 * Property 2: Evidence Length Validation
 * **Validates: Requirements 1.3**
 * 
 * For any request with an evidence field, if the evidence length exceeds 5000
 * characters, the system should return HTTP status 400 with error details.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { createServer } from '../../src/server.js';

describe('Feature: trust360-v0-1-pipeline, Property 2: Evidence Length Validation', () => {
  let server;

  beforeAll(async () => {
    server = createServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should reject evidence exceeding 5000 characters with 400 status', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that any evidence exceeding 5000
     * characters is rejected with HTTP 400 status.
     * 
     * Strategy:
     * - Generate random strings longer than 5000 characters
     * - Include valid question (required field)
     * - Send POST requests to /trust endpoint
     * - Verify 400 status code is returned
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 5001, maxLength: 10000 }),
        async (question, evidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence }
          });
          
          // Verify 400 status code
          expect(response.statusCode).toBe(400);
          
          // Verify response body contains error information
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('statusCode', 400);
          expect(body).toHaveProperty('error');
          expect(body).toHaveProperty('message');
          
          // Verify error message mentions validation
          expect(body.message).toMatch(/evidence|length|5000|validation/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept evidence at exactly 5000 characters', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that evidence at exactly 5000
     * characters is accepted (boundary test).
     * 
     * Strategy:
     * - Generate evidence of exactly 5000 characters
     * - Include valid question
     * - Verify request is NOT rejected with 400
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.stringOf(fc.char(), { minLength: 5000, maxLength: 5000 }),
        async (question, evidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence }
          });
          
          // Should NOT be 400 (validation error)
          expect(response.statusCode).not.toBe(400);
          
          // May be 200, 206, or 500 depending on pipeline execution
          expect([200, 206, 500]).toContain(response.statusCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept evidence under 5000 characters', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that evidence under 5000
     * characters is accepted.
     * 
     * Strategy:
     * - Generate random evidence from 0 to 5000 characters
     * - Include valid question
     * - Verify request is NOT rejected with 400
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 5000 }),
        async (question, evidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence }
          });
          
          // Should NOT be 400 (validation error)
          expect(response.statusCode).not.toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept requests without evidence field', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that evidence is optional and
     * requests without evidence are accepted.
     * 
     * Strategy:
     * - Generate requests with only question field
     * - Verify requests are accepted
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
          
          // Should NOT be 400 (validation error)
          expect(response.statusCode).not.toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept empty evidence string', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that empty evidence strings
     * are accepted (0 characters is within limit).
     * 
     * Strategy:
     * - Send requests with empty evidence string
     * - Verify requests are accepted
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence: '' }
          });
          
          // Should NOT be 400 (validation error)
          expect(response.statusCode).not.toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject very long evidence consistently', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that very long evidence
     * (significantly over limit) is consistently rejected.
     * 
     * Strategy:
     * - Generate very long evidence (10000-20000 characters)
     * - Verify all are rejected with 400
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 10000, maxLength: 20000 }),
        async (question, evidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence }
          });
          
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          expect(body.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle evidence length validation with special characters', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that evidence length validation
     * counts characters correctly regardless of character type.
     * 
     * Strategy:
     * - Generate evidence with various character types
     * - Verify length validation is based on character count
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.stringOf(fc.unicode(), { minLength: 5001, maxLength: 5500 }),
        async (question, evidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence }
          });
          
          // Should be rejected if over 5000 characters
          if (evidence.length > 5000) {
            expect(response.statusCode).toBe(400);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary cases near 5000 characters', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies correct behavior at the boundary
     * of 5000 characters (4999, 5000, 5001).
     * 
     * Strategy:
     * - Test specific boundary values
     * - Verify 4999 and 5000 are accepted
     * - Verify 5001 is rejected
     */
    
    const question = 'Test question';
    
    // Test 4999 characters - should be accepted
    const evidence4999 = 'a'.repeat(4999);
    const response4999 = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question, evidence: evidence4999 }
    });
    expect(response4999.statusCode).not.toBe(400);
    
    // Test 5000 characters - should be accepted
    const evidence5000 = 'a'.repeat(5000);
    const response5000 = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question, evidence: evidence5000 }
    });
    expect(response5000.statusCode).not.toBe(400);
    
    // Test 5001 characters - should be rejected
    const evidence5001 = 'a'.repeat(5001);
    const response5001 = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question, evidence: evidence5001 }
    });
    expect(response5001.statusCode).toBe(400);
  });

  it('should validate evidence length independently of question length', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that evidence length validation
     * is independent of question length.
     * 
     * Strategy:
     * - Generate requests with valid question but invalid evidence
     * - Verify evidence validation rejects request
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
        fc.string({ minLength: 5001, maxLength: 6000 }),
        async (question, evidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence }
          });
          
          // Should be rejected due to evidence length
          expect(response.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide clear error message for evidence length validation', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that the error response for
     * evidence length validation includes clear error messages.
     * 
     * Strategy:
     * - Send requests with invalid evidence length
     * - Verify error message is descriptive
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 5001, maxLength: 5100 }),
        async (question, evidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence }
          });
          
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('message');
          expect(typeof body.message).toBe('string');
          expect(body.message.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate both question and evidence length together', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that when both question and
     * evidence exceed their limits, the request is rejected.
     * 
     * Strategy:
     * - Generate requests with both fields exceeding limits
     * - Verify request is rejected with 400
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2001, maxLength: 2500 }),
        fc.string({ minLength: 5001, maxLength: 5500 }),
        async (question, evidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence }
          });
          
          // Should be rejected (either field causes rejection)
          expect(response.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle evidence with metadata field present', async () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * This property test verifies that evidence validation works
     * correctly when metadata field is also present.
     * 
     * Strategy:
     * - Generate requests with question, evidence, and metadata
     * - Verify evidence validation is independent of metadata
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 5001, maxLength: 5500 }),
        fc.dictionary(fc.string(), fc.jsonValue()),
        async (question, evidence, metadata) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence, metadata }
          });
          
          // Should be rejected due to evidence length
          expect(response.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });
});
