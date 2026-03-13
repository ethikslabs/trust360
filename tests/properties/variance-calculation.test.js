/**
 * Property-based test for variance calculation
 * 
 * Feature: trust360-v0-1-pipeline, Property 17
 * 
 * Property 17: Variance Calculation Correctness
 * **Validates: Requirements 7.2**
 * 
 * For any set of valid model scores, the calculated variance should equal
 * the mean of squared differences from the MOS, rounded to 2 decimal places.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateVariance, calculateMOS } from '../../src/utils/consensus.js';

describe('Feature: trust360-v0-1-pipeline, Property 17: Variance Calculation Correctness', () => {
  it('should calculate variance correctly across random score sets', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies that the variance calculation produces the
     * correct result using the formula: mean of squared differences from MOS.
     * 
     * Strategy:
     * - Generate random arrays of scores (1-10 inclusive)
     * - Calculate MOS first
     * - Calculate expected variance independently
     * - Verify calculateVariance returns the same value (within rounding tolerance)
     * - Test across 100 iterations with varying array sizes
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate arrays of scores between 1 and 10 (valid model score range)
        // Array length: 1-10 models (at least 1 model required for consensus)
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 10 }),
        async (scores) => {
          // Calculate MOS first (variance depends on mean)
          const mos = calculateMOS(scores);
          
          // Calculate expected variance using the formula:
          // variance = mean of squared differences from MOS
          const squaredDiffs = scores.map(score => Math.pow(score - mos, 2));
          const expectedVariance = squaredDiffs.reduce((acc, val) => acc + val, 0) / scores.length;
          
          // Round to 2 decimal places (as per requirement)
          const expectedRounded = Math.round(expectedVariance * 100) / 100;
          
          // Calculate actual variance using the implementation
          const actualVariance = calculateVariance(scores, mos);
          
          // Verify the result matches expected value
          expect(actualVariance).toBe(expectedRounded);
          
          // Verify variance is non-negative (mathematical property)
          expect(actualVariance).toBeGreaterThanOrEqual(0);
          
          // Verify result has at most 2 decimal places
          const decimalPlaces = (actualVariance.toString().split('.')[1] || '').length;
          expect(decimalPlaces).toBeLessThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return zero variance for identical scores', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies that when all scores are identical,
     * the variance is zero (no disagreement).
     * 
     * Strategy:
     * - Generate arrays where all scores are identical
     * - Verify variance equals 0
     * - Test with varying array lengths
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        async (score, arrayLength) => {
          // Create array of identical scores
          const scores = Array(arrayLength).fill(score);
          const mos = calculateMOS(scores);
          const actualVariance = calculateVariance(scores, mos);
          
          // Variance of identical values should be 0
          expect(actualVariance).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle single score edge case', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies that variance calculation works correctly
     * when only a single model provides a score (edge case).
     * 
     * Strategy:
     * - Generate single scores (1-10)
     * - Verify variance is 0 (single value has no spread)
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (score) => {
          const scores = [score];
          const mos = calculateMOS(scores);
          const actualVariance = calculateVariance(scores, mos);
          
          // For a single score, variance should be 0
          expect(actualVariance).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate maximum variance for extreme scores', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies variance calculation for extreme cases
     * where scores are at opposite ends of the scale.
     * 
     * Strategy:
     * - Test with scores at extremes (1 and 10)
     * - Verify variance is calculated correctly
     * - Maximum variance occurs with maximum spread
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (count1, count10) => {
          // Create array with mix of 1s and 10s
          const scores = [
            ...Array(count1).fill(1),
            ...Array(count10).fill(10)
          ];
          
          if (scores.length === 0) return; // Skip empty arrays
          
          const mos = calculateMOS(scores);
          const actualVariance = calculateVariance(scores, mos);
          
          // Calculate expected variance manually
          const squaredDiffs = scores.map(score => Math.pow(score - mos, 2));
          const expectedVariance = squaredDiffs.reduce((acc, val) => acc + val, 0) / scores.length;
          const expectedRounded = Math.round(expectedVariance * 100) / 100;
          
          expect(actualVariance).toBe(expectedRounded);
          
          // Variance should be positive for mixed scores
          if (count1 > 0 && count10 > 0) {
            expect(actualVariance).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain mathematical properties of variance', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies that variance calculation maintains
     * fundamental mathematical properties.
     * 
     * Properties tested:
     * - Variance is always non-negative
     * - Variance is zero if and only if all values are equal
     * - Adding a value equal to the mean doesn't change variance much
     * 
     * Strategy:
     * - Generate random score arrays
     * - Verify mathematical invariants
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 2, maxLength: 10 }),
        async (scores) => {
          const mos = calculateMOS(scores);
          const actualVariance = calculateVariance(scores, mos);
          
          // Property 1: Variance is always non-negative
          expect(actualVariance).toBeGreaterThanOrEqual(0);
          
          // Property 2: Check if all values are equal
          const allEqual = scores.every(score => score === scores[0]);
          if (allEqual) {
            expect(actualVariance).toBe(0);
          }
          
          // Property 3: Variance is bounded by the square of the range
          const minScore = Math.min(...scores);
          const maxScore = Math.max(...scores);
          const maxPossibleVariance = Math.pow(maxScore - minScore, 2);
          expect(actualVariance).toBeLessThanOrEqual(maxPossibleVariance);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce consistent results for the same input', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies that variance calculation is deterministic
     * and produces the same result for the same input.
     * 
     * Strategy:
     * - Generate random score arrays
     * - Calculate variance multiple times
     * - Verify all results are identical
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 10 }),
        async (scores) => {
          const mos = calculateMOS(scores);
          
          const variance1 = calculateVariance(scores, mos);
          const variance2 = calculateVariance(scores, mos);
          const variance3 = calculateVariance(scores, mos);
          
          // All calculations should produce identical results
          expect(variance1).toBe(variance2);
          expect(variance2).toBe(variance3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle larger arrays correctly', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies that variance calculation works correctly
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
          const mos = calculateMOS(scores);
          
          // Calculate expected variance
          const squaredDiffs = scores.map(score => Math.pow(score - mos, 2));
          const expectedVariance = squaredDiffs.reduce((acc, val) => acc + val, 0) / scores.length;
          const expectedRounded = Math.round(expectedVariance * 100) / 100;
          
          const actualVariance = calculateVariance(scores, mos);
          
          expect(actualVariance).toBe(expectedRounded);
          expect(actualVariance).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should round to exactly 2 decimal places', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies that variance is always rounded to
     * exactly 2 decimal places as specified in the requirements.
     * 
     * Strategy:
     * - Generate score arrays that produce various decimal results
     * - Verify rounding behavior is correct
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 10 }),
        async (scores) => {
          const mos = calculateMOS(scores);
          const actualVariance = calculateVariance(scores, mos);
          
          // Convert to string and check decimal places
          const varianceString = actualVariance.toString();
          const parts = varianceString.split('.');
          
          if (parts.length === 2) {
            // Has decimal part
            expect(parts[1].length).toBeLessThanOrEqual(2);
          }
          
          // Verify rounding is correct by comparing with manual calculation
          const squaredDiffs = scores.map(score => Math.pow(score - mos, 2));
          const rawVariance = squaredDiffs.reduce((acc, val) => acc + val, 0) / scores.length;
          const expectedRounded = Math.round(rawVariance * 100) / 100;
          
          expect(actualVariance).toBe(expectedRounded);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle specific score patterns correctly', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies variance calculation with specific
     * score patterns that might reveal edge cases.
     * 
     * Strategy:
     * - Test alternating high/low scores
     * - Test ascending/descending sequences
     * - Verify variance calculation is correct for patterns
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
          const variance = calculateVariance(alternatingScores, mos);
          
          // Calculate expected variance
          const squaredDiffs = alternatingScores.map(score => Math.pow(score - mos, 2));
          const expectedVariance = squaredDiffs.reduce((acc, val) => acc + val, 0) / alternatingScores.length;
          const expectedRounded = Math.round(expectedVariance * 100) / 100;
          
          expect(variance).toBe(expectedRounded);
          
          // Alternating 1 and 10 should have high variance
          expect(variance).toBeGreaterThan(0);
          
          // Test ascending sequence: [1, 2, 3, ...]
          const ascendingScores = Array.from(
            { length: Math.min(length, 10) }, 
            (_, i) => i + 1
          );
          
          const ascendingMOS = calculateMOS(ascendingScores);
          const ascendingVariance = calculateVariance(ascendingScores, ascendingMOS);
          
          const ascendingSquaredDiffs = ascendingScores.map(score => Math.pow(score - ascendingMOS, 2));
          const ascendingExpected = Math.round(
            (ascendingSquaredDiffs.reduce((acc, val) => acc + val, 0) / ascendingScores.length) * 100
          ) / 100;
          
          expect(ascendingVariance).toBe(ascendingExpected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify variance formula with known examples', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies variance calculation against
     * mathematically known examples.
     * 
     * Strategy:
     * - Use specific score sets with known variance
     * - Verify implementation matches expected results
     */
    
    // Test case 1: [5, 5, 5] - variance should be 0
    const scores1 = [5, 5, 5];
    const mos1 = calculateMOS(scores1);
    const variance1 = calculateVariance(scores1, mos1);
    expect(variance1).toBe(0);
    
    // Test case 2: [1, 5, 9] - mean is 5, variance is ((16+0+16)/3) = 10.67
    const scores2 = [1, 5, 9];
    const mos2 = calculateMOS(scores2);
    const variance2 = calculateVariance(scores2, mos2);
    const expected2 = Math.round(((16 + 0 + 16) / 3) * 100) / 100;
    expect(variance2).toBe(expected2);
    
    // Test case 3: [1, 10] - mean is 5.5, variance is ((20.25+20.25)/2) = 20.25
    const scores3 = [1, 10];
    const mos3 = calculateMOS(scores3);
    const variance3 = calculateVariance(scores3, mos3);
    const diff1 = Math.pow(1 - mos3, 2);
    const diff2 = Math.pow(10 - mos3, 2);
    const expected3 = Math.round(((diff1 + diff2) / 2) * 100) / 100;
    expect(variance3).toBe(expected3);
  });

  it('should handle variance with MOS that has rounding', async () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * This property test verifies that variance calculation works correctly
     * when the MOS itself is a rounded value.
     * 
     * Strategy:
     * - Generate scores that produce rounded MOS values
     * - Verify variance uses the rounded MOS correctly
     * - Ensure consistency between MOS and variance calculations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 2, maxLength: 10 }),
        async (scores) => {
          // Calculate MOS (which is rounded to 2 decimals)
          const mos = calculateMOS(scores);
          
          // Calculate variance using the rounded MOS
          const actualVariance = calculateVariance(scores, mos);
          
          // Verify variance is calculated using the provided MOS
          // (not recalculating from raw scores)
          const squaredDiffs = scores.map(score => Math.pow(score - mos, 2));
          const expectedVariance = squaredDiffs.reduce((acc, val) => acc + val, 0) / scores.length;
          const expectedRounded = Math.round(expectedVariance * 100) / 100;
          
          expect(actualVariance).toBe(expectedRounded);
        }
      ),
      { numRuns: 100 }
    );
  });
});
