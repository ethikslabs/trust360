/**
 * Property-based test for agreement classification
 * 
 * Feature: trust360-v0-1-pipeline, Property 18
 * 
 * Property 18: Agreement Classification Thresholds
 * **Validates: Requirements 7.3**
 * 
 * For any calculated variance, the agreement level should be classified as:
 * 'high' if variance < 0.5, 'medium' if 0.5 ≤ variance < 1.5, 'low' if variance ≥ 1.5.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { classifyAgreement } from '../../src/utils/consensus.js';

describe('Feature: trust360-v0-1-pipeline, Property 18: Agreement Classification Thresholds', () => {
  it('should classify high agreement for variance < 0.5', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that any variance value below 0.5
     * is classified as 'high' agreement.
     * 
     * Strategy:
     * - Generate random variance values in range [0, 0.5)
     * - Verify all are classified as 'high'
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate variance values from 0 to just below 0.5
        fc.double({ min: 0, max: 0.49999999, noNaN: true }),
        async (variance) => {
          const agreement = classifyAgreement(variance);
          expect(agreement).toBe('high');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should classify medium agreement for variance >= 0.5 and < 1.5', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that any variance value in the range
     * [0.5, 1.5) is classified as 'medium' agreement.
     * 
     * Strategy:
     * - Generate random variance values in range [0.5, 1.5)
     * - Verify all are classified as 'medium'
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate variance values from 0.5 to just below 1.5
        fc.double({ min: 0.5, max: 1.49999999, noNaN: true }),
        async (variance) => {
          const agreement = classifyAgreement(variance);
          expect(agreement).toBe('medium');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should classify low agreement for variance >= 1.5', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that any variance value at or above 1.5
     * is classified as 'low' agreement.
     * 
     * Strategy:
     * - Generate random variance values in range [1.5, 100]
     * - Verify all are classified as 'low'
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate variance values from 1.5 to a reasonable upper bound
        fc.double({ min: 1.5, max: 100, noNaN: true }),
        async (variance) => {
          const agreement = classifyAgreement(variance);
          expect(agreement).toBe('low');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle exact threshold boundaries correctly', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that the exact threshold values
     * are classified correctly according to the specification.
     * 
     * Thresholds:
     * - variance < 0.5: high
     * - variance < 1.5: medium (implies >= 0.5)
     * - variance >= 1.5: low
     * 
     * Strategy:
     * - Test exact boundary values
     * - Test values just above and below boundaries
     */
    
    // Test exact boundary: 0.5 should be 'medium' (>= 0.5)
    expect(classifyAgreement(0.5)).toBe('medium');
    
    // Test just below 0.5 should be 'high'
    expect(classifyAgreement(0.49)).toBe('high');
    expect(classifyAgreement(0.499)).toBe('high');
    
    // Test exact boundary: 1.5 should be 'low' (>= 1.5)
    expect(classifyAgreement(1.5)).toBe('low');
    
    // Test just below 1.5 should be 'medium'
    expect(classifyAgreement(1.49)).toBe('medium');
    expect(classifyAgreement(1.499)).toBe('medium');
    
    // Test zero variance (perfect agreement)
    expect(classifyAgreement(0)).toBe('high');
    
    // Test very small variance
    expect(classifyAgreement(0.01)).toBe('high');
    expect(classifyAgreement(0.1)).toBe('high');
    
    // Test mid-range medium values
    expect(classifyAgreement(0.75)).toBe('medium');
    expect(classifyAgreement(1.0)).toBe('medium');
    expect(classifyAgreement(1.25)).toBe('medium');
    
    // Test large variance values
    expect(classifyAgreement(2.0)).toBe('low');
    expect(classifyAgreement(5.0)).toBe('low');
    expect(classifyAgreement(10.0)).toBe('low');
  });

  it('should classify all possible variance values into exactly one category', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that every possible variance value
     * is classified into exactly one of the three categories, with no
     * gaps or overlaps in the classification logic.
     * 
     * Strategy:
     * - Generate random variance values across full range
     * - Verify each returns one of the three valid classifications
     * - Ensure no undefined or invalid results
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate variance values across a wide range
        fc.double({ min: 0, max: 100, noNaN: true }),
        async (variance) => {
          const agreement = classifyAgreement(variance);
          
          // Must be one of the three valid classifications
          expect(['high', 'medium', 'low']).toContain(agreement);
          
          // Verify classification matches expected threshold logic
          if (variance < 0.5) {
            expect(agreement).toBe('high');
          } else if (variance < 1.5) {
            expect(agreement).toBe('medium');
          } else {
            expect(agreement).toBe('low');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be deterministic for the same variance value', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that classification is deterministic:
     * the same variance value always produces the same classification.
     * 
     * Strategy:
     * - Generate random variance values
     * - Classify multiple times
     * - Verify all results are identical
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0, max: 100, noNaN: true }),
        async (variance) => {
          const result1 = classifyAgreement(variance);
          const result2 = classifyAgreement(variance);
          const result3 = classifyAgreement(variance);
          
          // All classifications should be identical
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle very small variance values as high agreement', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that very small variance values
     * (near-perfect agreement) are correctly classified as 'high'.
     * 
     * Strategy:
     * - Generate very small variance values (0 to 0.1)
     * - Verify all are classified as 'high'
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0, max: 0.1, noNaN: true }),
        async (variance) => {
          const agreement = classifyAgreement(variance);
          expect(agreement).toBe('high');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle very large variance values as low agreement', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that very large variance values
     * (extreme disagreement) are correctly classified as 'low'.
     * 
     * Strategy:
     * - Generate large variance values (10 to 100)
     * - Verify all are classified as 'low'
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 10, max: 100, noNaN: true }),
        async (variance) => {
          const agreement = classifyAgreement(variance);
          expect(agreement).toBe('low');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should classify variance values from rounded calculations correctly', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that variance values that have been
     * rounded to 2 decimal places (as per the variance calculation requirement)
     * are classified correctly.
     * 
     * Strategy:
     * - Generate variance values and round to 2 decimals
     * - Verify classification is correct for rounded values
     * - Ensure rounding doesn't cause misclassification near boundaries
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0, max: 100, noNaN: true }),
        async (rawVariance) => {
          // Round to 2 decimal places (as variance calculation does)
          const roundedVariance = Math.round(rawVariance * 100) / 100;
          
          const agreement = classifyAgreement(roundedVariance);
          
          // Verify classification matches threshold logic
          if (roundedVariance < 0.5) {
            expect(agreement).toBe('high');
          } else if (roundedVariance < 1.5) {
            expect(agreement).toBe('medium');
          } else {
            expect(agreement).toBe('low');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary precision edge cases', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies classification behavior with values
     * very close to the boundaries, testing floating-point precision.
     * 
     * Strategy:
     * - Test values extremely close to 0.5 and 1.5
     * - Verify correct classification despite floating-point precision
     */
    
    // Values just below 0.5
    expect(classifyAgreement(0.4999999)).toBe('high');
    expect(classifyAgreement(0.49999)).toBe('high');
    expect(classifyAgreement(0.4999)).toBe('high');
    
    // Values at and just above 0.5
    expect(classifyAgreement(0.5)).toBe('medium');
    expect(classifyAgreement(0.5000001)).toBe('medium');
    expect(classifyAgreement(0.50001)).toBe('medium');
    
    // Values just below 1.5
    expect(classifyAgreement(1.4999999)).toBe('medium');
    expect(classifyAgreement(1.49999)).toBe('medium');
    expect(classifyAgreement(1.4999)).toBe('medium');
    
    // Values at and just above 1.5
    expect(classifyAgreement(1.5)).toBe('low');
    expect(classifyAgreement(1.5000001)).toBe('low');
    expect(classifyAgreement(1.50001)).toBe('low');
  });

  it('should classify variance from realistic score scenarios', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies classification using variance values
     * that would realistically occur from model score arrays.
     * 
     * Strategy:
     * - Generate realistic variance values (0 to 20)
     * - Verify classification is correct
     * - Ensure the function works with real-world data
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Realistic variance range for model scores (1-10)
        fc.double({ min: 0, max: 20, noNaN: true }),
        async (variance) => {
          const agreement = classifyAgreement(variance);
          
          // Verify result is valid
          expect(['high', 'medium', 'low']).toContain(agreement);
          
          // Verify threshold logic
          if (variance < 0.5) {
            expect(agreement).toBe('high');
          } else if (variance >= 0.5 && variance < 1.5) {
            expect(agreement).toBe('medium');
          } else {
            expect(agreement).toBe('low');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain monotonic classification behavior', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies that as variance increases,
     * the agreement classification never improves (only stays same or worsens).
     * 
     * Monotonic property: high -> medium -> low (never reverses)
     * 
     * Strategy:
     * - Generate pairs of variance values where v1 < v2
     * - Verify classification of v2 is same or worse than v1
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0, max: 50, noNaN: true }),
        fc.double({ min: 0, max: 50, noNaN: true }),
        async (variance1, variance2) => {
          // Ensure variance1 < variance2
          const [lower, higher] = variance1 < variance2 
            ? [variance1, variance2] 
            : [variance2, variance1];
          
          if (lower === higher) return; // Skip equal values
          
          const agreement1 = classifyAgreement(lower);
          const agreement2 = classifyAgreement(higher);
          
          // Define agreement ordering: high > medium > low
          const order = { high: 3, medium: 2, low: 1 };
          
          // Higher variance should have same or worse (lower) agreement
          expect(order[agreement2]).toBeLessThanOrEqual(order[agreement1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify classification with known variance examples', async () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * This property test verifies classification against specific
     * known examples to ensure correctness.
     * 
     * Strategy:
     * - Use specific variance values with known classifications
     * - Verify implementation matches expected results
     */
    
    // High agreement examples (variance < 0.5)
    expect(classifyAgreement(0)).toBe('high');
    expect(classifyAgreement(0.1)).toBe('high');
    expect(classifyAgreement(0.25)).toBe('high');
    expect(classifyAgreement(0.49)).toBe('high');
    
    // Medium agreement examples (0.5 <= variance < 1.5)
    expect(classifyAgreement(0.5)).toBe('medium');
    expect(classifyAgreement(0.75)).toBe('medium');
    expect(classifyAgreement(1.0)).toBe('medium');
    expect(classifyAgreement(1.25)).toBe('medium');
    expect(classifyAgreement(1.49)).toBe('medium');
    
    // Low agreement examples (variance >= 1.5)
    expect(classifyAgreement(1.5)).toBe('low');
    expect(classifyAgreement(2.0)).toBe('low');
    expect(classifyAgreement(5.0)).toBe('low');
    expect(classifyAgreement(10.0)).toBe('low');
    expect(classifyAgreement(20.0)).toBe('low');
  });
});
