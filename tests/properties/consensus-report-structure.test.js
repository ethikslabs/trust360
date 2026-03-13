/**
 * Property-based test for consensus report structure
 * 
 * Feature: trust360-v0-1-pipeline, Property 19
 * 
 * Property 19: Consensus Report Structure
 * **Validates: Requirements 7.4, 8.4**
 * 
 * For any successful consensus computation, the consensus object should contain
 * mos (number), variance (number), and agreement (string) fields.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeConsensus } from '../../src/stages/compute-consensus.js';

describe('Feature: trust360-v0-1-pipeline, Property 19: Consensus Report Structure', () => {
  it('should contain required fields: mos, variance, and agreement', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the consensus object contains all
     * required fields with correct types for any valid set of model responses.
     * 
     * Strategy:
     * - Generate random arrays of valid model responses
     * - Execute computeConsensus stage
     * - Verify consensus object has mos, variance, and agreement fields
     * - Verify field types are correct
     * - Test across 100 iterations with varying response counts
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate arrays of valid model responses (1-10 models)
        fc.array(
          fc.record({
            model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo', 'gemini-pro'),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.double({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (validResponses) => {
          // Create context object with valid responses
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          // Execute computeConsensus stage
          const result = await computeConsensus(ctx);
          
          // Verify consensus object exists
          expect(result.consensus).toBeDefined();
          expect(result.consensus).not.toBeNull();
          expect(typeof result.consensus).toBe('object');
          
          // Verify required field: mos
          expect(result.consensus).toHaveProperty('mos');
          expect(typeof result.consensus.mos).toBe('number');
          expect(Number.isFinite(result.consensus.mos)).toBe(true);
          
          // Verify required field: variance
          expect(result.consensus).toHaveProperty('variance');
          expect(typeof result.consensus.variance).toBe('number');
          expect(Number.isFinite(result.consensus.variance)).toBe(true);
          
          // Verify required field: agreement
          expect(result.consensus).toHaveProperty('agreement');
          expect(typeof result.consensus.agreement).toBe('string');
          expect(['high', 'medium', 'low']).toContain(result.consensus.agreement);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain exactly three fields: mos, variance, and agreement', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the consensus object contains
     * exactly the three required fields and no additional fields.
     * 
     * Strategy:
     * - Generate random valid model responses
     * - Execute computeConsensus stage
     * - Verify consensus object has exactly 3 keys
     * - Verify the keys are mos, variance, and agreement
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.double({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (validResponses) => {
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          const result = await computeConsensus(ctx);
          
          // Verify exactly 3 fields
          const keys = Object.keys(result.consensus);
          expect(keys).toHaveLength(3);
          
          // Verify the exact field names
          expect(keys).toContain('mos');
          expect(keys).toContain('variance');
          expect(keys).toContain('agreement');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have mos field within valid range [1, 10]', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the mos field in the consensus
     * object is always within the valid score range.
     * 
     * Strategy:
     * - Generate random valid model responses with scores 1-10
     * - Execute computeConsensus stage
     * - Verify mos is between 1 and 10 inclusive
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.double({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (validResponses) => {
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          const result = await computeConsensus(ctx);
          
          // Verify mos is within valid range
          expect(result.consensus.mos).toBeGreaterThanOrEqual(1);
          expect(result.consensus.mos).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have variance field as non-negative number', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the variance field in the consensus
     * object is always a non-negative number (mathematical property).
     * 
     * Strategy:
     * - Generate random valid model responses
     * - Execute computeConsensus stage
     * - Verify variance is >= 0
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.double({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (validResponses) => {
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          const result = await computeConsensus(ctx);
          
          // Verify variance is non-negative
          expect(result.consensus.variance).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have agreement field as one of the valid classifications', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the agreement field in the consensus
     * object is always one of the three valid classification strings.
     * 
     * Strategy:
     * - Generate random valid model responses
     * - Execute computeConsensus stage
     * - Verify agreement is 'high', 'medium', or 'low'
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.double({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (validResponses) => {
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          const result = await computeConsensus(ctx);
          
          // Verify agreement is one of the valid values
          expect(['high', 'medium', 'low']).toContain(result.consensus.agreement);
          
          // Verify it's not empty or undefined
          expect(result.consensus.agreement).toBeTruthy();
          expect(result.consensus.agreement.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain structure consistency across single model response', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the consensus object structure
     * is maintained even with edge case of single model response.
     * 
     * Strategy:
     * - Generate single model responses
     * - Execute computeConsensus stage
     * - Verify all required fields are present with correct types
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          model: fc.string({ minLength: 3, maxLength: 20 }),
          score: fc.integer({ min: 1, max: 10 }),
          reasoning: fc.string({ minLength: 10, maxLength: 100 }),
          confidence: fc.double({ min: 0, max: 1, noNaN: true }),
          assumptions: fc.array(fc.string(), { maxLength: 5 })
        }),
        async (validResponse) => {
          const ctx = {
            traceId: 'test-trace-id',
            validResponses: [validResponse]
          };
          
          const result = await computeConsensus(ctx);
          
          // Verify structure is maintained
          expect(result.consensus).toBeDefined();
          expect(result.consensus).toHaveProperty('mos');
          expect(result.consensus).toHaveProperty('variance');
          expect(result.consensus).toHaveProperty('agreement');
          
          // Verify types
          expect(typeof result.consensus.mos).toBe('number');
          expect(typeof result.consensus.variance).toBe('number');
          expect(typeof result.consensus.agreement).toBe('string');
          
          // For single response, variance should be 0
          expect(result.consensus.variance).toBe(0);
          
          // For single response, mos should equal the score
          expect(result.consensus.mos).toBe(validResponse.score);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain structure consistency across many model responses', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the consensus object structure
     * is maintained with larger numbers of model responses.
     * 
     * Strategy:
     * - Generate larger arrays of model responses (10-20)
     * - Execute computeConsensus stage
     * - Verify all required fields are present with correct types
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.double({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 10, maxLength: 20 }
        ),
        async (validResponses) => {
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          const result = await computeConsensus(ctx);
          
          // Verify structure is maintained
          expect(result.consensus).toBeDefined();
          expect(result.consensus).toHaveProperty('mos');
          expect(result.consensus).toHaveProperty('variance');
          expect(result.consensus).toHaveProperty('agreement');
          
          // Verify types
          expect(typeof result.consensus.mos).toBe('number');
          expect(typeof result.consensus.variance).toBe('number');
          expect(typeof result.consensus.agreement).toBe('string');
          
          // Verify values are valid
          expect(result.consensus.mos).toBeGreaterThanOrEqual(1);
          expect(result.consensus.mos).toBeLessThanOrEqual(10);
          expect(result.consensus.variance).toBeGreaterThanOrEqual(0);
          expect(['high', 'medium', 'low']).toContain(result.consensus.agreement);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not contain any undefined or null fields', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that none of the required fields
     * in the consensus object are undefined or null.
     * 
     * Strategy:
     * - Generate random valid model responses
     * - Execute computeConsensus stage
     * - Verify all fields are defined and not null
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.double({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (validResponses) => {
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          const result = await computeConsensus(ctx);
          
          // Verify no undefined fields
          expect(result.consensus.mos).not.toBeUndefined();
          expect(result.consensus.variance).not.toBeUndefined();
          expect(result.consensus.agreement).not.toBeUndefined();
          
          // Verify no null fields
          expect(result.consensus.mos).not.toBeNull();
          expect(result.consensus.variance).not.toBeNull();
          expect(result.consensus.agreement).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain structure with identical scores', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the consensus object structure
     * is maintained when all model responses have identical scores.
     * 
     * Strategy:
     * - Generate arrays where all scores are identical
     * - Execute computeConsensus stage
     * - Verify structure and field types
     * - Verify variance is 0 and agreement is 'high'
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 2, max: 10 }),
        async (score, count) => {
          // Create array of identical scores
          const validResponses = Array.from({ length: count }, (_, i) => ({
            model: `model-${i}`,
            score,
            reasoning: 'Test reasoning',
            confidence: 0.8,
            assumptions: ['Test assumption']
          }));
          
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          const result = await computeConsensus(ctx);
          
          // Verify structure
          expect(result.consensus).toBeDefined();
          expect(result.consensus).toHaveProperty('mos');
          expect(result.consensus).toHaveProperty('variance');
          expect(result.consensus).toHaveProperty('agreement');
          
          // Verify types
          expect(typeof result.consensus.mos).toBe('number');
          expect(typeof result.consensus.variance).toBe('number');
          expect(typeof result.consensus.agreement).toBe('string');
          
          // For identical scores, variance should be 0
          expect(result.consensus.variance).toBe(0);
          
          // For variance 0, agreement should be 'high'
          expect(result.consensus.agreement).toBe('high');
          
          // MOS should equal the identical score
          expect(result.consensus.mos).toBe(score);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain structure with extreme score variance', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the consensus object structure
     * is maintained when scores have extreme variance (mix of 1s and 10s).
     * 
     * Strategy:
     * - Generate arrays with mix of minimum and maximum scores
     * - Execute computeConsensus stage
     * - Verify structure and field types
     * - Verify all fields are valid despite high variance
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (count1, count10) => {
          // Create array with mix of 1s and 10s
          const validResponses = [
            ...Array.from({ length: count1 }, (_, i) => ({
              model: `model-low-${i}`,
              score: 1,
              reasoning: 'Low trust',
              confidence: 0.8,
              assumptions: ['Test']
            })),
            ...Array.from({ length: count10 }, (_, i) => ({
              model: `model-high-${i}`,
              score: 10,
              reasoning: 'High trust',
              confidence: 0.8,
              assumptions: ['Test']
            }))
          ];
          
          if (validResponses.length === 0) return; // Skip empty arrays
          
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          const result = await computeConsensus(ctx);
          
          // Verify structure is maintained despite extreme variance
          expect(result.consensus).toBeDefined();
          expect(result.consensus).toHaveProperty('mos');
          expect(result.consensus).toHaveProperty('variance');
          expect(result.consensus).toHaveProperty('agreement');
          
          // Verify types
          expect(typeof result.consensus.mos).toBe('number');
          expect(typeof result.consensus.variance).toBe('number');
          expect(typeof result.consensus.agreement).toBe('string');
          
          // Verify values are valid
          expect(result.consensus.mos).toBeGreaterThanOrEqual(1);
          expect(result.consensus.mos).toBeLessThanOrEqual(10);
          expect(result.consensus.variance).toBeGreaterThanOrEqual(0);
          expect(['high', 'medium', 'low']).toContain(result.consensus.agreement);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce serializable consensus object', async () => {
    /**
     * **Validates: Requirements 7.4, 8.4**
     * 
     * This property test verifies that the consensus object can be
     * serialized to JSON (required for API responses).
     * 
     * Strategy:
     * - Generate random valid model responses
     * - Execute computeConsensus stage
     * - Serialize consensus object to JSON
     * - Verify serialization succeeds and structure is preserved
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.double({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (validResponses) => {
          const ctx = {
            traceId: 'test-trace-id',
            validResponses
          };
          
          const result = await computeConsensus(ctx);
          
          // Serialize to JSON
          const jsonString = JSON.stringify(result.consensus);
          expect(jsonString).toBeDefined();
          
          // Deserialize and verify structure is preserved
          const parsed = JSON.parse(jsonString);
          expect(parsed).toHaveProperty('mos');
          expect(parsed).toHaveProperty('variance');
          expect(parsed).toHaveProperty('agreement');
          
          // Verify values match original
          expect(parsed.mos).toBe(result.consensus.mos);
          expect(parsed.variance).toBe(result.consensus.variance);
          expect(parsed.agreement).toBe(result.consensus.agreement);
        }
      ),
      { numRuns: 100 }
    );
  });
});
