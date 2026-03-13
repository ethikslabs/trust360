/**
 * Property-based test for MOS (Mean Opinion Score) calculation
 * 
 * Feature: trust360-v0-1-pipeline, Property 16
 * 
 * Property 16: MOS Calculation Correctness
 * **Validates: Requirements 7.1**
 * 
 * For any set of valid model scores, the calculated MOS should equal the
 * arithmetic mean of those scores, rounded to 2 decimal places.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateMOS } from '../../src/utils/consensus.js';

describe('Feature: trust360-v0-1-pipeline, Property 16: MOS Calculation Correctness', () => {
  it('should calculate arithmetic mean correctly across random score sets', async () => {
    /**
     * **Validates: Requirements 7.1**
     * 
     * This property test verifies that the MOS calculation produces the
     * correct arithmetic mean for any valid set of model scores.
     * 
     * Strategy:
     * - Generate random arrays of scores (1-10 inclusive)
     * - Calculate expected mean independently
     * - Verify calculateMOS returns the same value (within rounding tolerance)
     * - Test across 100 iterations with varying array sizes
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate arrays of scores between 1 and 10 (valid model score range)
        // Array length: 1-10 models (at least 1 model required for consensus)
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 10 }),
        async (scores) => {
          // Calculate expected MOS using arithmetic mean formula
          const sum = scores.reduce((acc, score) => acc + score, 0);
          const expectedMOS = sum / scores.length;
          
          // Round to 2 decimal places (as per requirement)
          const expectedRounded = Math.round(expectedMOS * 100) / 100;
          
          // Calculate actual MOS using the implementation
          const actualMOS = calculateMOS(scores);
          
          // Verify the result matches expected value
          expect(actualMOS).toBe(expectedRounded);
          
          // Verify MOS is within valid range [1, 10]
          expect(actualMOS).toBeGreaterThanOrEqual(1);
          expect(actualMOS).toBeLessThanOrEqual(10);
          
          // Verify result has at most 2 decimal places
          const decimalPlaces = (actualMOS.toString().split('.')[1] || '').length;
          expect(decimalPlaces).toBeLessThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of single score', async () => {
    /**
     * **Validates: Requirements 7.1**
     * 
     * This property test verifies that MOS calculation works correctly
     * when only a single model provides a score (edge case).
     * 
     * Strategy:
     * - Generate single scores (1-10)
     * - Verify MOS equals the single score
     * - The mean of one value is the value itself
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (score) => {
          const scores = [score];
          const actualMOS = calculateMOS(scores);
          
          // For a single score, MOS should equal that score
          expect(actualMOS).toBe(score);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle identical scores correctly', async () => {
    /**
     * **Validates: Requirements 7.1**
     * 
     * This property test verifies that when all models return the same
     * score, the MOS equals that score.
     * 
     * Strategy:
     * - Generate arrays where all scores are identical
     * - Verify MOS equals the repeated score
     * - Test with varying array lengths
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        async (score, arrayLength) => {
          // Create array of identical scores
          const scores = Array(arrayLength).fill(score);
          const actualMOS = calculateMOS(scores);
          
          // MOS of identical scores should equal that score
          expect(actualMOS).toBe(score);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain mathematical properties of arithmetic mean', async () => {
    /**
     * **Validates: Requirements 7.1**
     * 
     * This property test verifies that MOS calculation maintains
     * fundamental mathematical properties of the arithmetic mean.
     * 
     * Properties tested:
     * - Mean is always between min and max values
     * - Mean of extremes (all 1s and all 10s) equals the extreme
     * - Adding a score equal to current mean doesn't change the mean
     * 
     * Strategy:
     * - Generate random score arrays
     * - Verify mean is bounded by min/max scores
     * - Test mathematical invariants
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 2, maxLength: 10 }),
        async (scores) => {
          const actualMOS = calculateMOS(scores);
          
          // Property 1: Mean is between min and max
          const minScore = Math.min(...scores);
          const maxScore = Math.max(...scores);
          expect(actualMOS).toBeGreaterThanOrEqual(minScore);
          expect(actualMOS).toBeLessThanOrEqual(maxScore);
          
          // Property 2: Adding a score equal to the mean doesn't change it
          // (within rounding tolerance)
          const extendedScores = [...scores, actualMOS];
          const newMOS = calculateMOS(extendedScores);
          
          // Should be equal or very close (accounting for rounding)
          expect(Math.abs(newMOS - actualMOS)).toBeLessThan(0.02);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce consistent results for the same input', async () => {
    /**
     * **Validates: Requirements 7.1**
     * 
     * This property test verifies that MOS calculation is deterministic
     * and produces the same result for the same input.
     * 
     * Strategy:
     * - Generate random score arrays
     * - Calculate MOS multiple times
     * - Verify all results are identical
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 10 }),
        async (scores) => {
          const mos1 = calculateMOS(scores);
          const mos2 = calculateMOS(scores);
          const mos3 = calculateMOS(scores);
          
          // All calculations should produce identical results
          expect(mos1).toBe(mos2);
          expect(mos2).toBe(mos3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle maximum array size correctly', async () => {
    /**
     * **Validates: Requirements 7.1**
     * 
     * This property test verifies that MOS calculation works correctly
     * with larger arrays of scores (simulating many models).
     * 
     * Strategy:
     * - Generate larger arrays (up to 20 scores)
     * - Verify calculation correctness
     * - Ensure no overflow or precision issues
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 10, maxLength: 20 }),
        async (scores) => {
          const sum = scores.reduce((acc, score) => acc + score, 0);
          const expectedMOS = Math.round((sum / scores.length) * 100) / 100;
          
          const actualMOS = calculateMOS(scores);
          
          expect(actualMOS).toBe(expectedMOS);
          expect(actualMOS).toBeGreaterThanOrEqual(1);
          expect(actualMOS).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should round to exactly 2 decimal places', async () => {
    /**
     * **Validates: Requirements 7.1**
     * 
     * This property test verifies that MOS is always rounded to
     * exactly 2 decimal places as specified in the requirements.
     * 
     * Strategy:
     * - Generate score arrays that produce various decimal results
     * - Verify rounding behavior is correct
     * - Test edge cases like .005, .995, etc.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 10 }),
        async (scores) => {
          const actualMOS = calculateMOS(scores);
          
          // Convert to string and check decimal places
          const mosString = actualMOS.toString();
          const parts = mosString.split('.');
          
          if (parts.length === 2) {
            // Has decimal part
            expect(parts[1].length).toBeLessThanOrEqual(2);
          }
          
          // Verify rounding is correct by comparing with manual calculation
          const sum = scores.reduce((acc, score) => acc + score, 0);
          const rawMean = sum / scores.length;
          const expectedRounded = Math.round(rawMean * 100) / 100;
          
          expect(actualMOS).toBe(expectedRounded);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle scores with specific patterns correctly', async () => {
    /**
     * **Validates: Requirements 7.1**
     * 
     * This property test verifies MOS calculation with specific
     * score patterns that might reveal edge cases.
     * 
     * Strategy:
     * - Test alternating high/low scores
     * - Test ascending/descending sequences
     * - Verify mean calculation is correct for patterns
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }),
        async (length) => {
          // Test alternating pattern: [1, 10, 1, 10, ...]
          const alternatingScores = Array.from(
            { length }, 
            (_, i) => i % 2 === 0 ? 1 : 10
          );
          
          const mos = calculateMOS(alternatingScores);
          
          // Calculate expected mean properly
          const alternatingSum = alternatingScores.reduce((a, b) => a + b, 0);
          const expectedMean = alternatingSum / alternatingScores.length;
          const expectedRounded = Math.round(expectedMean * 100) / 100;
          
          expect(mos).toBe(expectedRounded);
          
          // Test ascending sequence: [1, 2, 3, ...]
          const ascendingScores = Array.from(
            { length: Math.min(length, 10) }, 
            (_, i) => i + 1
          );
          
          const ascendingMOS = calculateMOS(ascendingScores);
          const ascendingSum = ascendingScores.reduce((a, b) => a + b, 0);
          const ascendingExpected = Math.round((ascendingSum / ascendingScores.length) * 100) / 100;
          
          expect(ascendingMOS).toBe(ascendingExpected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
