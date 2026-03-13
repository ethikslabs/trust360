/**
 * Property-based test for response structure completeness
 * 
 * Feature: trust360-v0-1-pipeline, Property 22
 * 
 * Property 22: Response Structure Completeness
 * **Validates: Requirements 8.3, 8.5, 8.6**
 * 
 * For any successful response, it should contain: traceId (string), consensus
 * (object with mos, variance, agreement), models (array with model, score,
 * confidence, reasoning for each), and metrics (object with totalModels,
 * successfulModels, failedModels, executionTimeMs).
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildResponse } from '../../src/stages/build-response.js';

describe('Feature: trust360-v0-1-pipeline, Property 22: Response Structure Completeness', () => {
  it('should contain all required top-level fields: traceId, consensus, models, metrics', async () => {
    /**
     * **Validates: Requirements 8.3, 8.5, 8.6**
     * 
     * This property test verifies that the response object contains all
     * required top-level fields for any valid context.
     * 
     * Strategy:
     * - Generate random valid contexts with varying data
     * - Execute buildResponse stage
     * - Verify response has traceId, consensus, models, and metrics fields
     * - Verify field types are correct
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate trace ID
        fc.uuid(),
        // Generate start time
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        // Generate consensus object
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        // Generate valid responses array
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // Generate raw responses array (must be >= validResponses length)
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          // Ensure rawResponses has at least as many items as validResponses
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          // Create context object
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          // Execute buildResponse stage
          const result = await buildResponse(ctx);
          
          // Verify response object exists
          expect(result.response).toBeDefined();
          expect(result.response).not.toBeNull();
          expect(typeof result.response).toBe('object');
          
          // Verify required field: traceId
          expect(result.response).toHaveProperty('traceId');
          expect(typeof result.response.traceId).toBe('string');
          expect(result.response.traceId).toBe(traceId);
          
          // Verify required field: consensus
          expect(result.response).toHaveProperty('consensus');
          expect(typeof result.response.consensus).toBe('object');
          expect(result.response.consensus).not.toBeNull();
          
          // Verify required field: models
          expect(result.response).toHaveProperty('models');
          expect(Array.isArray(result.response.models)).toBe(true);
          
          // Verify required field: metrics
          expect(result.response).toHaveProperty('metrics');
          expect(typeof result.response.metrics).toBe('object');
          expect(result.response.metrics).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consensus object with mos, variance, and agreement fields', async () => {
    /**
     * **Validates: Requirements 8.4**
     * 
     * This property test verifies that the consensus object in the response
     * contains all required fields.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          // Verify consensus structure
          expect(result.response.consensus).toHaveProperty('mos');
          expect(typeof result.response.consensus.mos).toBe('number');
          
          expect(result.response.consensus).toHaveProperty('variance');
          expect(typeof result.response.consensus.variance).toBe('number');
          
          expect(result.response.consensus).toHaveProperty('agreement');
          expect(typeof result.response.consensus.agreement).toBe('string');
          expect(['high', 'medium', 'low']).toContain(result.response.consensus.agreement);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have models array with required fields for each model', async () => {
    /**
     * **Validates: Requirements 8.5**
     * 
     * This property test verifies that the models array contains objects
     * with all required fields: model, score, confidence, and reasoning.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          // Verify models array is not empty
          expect(result.response.models.length).toBeGreaterThan(0);
          
          // Verify each model has required fields
          result.response.models.forEach(model => {
            expect(model).toHaveProperty('model');
            expect(typeof model.model).toBe('string');
            
            expect(model).toHaveProperty('score');
            expect(typeof model.score).toBe('number');
            expect(model.score).toBeGreaterThanOrEqual(1);
            expect(model.score).toBeLessThanOrEqual(10);
            
            expect(model).toHaveProperty('confidence');
            expect(typeof model.confidence).toBe('number');
            expect(model.confidence).toBeGreaterThanOrEqual(0);
            expect(model.confidence).toBeLessThanOrEqual(1);
            
            expect(model).toHaveProperty('reasoning');
            expect(typeof model.reasoning).toBe('string');
            expect(model.reasoning.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have metrics object with totalModels, successfulModels, failedModels, executionTimeMs', async () => {
    /**
     * **Validates: Requirements 8.6**
     * 
     * This property test verifies that the metrics object contains all
     * required fields with correct types and values.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          // Verify metrics structure
          expect(result.response.metrics).toHaveProperty('totalModels');
          expect(typeof result.response.metrics.totalModels).toBe('number');
          expect(result.response.metrics.totalModels).toBe(adjustedRawResponses.length);
          
          expect(result.response.metrics).toHaveProperty('successfulModels');
          expect(typeof result.response.metrics.successfulModels).toBe('number');
          expect(result.response.metrics.successfulModels).toBe(validResponses.length);
          
          expect(result.response.metrics).toHaveProperty('failedModels');
          expect(typeof result.response.metrics.failedModels).toBe('number');
          expect(result.response.metrics.failedModels).toBe(
            adjustedRawResponses.length - validResponses.length
          );
          
          expect(result.response.metrics).toHaveProperty('executionTimeMs');
          expect(typeof result.response.metrics.executionTimeMs).toBe('number');
          expect(result.response.metrics.executionTimeMs).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain metrics consistency: totalModels = successfulModels + failedModels', async () => {
    /**
     * **Validates: Requirements 8.6**
     * 
     * This property test verifies that the metrics counts are mathematically
     * consistent: total should equal successful plus failed.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          // Verify mathematical consistency
          const { totalModels, successfulModels, failedModels } = result.response.metrics;
          expect(totalModels).toBe(successfulModels + failedModels);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain exactly four top-level fields', async () => {
    /**
     * **Validates: Requirements 8.3, 8.5, 8.6**
     * 
     * This property test verifies that the response object contains
     * exactly the four required fields and no additional fields.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          // Verify exactly 4 fields
          const keys = Object.keys(result.response);
          expect(keys).toHaveLength(4);
          
          // Verify the exact field names
          expect(keys).toContain('traceId');
          expect(keys).toContain('consensus');
          expect(keys).toContain('models');
          expect(keys).toContain('metrics');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not contain any undefined or null required fields', async () => {
    /**
     * **Validates: Requirements 8.3, 8.5, 8.6**
     * 
     * This property test verifies that none of the required fields
     * in the response are undefined or null.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          // Verify no undefined fields
          expect(result.response.traceId).not.toBeUndefined();
          expect(result.response.consensus).not.toBeUndefined();
          expect(result.response.models).not.toBeUndefined();
          expect(result.response.metrics).not.toBeUndefined();
          
          // Verify no null fields
          expect(result.response.traceId).not.toBeNull();
          expect(result.response.consensus).not.toBeNull();
          expect(result.response.models).not.toBeNull();
          expect(result.response.metrics).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce serializable response object', async () => {
    /**
     * **Validates: Requirements 8.3, 8.5, 8.6**
     * 
     * This property test verifies that the response object can be
     * serialized to JSON (required for API responses).
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          // Serialize to JSON
          const jsonString = JSON.stringify(result.response);
          expect(jsonString).toBeDefined();
          
          // Deserialize and verify structure is preserved
          const parsed = JSON.parse(jsonString);
          expect(parsed).toHaveProperty('traceId');
          expect(parsed).toHaveProperty('consensus');
          expect(parsed).toHaveProperty('models');
          expect(parsed).toHaveProperty('metrics');
          
          // Verify values match original
          expect(parsed.traceId).toBe(result.response.traceId);
          expect(parsed.consensus).toEqual(result.response.consensus);
          expect(parsed.models).toEqual(result.response.models);
          expect(parsed.metrics).toEqual(result.response.metrics);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain structure with single model response', async () => {
    /**
     * **Validates: Requirements 8.3, 8.5, 8.6**
     * 
     * This property test verifies that the response structure is maintained
     * even with edge case of single model response.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.record({
          model: fc.string({ minLength: 3, maxLength: 20 }),
          score: fc.integer({ min: 1, max: 10 }),
          reasoning: fc.string({ minLength: 10, maxLength: 100 }),
          confidence: fc.float({ min: 0, max: 1, noNaN: true }),
          assumptions: fc.array(fc.string(), { maxLength: 5 })
        }),
        async (traceId, startTime, consensus, validResponse) => {
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses: [validResponse],
            rawResponses: [
              {
                model: validResponse.model,
                status: 'fulfilled',
                response: JSON.stringify(validResponse),
                error: null
              }
            ]
          };
          
          const result = await buildResponse(ctx);
          
          // Verify all required fields are present
          expect(result.response).toHaveProperty('traceId');
          expect(result.response).toHaveProperty('consensus');
          expect(result.response).toHaveProperty('models');
          expect(result.response).toHaveProperty('metrics');
          
          // Verify models array has exactly one item
          expect(result.response.models).toHaveLength(1);
          
          // Verify metrics reflect single model
          expect(result.response.metrics.totalModels).toBe(1);
          expect(result.response.metrics.successfulModels).toBe(1);
          expect(result.response.metrics.failedModels).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain structure with many model responses', async () => {
    /**
     * **Validates: Requirements 8.3, 8.5, 8.6**
     * 
     * This property test verifies that the response structure is maintained
     * with larger numbers of model responses.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 10, maxLength: 20 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 10, maxLength: 25 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          // Verify structure is maintained
          expect(result.response).toHaveProperty('traceId');
          expect(result.response).toHaveProperty('consensus');
          expect(result.response).toHaveProperty('models');
          expect(result.response).toHaveProperty('metrics');
          
          // Verify models array length matches validResponses
          expect(result.response.models).toHaveLength(validResponses.length);
          
          // Verify metrics reflect correct counts
          expect(result.response.metrics.totalModels).toBe(adjustedRawResponses.length);
          expect(result.response.metrics.successfulModels).toBe(validResponses.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve traceId from context', async () => {
    /**
     * **Validates: Requirements 8.3**
     * 
     * This property test verifies that the traceId in the response
     * matches the traceId from the context.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          // Verify traceId is preserved
          expect(result.response.traceId).toBe(traceId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate executionTimeMs correctly', async () => {
    /**
     * **Validates: Requirements 8.6**
     * 
     * This property test verifies that executionTimeMs is calculated
     * as the difference between current time and startTime.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: Date.now() - 60000, max: Date.now() - 1000 }),
        fc.record({
          mos: fc.float({ min: 1, max: 10, noNaN: true }),
          variance: fc.float({ min: 0, max: 100, noNaN: true }),
          agreement: fc.constantFrom('high', 'medium', 'low')
        }),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 10, maxLength: 100 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            model: fc.string({ minLength: 3, maxLength: 20 }),
            status: fc.constantFrom('fulfilled', 'rejected'),
            response: fc.oneof(fc.string(), fc.constant(null)),
            error: fc.oneof(fc.string(), fc.constant(null))
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (traceId, startTime, consensus, validResponses, rawResponses) => {
          const adjustedRawResponses = rawResponses.length >= validResponses.length
            ? rawResponses
            : [...rawResponses, ...Array(validResponses.length - rawResponses.length).fill(rawResponses[0])];
          
          const beforeExecution = Date.now();
          
          const ctx = {
            traceId,
            startTime,
            consensus,
            validResponses,
            rawResponses: adjustedRawResponses
          };
          
          const result = await buildResponse(ctx);
          
          const afterExecution = Date.now();
          
          // Verify executionTimeMs is reasonable
          expect(result.response.metrics.executionTimeMs).toBeGreaterThanOrEqual(
            beforeExecution - startTime
          );
          expect(result.response.metrics.executionTimeMs).toBeLessThanOrEqual(
            afterExecution - startTime
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
