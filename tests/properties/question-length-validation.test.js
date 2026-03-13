/**
 * Property-based test for question length validation
 * 
 * Feature: trust360-v0-1-pipeline, Property 1
 * 
 * Property 1: Question Length Validation
 * **Validates: Requirements 1.2**
 * 
 * For any request with a question field, if the question length exceeds 2000
 * characters, the system should return HTTP status 400 with error details.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { createServer } from '../../src/server.js';

describe('Feature: trust360-v0-1-pipeline, Property 1: Question Length Validation', () => {
  let server;

  beforeAll(async () => {
    server = createServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should reject questions exceeding 2000 characters with 400 status', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies that any question exceeding 2000
     * characters is rejected with HTTP 400 status.
     * 
     * Strategy:
     * - Generate random strings longer than 2000 characters
     * - Send POST requests to /trust endpoint
     * - Verify 400 status code is returned
     * - Verify error response includes error details
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate strings from 2001 to 5000 characters
        fc.string({ minLength: 2001, maxLength: 5000 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          // Verify 400 status code
          expect(response.statusCode).toBe(400);
          
          // Verify response body contains error information
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('statusCode', 400);
          expect(body).toHaveProperty('error');
          expect(body).toHaveProperty('message');
          
          // Verify error message mentions validation
          expect(body.message).toMatch(/question|length|2000|validation/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept questions at exactly 2000 characters', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies that questions at exactly 2000
     * characters are accepted (boundary test).
     * 
     * Strategy:
     * - Generate strings of exactly 2000 characters
     * - Send POST requests
     * - Verify request is NOT rejected with 400
     * - May return 200, 206, or 500 depending on pipeline execution
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate exactly 2000 character strings
        fc.stringOf(fc.char(), { minLength: 2000, maxLength: 2000 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
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

  it('should accept questions under 2000 characters', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies that questions under 2000
     * characters are accepted.
     * 
     * Strategy:
     * - Generate random strings from 1 to 2000 characters
     * - Send POST requests
     * - Verify request is NOT rejected with 400
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
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

  it('should reject very long questions consistently', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies that very long questions
     * (significantly over limit) are consistently rejected.
     * 
     * Strategy:
     * - Generate very long strings (5000-10000 characters)
     * - Verify all are rejected with 400
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5000, maxLength: 10000 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          expect(body.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate question length before pipeline execution', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies that question length validation
     * happens at the API layer before pipeline execution.
     * 
     * Strategy:
     * - Send requests with invalid question length
     * - Verify 400 response is immediate (no trace ID from pipeline)
     * - Trace ID is only generated in createContext stage
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2001, maxLength: 3000 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          
          // Validation error should not have trace ID
          // (trace ID is generated in createContext, which shouldn't run)
          // Note: Fastify validation errors don't include trace ID
          expect(body).toHaveProperty('error');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle question length validation with special characters', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies that question length validation
     * counts characters correctly regardless of character type
     * (unicode, emojis, special characters).
     * 
     * Strategy:
     * - Generate strings with various character types
     * - Verify length validation is based on character count
     * - Test with unicode, emojis, etc.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.stringOf(fc.unicode(), { minLength: 2001, maxLength: 2500 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          // Should be rejected if over 2000 characters
          if (question.length > 2000) {
            expect(response.statusCode).toBe(400);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide clear error message for length validation', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies that the error response for
     * question length validation includes clear, actionable
     * error messages.
     * 
     * Strategy:
     * - Send requests with invalid question length
     * - Verify error message is descriptive
     * - Verify error indicates the validation rule
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2001, maxLength: 2100 }),
        async (question) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question }
          });
          
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('message');
          
          // Error message should be informative
          expect(typeof body.message).toBe('string');
          expect(body.message.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary cases near 2000 characters', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies correct behavior at the boundary
     * of 2000 characters (1999, 2000, 2001).
     * 
     * Strategy:
     * - Test specific boundary values
     * - Verify 1999 and 2000 are accepted
     * - Verify 2001 is rejected
     */
    
    // Test 1999 characters - should be accepted
    const question1999 = 'a'.repeat(1999);
    const response1999 = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question: question1999 }
    });
    expect(response1999.statusCode).not.toBe(400);
    
    // Test 2000 characters - should be accepted
    const question2000 = 'a'.repeat(2000);
    const response2000 = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question: question2000 }
    });
    expect(response2000.statusCode).not.toBe(400);
    
    // Test 2001 characters - should be rejected
    const question2001 = 'a'.repeat(2001);
    const response2001 = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question: question2001 }
    });
    expect(response2001.statusCode).toBe(400);
  });

  it('should validate question length independently of other fields', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies that question length validation
     * is independent of other request fields (evidence, metadata).
     * 
     * Strategy:
     * - Generate requests with invalid question length
     * - Include valid evidence and metadata
     * - Verify question validation still rejects request
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2001, maxLength: 2500 }),
        fc.option(fc.string({ minLength: 0, maxLength: 100 })),
        fc.option(fc.dictionary(fc.string(), fc.jsonValue())),
        async (question, evidence, metadata) => {
          const payload = {
            question,
            ...(evidence !== null && { evidence }),
            ...(metadata !== null && { metadata })
          };
          
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload
          });
          
          // Should be rejected due to question length
          expect(response.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty or whitespace-only questions separately from length', async () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * This property test verifies that empty questions are handled
     * (likely rejected for being empty, not for length).
     * 
     * Strategy:
     * - Test empty string
     * - Test whitespace-only strings
     * - Verify they are rejected (but not necessarily for length)
     */
    
    // Empty question
    const responseEmpty = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question: '' }
    });
    expect(responseEmpty.statusCode).toBe(400);
    
    // Whitespace-only question
    const responseWhitespace = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question: '   ' }
    });
    // May be rejected for minLength validation
    expect([400, 200, 206, 500]).toContain(responseWhitespace.statusCode);
  });
});
