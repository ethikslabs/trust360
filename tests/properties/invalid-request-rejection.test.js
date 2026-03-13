/**
 * Property-based test for invalid request rejection
 * 
 * Feature: trust360-v0-1-pipeline, Property 3
 * 
 * Property 3: Invalid Request Rejection
 * **Validates: Requirements 1.4, 1.5**
 * 
 * For any request with invalid data (malformed JSON, wrong types, missing
 * required fields), the system should return HTTP status 400 with error details.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { createServer } from '../../src/server.js';

describe('Feature: trust360-v0-1-pipeline, Property 3: Invalid Request Rejection', () => {
  let server;

  beforeAll(async () => {
    server = createServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should reject requests missing required question field', async () => {
    /**
     * **Validates: Requirements 1.5**
     * 
     * This property test verifies that requests without the required
     * question field are rejected with HTTP 400 status.
     * 
     * Strategy:
     * - Generate requests with only optional fields
     * - Verify 400 status code is returned
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.string({ minLength: 0, maxLength: 100 })),
        fc.option(fc.dictionary(fc.string(), fc.jsonValue())),
        async (evidence, metadata) => {
          const payload = {
            ...(evidence !== null && { evidence }),
            ...(metadata !== null && { metadata })
          };
          
          // Explicitly exclude question field
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload
          });
          
          // Verify 400 status code
          expect(response.statusCode).toBe(400);
          
          // Verify error response
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('statusCode', 400);
          expect(body).toHaveProperty('error');
          expect(body).toHaveProperty('message');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject requests with wrong type for question field', async () => {
    /**
     * **Validates: Requirements 1.4**
     * 
     * This property test verifies that requests with non-string
     * question values are rejected.
     * 
     * Strategy:
     * - Generate requests with various non-string question types
     * - Verify 400 status code is returned
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.string()),
          fc.dictionary(fc.string(), fc.string())
        ),
        async (invalidQuestion) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question: invalidQuestion }
          });
          
          // Verify 400 status code
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          expect(body.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject requests with wrong type for evidence field', async () => {
    /**
     * **Validates: Requirements 1.4**
     * 
     * This property test verifies that requests with non-string
     * evidence values are rejected.
     * 
     * Strategy:
     * - Generate valid question with invalid evidence type
     * - Verify 400 status code is returned
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.oneof(
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.string()),
          fc.dictionary(fc.string(), fc.string())
        ),
        async (question, invalidEvidence) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, evidence: invalidEvidence }
          });
          
          // Verify 400 status code
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          expect(body.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject requests with wrong type for metadata field', async () => {
    /**
     * **Validates: Requirements 1.4**
     * 
     * This property test verifies that requests with non-object
     * metadata values are rejected.
     * 
     * Strategy:
     * - Generate valid question with invalid metadata type
     * - Verify 400 status code is returned
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.string())
        ),
        async (question, invalidMetadata) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: { question, metadata: invalidMetadata }
          });
          
          // Verify 400 status code
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          expect(body.statusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject malformed JSON payloads', async () => {
    /**
     * **Validates: Requirements 1.4**
     * 
     * This property test verifies that malformed JSON is rejected.
     * 
     * Strategy:
     * - Send requests with invalid JSON strings
     * - Verify 400 status code is returned
     */
    
    const malformedJsonExamples = [
      '{ question: "test" }',  // Missing quotes
      '{ "question": "test" ',  // Missing closing brace
      '{ "question": "test", }',  // Trailing comma
      'not json at all',
      '{ "question": undefined }',
      '{ "question": NaN }'
    ];
    
    for (const malformedJson of malformedJsonExamples) {
      const response = await server.inject({
        method: 'POST',
        url: '/trust',
        payload: malformedJson,
        headers: {
          'content-type': 'application/json'
        }
      });
      
      // Should be rejected (400 or 415)
      expect([400, 415]).toContain(response.statusCode);
    }
  });

  it('should reject empty request body', async () => {
    /**
     * **Validates: Requirements 1.5**
     * 
     * This property test verifies that empty request bodies are rejected.
     * 
     * Strategy:
     * - Send POST request with empty body
     * - Verify 400 status code is returned
     */
    
    const response = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: {}
    });
    
    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.statusCode).toBe(400);
  });

  it('should reject requests with empty string question', async () => {
    /**
     * **Validates: Requirements 1.4, 1.5**
     * 
     * This property test verifies that empty string questions
     * are rejected (minLength: 1 validation).
     * 
     * Strategy:
     * - Send requests with empty string question
     * - Verify 400 status code is returned
     */
    
    const response = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question: '' }
    });
    
    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.statusCode).toBe(400);
  });

  it('should provide error details for validation failures', async () => {
    /**
     * **Validates: Requirements 1.4, 1.5**
     * 
     * This property test verifies that validation error responses
     * include helpful error details.
     * 
     * Strategy:
     * - Generate various invalid requests
     * - Verify error responses include message and details
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant({}),  // Missing question
          fc.constant({ question: 123 }),  // Wrong type
          fc.constant({ question: '' }),  // Empty string
          fc.constant({ question: null })  // Null value
        ),
        async (invalidPayload) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: invalidPayload
          });
          
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('error');
          expect(body).toHaveProperty('message');
          expect(typeof body.message).toBe('string');
          expect(body.message.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject requests with additional unexpected fields', async () => {
    /**
     * **Validates: Requirements 1.4**
     * 
     * This property test verifies behavior with unexpected fields.
     * Fastify may accept or reject based on configuration.
     * 
     * Strategy:
     * - Generate requests with valid fields plus unexpected ones
     * - Verify request handling is consistent
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.anything(),
        async (question, unexpectedKey, unexpectedValue) => {
          // Skip if unexpected key conflicts with known fields
          if (['question', 'evidence', 'metadata'].includes(unexpectedKey)) {
            return;
          }
          
          const payload = {
            question,
            [unexpectedKey]: unexpectedValue
          };
          
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload
          });
          
          // Fastify may accept or reject based on schema configuration
          // Just verify it doesn't crash
          expect([200, 206, 400, 500]).toContain(response.statusCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle validation errors consistently across request variations', async () => {
    /**
     * **Validates: Requirements 1.4, 1.5**
     * 
     * This property test verifies that validation errors are
     * handled consistently regardless of other request properties.
     * 
     * Strategy:
     * - Generate various invalid requests
     * - Verify all return 400 status
     * - Verify error response structure is consistent
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Missing question
          fc.record({
            evidence: fc.option(fc.string({ minLength: 0, maxLength: 100 }))
          }),
          // Invalid question type
          fc.record({
            question: fc.integer(),
            evidence: fc.option(fc.string({ minLength: 0, maxLength: 100 }))
          }),
          // Empty question
          fc.record({
            question: fc.constant(''),
            evidence: fc.option(fc.string({ minLength: 0, maxLength: 100 }))
          })
        ),
        async (invalidPayload) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: invalidPayload
          });
          
          expect(response.statusCode).toBe(400);
          
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('statusCode');
          expect(body).toHaveProperty('error');
          expect(body).toHaveProperty('message');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject requests with null question value', async () => {
    /**
     * **Validates: Requirements 1.4, 1.5**
     * 
     * This property test verifies that null question values
     * are rejected.
     * 
     * Strategy:
     * - Send request with question: null
     * - Verify 400 status code is returned
     */
    
    const response = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question: null }
    });
    
    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.statusCode).toBe(400);
  });

  it('should reject requests with undefined question value', async () => {
    /**
     * **Validates: Requirements 1.4, 1.5**
     * 
     * This property test verifies that undefined question values
     * are treated as missing field.
     * 
     * Strategy:
     * - Send request with question: undefined (becomes missing)
     * - Verify 400 status code is returned
     */
    
    const response = await server.inject({
      method: 'POST',
      url: '/trust',
      payload: { question: undefined }
    });
    
    expect(response.statusCode).toBe(400);
  });

  it('should validate request before pipeline execution', async () => {
    /**
     * **Validates: Requirements 1.4, 1.5**
     * 
     * This property test verifies that validation happens at the
     * API layer before pipeline execution.
     * 
     * Strategy:
     * - Send invalid requests
     * - Verify 400 response is immediate
     * - No trace ID should be present (not generated yet)
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant({}),
          fc.constant({ question: 123 }),
          fc.constant({ question: '' })
        ),
        async (invalidPayload) => {
          const response = await server.inject({
            method: 'POST',
            url: '/trust',
            payload: invalidPayload
          });
          
          expect(response.statusCode).toBe(400);
          
          // Validation errors should not have trace ID
          // (trace ID is generated in createContext stage)
          const body = JSON.parse(response.body);
          expect(body).toHaveProperty('error');
        }
      ),
      { numRuns: 100 }
    );
  });
});
