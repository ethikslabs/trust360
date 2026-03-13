/**
 * Property-based test for model response validation
 * 
 * Feature: trust360-v0-1-pipeline, Property 14
 * 
 * Property 14: Model Response Validation
 * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
 * 
 * For any raw model response, it should only be included in validResponses if it
 * contains: a score (number, 1-10 inclusive), reasoning (non-empty string),
 * confidence (number, 0-1 inclusive), and assumptions (array).
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isValidModelResponse } from '../../src/utils/validation.js';

describe('Feature: trust360-v0-1-pipeline, Property 14: Model Response Validation', () => {
  it('should accept valid model responses with all required fields', () => {
    /**
     * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
     * 
     * This property test verifies that responses with all valid fields
     * (score 1-10, non-empty reasoning, confidence 0-1, assumptions array)
     * are accepted as valid.
     * 
     * Strategy:
     * - Generate valid model responses with random valid values
     * - Validate each response
     * - Verify all are accepted
     * - Test across 100 iterations
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 1000 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string(), { maxLength: 10 }),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses with score below 1', () => {
    /**
     * **Validates: Requirements 6.2**
     * 
     * This property test verifies that responses with scores below 1
     * are rejected as invalid.
     * 
     * Strategy:
     * - Generate responses with scores < 1
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.float({ max: Math.fround(0.99), noNaN: true })
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses with score above 10', () => {
    /**
     * **Validates: Requirements 6.2**
     * 
     * This property test verifies that responses with scores above 10
     * are rejected as invalid.
     * 
     * Strategy:
     * - Generate responses with scores > 10
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 11, max: 100 }),
          fc.float({ min: Math.fround(10.01), max: 100, noNaN: true })
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses with non-numeric score', () => {
    /**
     * **Validates: Requirements 6.2**
     * 
     * This property test verifies that responses with non-numeric
     * score values are rejected.
     * 
     * Strategy:
     * - Generate responses with string, null, undefined, or object scores
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.constant(null),
          fc.constant(undefined),
          fc.object()
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses with empty reasoning string', () => {
    /**
     * **Validates: Requirements 6.3**
     * 
     * This property test verifies that responses with empty reasoning
     * strings are rejected as invalid.
     * 
     * Strategy:
     * - Generate responses with empty reasoning
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string()),
        (score, confidence, assumptions) => {
          const response = {
            score,
            reasoning: '',
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses with non-string reasoning', () => {
    /**
     * **Validates: Requirements 6.3**
     * 
     * This property test verifies that responses with non-string
     * reasoning values are rejected.
     * 
     * Strategy:
     * - Generate responses with number, null, undefined, or object reasoning
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.oneof(
          fc.integer(),
          fc.constant(null),
          fc.constant(undefined),
          fc.object()
        ),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses with confidence below 0', () => {
    /**
     * **Validates: Requirements 6.4**
     * 
     * This property test verifies that responses with confidence
     * values below 0 are rejected as invalid.
     * 
     * Strategy:
     * - Generate responses with confidence < 0
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ max: Math.fround(-0.01), noNaN: true }),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses with confidence above 1', () => {
    /**
     * **Validates: Requirements 6.4**
     * 
     * This property test verifies that responses with confidence
     * values above 1 are rejected as invalid.
     * 
     * Strategy:
     * - Generate responses with confidence > 1
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: Math.fround(1.01), max: 10, noNaN: true }),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses with non-numeric confidence', () => {
    /**
     * **Validates: Requirements 6.4**
     * 
     * This property test verifies that responses with non-numeric
     * confidence values are rejected.
     * 
     * Strategy:
     * - Generate responses with string, null, undefined, or object confidence
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.oneof(
          fc.string(),
          fc.constant(null),
          fc.constant(undefined),
          fc.object()
        ),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses with non-array assumptions', () => {
    /**
     * **Validates: Requirements 6.5**
     * 
     * This property test verifies that responses with non-array
     * assumptions values are rejected.
     * 
     * Strategy:
     * - Generate responses with string, number, null, undefined, or object assumptions
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.constant(null),
          fc.constant(undefined),
          fc.object()
        ),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept responses with empty assumptions array', () => {
    /**
     * **Validates: Requirements 6.5**
     * 
     * This property test verifies that responses with empty assumptions
     * arrays are accepted (array is required, but can be empty).
     * 
     * Strategy:
     * - Generate valid responses with empty assumptions array
     * - Validate each response
     * - Verify all are accepted
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (score, reasoning, confidence) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions: []
          };
          
          expect(isValidModelResponse(response)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject responses missing required fields', () => {
    /**
     * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
     * 
     * This property test verifies that responses missing any required
     * field are rejected as invalid.
     * 
     * Strategy:
     * - Generate responses missing one or more required fields
     * - Validate each response
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          // Test missing score
          expect(isValidModelResponse({
            reasoning,
            confidence,
            assumptions
          })).toBe(false);
          
          // Test missing reasoning
          expect(isValidModelResponse({
            score,
            confidence,
            assumptions
          })).toBe(false);
          
          // Test missing confidence
          expect(isValidModelResponse({
            score,
            reasoning,
            assumptions
          })).toBe(false);
          
          // Test missing assumptions
          expect(isValidModelResponse({
            score,
            reasoning,
            confidence
          })).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject null or undefined input', () => {
    /**
     * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
     * 
     * This property test verifies that null or undefined inputs
     * are rejected as invalid.
     * 
     * Strategy:
     * - Test with null and undefined
     * - Verify both are rejected
     */
    
    expect(isValidModelResponse(null)).toBe(false);
    expect(isValidModelResponse(undefined)).toBe(false);
  });

  it('should reject non-object input', () => {
    /**
     * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
     * 
     * This property test verifies that non-object inputs
     * (strings, numbers, arrays) are rejected as invalid.
     * 
     * Strategy:
     * - Generate various non-object values
     * - Validate each
     * - Verify all are rejected
     */
    
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.float(),
          fc.array(fc.anything())
        ),
        (input) => {
          expect(isValidModelResponse(input)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept boundary values for score (1 and 10)', () => {
    /**
     * **Validates: Requirements 6.2**
     * 
     * This property test verifies that the boundary values 1 and 10
     * are accepted as valid scores (inclusive range).
     * 
     * Strategy:
     * - Generate responses with score = 1 and score = 10
     * - Validate each response
     * - Verify both are accepted
     */
    
    fc.assert(
      fc.property(
        fc.constantFrom(1, 10),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept boundary values for confidence (0 and 1)', () => {
    /**
     * **Validates: Requirements 6.4**
     * 
     * This property test verifies that the boundary values 0 and 1
     * are accepted as valid confidence values (inclusive range).
     * 
     * Strategy:
     * - Generate responses with confidence = 0 and confidence = 1
     * - Validate each response
     * - Verify both are accepted
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(0, 1),
        fc.array(fc.string()),
        (score, reasoning, confidence, assumptions) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions
          };
          
          expect(isValidModelResponse(response)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept responses with additional fields beyond required', () => {
    /**
     * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
     * 
     * This property test verifies that responses with extra fields
     * beyond the required ones are still accepted (validation only
     * checks required fields exist and are valid).
     * 
     * Strategy:
     * - Generate valid responses with additional random fields
     * - Validate each response
     * - Verify all are accepted
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string()),
        fc.object(),
        (score, reasoning, confidence, assumptions, extraFields) => {
          const response = {
            score,
            reasoning,
            confidence,
            assumptions,
            ...extraFields
          };
          
          expect(isValidModelResponse(response)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all fields independently', () => {
    /**
     * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
     * 
     * This property test verifies that validation checks all fields
     * independently - a response is only valid if ALL fields are valid.
     * 
     * Strategy:
     * - Generate responses with one valid and one invalid field
     * - Validate each response
     * - Verify all are rejected (all fields must be valid)
     */
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.array(fc.string()),
        (validScore, validReasoning, validConfidence, validAssumptions) => {
          // Valid score, invalid reasoning
          expect(isValidModelResponse({
            score: validScore,
            reasoning: '',
            confidence: validConfidence,
            assumptions: validAssumptions
          })).toBe(false);
          
          // Valid reasoning, invalid score
          expect(isValidModelResponse({
            score: 11,
            reasoning: validReasoning,
            confidence: validConfidence,
            assumptions: validAssumptions
          })).toBe(false);
          
          // Valid score and reasoning, invalid confidence
          expect(isValidModelResponse({
            score: validScore,
            reasoning: validReasoning,
            confidence: 2,
            assumptions: validAssumptions
          })).toBe(false);
          
          // Valid score, reasoning, confidence, invalid assumptions
          expect(isValidModelResponse({
            score: validScore,
            reasoning: validReasoning,
            confidence: validConfidence,
            assumptions: 'not an array'
          })).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
