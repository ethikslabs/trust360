/**
 * Property-based test for invalid response exclusion
 * 
 * Feature: trust360-v0-1-pipeline, Property 15
 * 
 * Property 15: Invalid Response Exclusion
 * **Validates: Requirements 6.6, 6.7**
 * 
 * For any model response that fails validation, it should be excluded from
 * consensus computation and a validation failure should be logged with the Trace_ID.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { parseOutputs } from '../../src/stages/parse-outputs.js';
import { logger } from '../../src/utils/logger.js';

// Mock the logger
vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('Feature: trust360-v0-1-pipeline, Property 15: Invalid Response Exclusion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should exclude invalid responses from validResponses array', async () => {
    /**
     * **Validates: Requirements 6.6**
     * 
     * This property test verifies that responses failing validation are
     * excluded from the validResponses array that feeds into consensus
     * computation.
     * 
     * Strategy:
     * - Generate a mix of valid and invalid responses
     * - Process through parseOutputs stage
     * - Verify only valid responses appear in validResponses
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate at least 1 valid and 1 invalid response
        fc.tuple(
          // Valid responses
          fc.array(
            fc.record({
              model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
              score: fc.integer({ min: 1, max: 10 }),
              reasoning: fc.string({ minLength: 1, maxLength: 200 }),
              confidence: fc.float({ min: 0, max: 1, noNaN: true }),
              assumptions: fc.array(fc.string(), { maxLength: 5 })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          // Invalid responses (various validation failures)
          fc.array(
            fc.oneof(
              // Invalid score (out of range)
              fc.record({
                model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
                score: fc.oneof(
                  fc.integer({ max: 0 }),
                  fc.integer({ min: 11, max: 100 })
                ),
                reasoning: fc.string({ minLength: 1, maxLength: 200 }),
                confidence: fc.float({ min: 0, max: 1, noNaN: true }),
                assumptions: fc.array(fc.string())
              }),
              // Empty reasoning
              fc.record({
                model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
                score: fc.integer({ min: 1, max: 10 }),
                reasoning: fc.constant(''),
                confidence: fc.float({ min: 0, max: 1, noNaN: true }),
                assumptions: fc.array(fc.string())
              }),
              // Invalid confidence (out of range)
              fc.record({
                model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
                score: fc.integer({ min: 1, max: 10 }),
                reasoning: fc.string({ minLength: 1, maxLength: 200 }),
                confidence: fc.oneof(
                  fc.float({ max: Math.fround(-0.01), noNaN: true }),
                  fc.float({ min: Math.fround(1.01), max: 10, noNaN: true })
                ),
                assumptions: fc.array(fc.string())
              }),
              // Non-array assumptions
              fc.record({
                model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
                score: fc.integer({ min: 1, max: 10 }),
                reasoning: fc.string({ minLength: 1, maxLength: 200 }),
                confidence: fc.float({ min: 0, max: 1, noNaN: true }),
                assumptions: fc.oneof(
                  fc.constant('not an array'),
                  fc.constant(null),
                  fc.integer()
                )
              })
            ),
            { minLength: 1, maxLength: 3 }
          )
        ),
        async ([validResponseData, invalidResponseData]) => {
          // Create rawResponses with both valid and invalid responses
          const rawResponses = [
            ...validResponseData.map(data => ({
              model: data.model,
              status: 'fulfilled',
              response: JSON.stringify(data),
              error: null
            })),
            ...invalidResponseData.map(data => ({
              model: data.model,
              status: 'fulfilled',
              response: JSON.stringify(data),
              error: null
            }))
          ];
          
          // Create test context
          const ctx = {
            traceId: 'test-trace-id-exclusion',
            rawResponses
          };
          
          // Execute parseOutputs stage
          const result = await parseOutputs(ctx);
          
          // Verify validResponses only contains valid responses
          expect(result.validResponses).toBeDefined();
          expect(Array.isArray(result.validResponses)).toBe(true);
          expect(result.validResponses.length).toBe(validResponseData.length);
          
          // Verify each valid response is present
          validResponseData.forEach(validData => {
            const found = result.validResponses.find(
              r => r.model === validData.model &&
                   r.score === validData.score &&
                   r.reasoning === validData.reasoning
            );
            expect(found).toBeDefined();
          });
          
          // Verify invalid responses are NOT present
          invalidResponseData.forEach(invalidData => {
            const found = result.validResponses.find(
              r => r.model === invalidData.model
            );
            // If found, it must be a different response (not the invalid one)
            if (found) {
              expect(
                found.score !== invalidData.score ||
                found.reasoning !== invalidData.reasoning
              ).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log validation failures with Trace_ID', async () => {
    /**
     * **Validates: Requirements 6.7**
     * 
     * This property test verifies that when a response fails validation,
     * a warning is logged containing the Trace_ID, stage name, model name,
     * and error description.
     * 
     * Strategy:
     * - Generate invalid responses
     * - Process through parseOutputs stage
     * - Verify logger.warn was called for each invalid response
     * - Verify log entries contain Trace_ID and model information
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate trace ID
        fc.uuid(),
        // Generate invalid responses
        fc.array(
          fc.record({
            model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
            score: fc.oneof(
              fc.integer({ max: 0 }),
              fc.integer({ min: 11, max: 100 }),
              fc.constant('invalid')
            ),
            reasoning: fc.oneof(
              fc.string({ minLength: 1, maxLength: 100 }),
              fc.constant('')
            ),
            confidence: fc.oneof(
              fc.float({ min: 0, max: 1, noNaN: true }),
              fc.float({ min: Math.fround(1.1), max: 10, noNaN: true })
            ),
            assumptions: fc.oneof(
              fc.array(fc.string()),
              fc.constant('not an array')
            )
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (traceId, invalidResponseData) => {
          // Clear previous mock calls
          vi.clearAllMocks();
          
          // Create rawResponses with invalid responses
          const rawResponses = invalidResponseData.map(data => ({
            model: data.model,
            status: 'fulfilled',
            response: JSON.stringify(data),
            error: null
          }));
          
          // Create test context
          const ctx = {
            traceId,
            rawResponses
          };
          
          // Execute parseOutputs stage
          await parseOutputs(ctx);
          
          // Verify logger.warn was called for each invalid response
          expect(logger.warn).toHaveBeenCalledTimes(invalidResponseData.length);
          
          // Verify each log entry contains required information
          invalidResponseData.forEach((data, index) => {
            const logCall = logger.warn.mock.calls[index];
            expect(logCall).toBeDefined();
            
            const logEntry = logCall[0];
            expect(logEntry.traceId).toBe(traceId);
            expect(logEntry.stage).toBe('parseOutputs');
            expect(logEntry.model).toBe(data.model);
            expect(logEntry.error).toBe('Validation failed');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log parse failures with Trace_ID for malformed JSON', async () => {
    /**
     * **Validates: Requirements 6.7**
     * 
     * This property test verifies that when a response contains malformed
     * JSON that cannot be parsed, a warning is logged with the Trace_ID.
     * 
     * Strategy:
     * - Generate malformed JSON strings that will fail JSON.parse()
     * - Process through parseOutputs stage
     * - Verify logger.warn was called with parse failure message
     * - Verify log entries contain Trace_ID
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate trace ID
        fc.uuid(),
        // Generate malformed JSON responses (strings that will fail JSON.parse)
        fc.array(
          fc.record({
            model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
            malformedJson: fc.oneof(
              fc.constant('not json at all'),
              fc.constant('{ incomplete json'),
              fc.constant('{ "score": }'),
              fc.constant('{ "score": 5, }'), // trailing comma
              fc.constant('undefined'),
              fc.constant('{score: 5}') // unquoted key
            )
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (traceId, malformedData) => {
          // Clear previous mock calls
          vi.clearAllMocks();
          
          // Create rawResponses with malformed JSON
          const rawResponses = malformedData.map(data => ({
            model: data.model,
            status: 'fulfilled',
            response: data.malformedJson,
            error: null
          }));
          
          // Create test context
          const ctx = {
            traceId,
            rawResponses
          };
          
          // Execute parseOutputs stage
          const result = await parseOutputs(ctx);
          
          // Verify no valid responses were produced
          expect(result.validResponses.length).toBe(0);
          
          // Verify logger.warn was called for each malformed response
          expect(logger.warn).toHaveBeenCalledTimes(malformedData.length);
          
          // Verify each log entry contains required information
          malformedData.forEach((data, index) => {
            const logCall = logger.warn.mock.calls[index];
            expect(logCall).toBeDefined();
            
            const logEntry = logCall[0];
            expect(logEntry.traceId).toBe(traceId);
            expect(logEntry.stage).toBe('parseOutputs');
            expect(logEntry.model).toBe(data.model);
            expect(logEntry.error).toBe('Parse failed');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mix of valid, invalid, and failed responses', async () => {
    /**
     * **Validates: Requirements 6.6, 6.7**
     * 
     * This property test verifies the complete behavior when processing
     * a realistic mix of response types: valid responses, invalid responses,
     * parse failures, and rejected promises.
     * 
     * Strategy:
     * - Generate a mix of all response types
     * - Process through parseOutputs stage
     * - Verify only valid responses are included
     * - Verify appropriate logging for each failure type
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        // Valid responses
        fc.array(
          fc.record({
            model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
            score: fc.integer({ min: 1, max: 10 }),
            reasoning: fc.string({ minLength: 1, maxLength: 200 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string(), { maxLength: 5 })
          }),
          { minLength: 0, maxLength: 2 }
        ),
        // Invalid responses
        fc.array(
          fc.record({
            model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
            score: fc.integer({ min: 11, max: 100 }),
            reasoning: fc.string({ minLength: 1, maxLength: 200 }),
            confidence: fc.float({ min: 0, max: 1, noNaN: true }),
            assumptions: fc.array(fc.string())
          }),
          { minLength: 0, maxLength: 2 }
        ),
        // Malformed JSON
        fc.array(
          fc.record({
            model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
            malformedJson: fc.constant('{ invalid json')
          }),
          { minLength: 0, maxLength: 2 }
        ),
        // Rejected responses
        fc.array(
          fc.record({
            model: fc.constantFrom('gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'),
            error: fc.string({ minLength: 1, maxLength: 100 })
          }),
          { minLength: 0, maxLength: 2 }
        ),
        async (traceId, validData, invalidData, malformedData, rejectedData) => {
          // Clear previous mock calls
          vi.clearAllMocks();
          
          // Build rawResponses array
          const rawResponses = [
            ...validData.map(data => ({
              model: data.model,
              status: 'fulfilled',
              response: JSON.stringify(data),
              error: null
            })),
            ...invalidData.map(data => ({
              model: data.model,
              status: 'fulfilled',
              response: JSON.stringify(data),
              error: null
            })),
            ...malformedData.map(data => ({
              model: data.model,
              status: 'fulfilled',
              response: data.malformedJson,
              error: null
            })),
            ...rejectedData.map(data => ({
              model: data.model,
              status: 'rejected',
              response: null,
              error: data.error
            }))
          ];
          
          // Create test context
          const ctx = {
            traceId,
            rawResponses
          };
          
          // Execute parseOutputs stage
          const result = await parseOutputs(ctx);
          
          // Verify only valid responses are included
          expect(result.validResponses.length).toBe(validData.length);
          
          // Verify logger.warn was called for invalid and malformed responses
          const expectedWarnings = invalidData.length + malformedData.length;
          expect(logger.warn).toHaveBeenCalledTimes(expectedWarnings);
          
          // Verify all log entries contain the trace ID
          logger.warn.mock.calls.forEach(call => {
            const logEntry = call[0];
            expect(logEntry.traceId).toBe(traceId);
            expect(logEntry.stage).toBe('parseOutputs');
            expect(logEntry.model).toBeDefined();
            expect(logEntry.error).toMatch(/Validation failed|Parse failed/);
          });
          
          // Verify logger.info was called with completion summary
          expect(logger.info).toHaveBeenCalledWith({
            traceId,
            stage: 'parseOutputs',
            action: 'completed',
            validCount: validData.length
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude all invalid responses even when mixed with valid ones', async () => {
    /**
     * **Validates: Requirements 6.6**
     * 
     * This property test verifies that the exclusion logic is independent
     * for each response - the presence of valid responses does not affect
     * the exclusion of invalid ones.
     * 
     * Strategy:
     * - Generate responses with specific invalid fields
     * - Mix with valid responses
     * - Verify each invalid response is excluded regardless of context
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // Number of valid responses
        fc.integer({ min: 1, max: 3 }), // Number of invalid responses
        async (numValid, numInvalid) => {
          // Generate valid responses
          const validResponses = Array.from({ length: numValid }, (_, i) => ({
            model: `valid-model-${i}`,
            status: 'fulfilled',
            response: JSON.stringify({
              score: 7,
              reasoning: `Valid reasoning ${i}`,
              confidence: 0.8,
              assumptions: [`Assumption ${i}`]
            }),
            error: null
          }));
          
          // Generate invalid responses with different validation failures
          const invalidResponses = Array.from({ length: numInvalid }, (_, i) => {
            const invalidTypes = [
              { score: 0, reasoning: 'test', confidence: 0.5, assumptions: [] }, // score too low
              { score: 11, reasoning: 'test', confidence: 0.5, assumptions: [] }, // score too high
              { score: 5, reasoning: '', confidence: 0.5, assumptions: [] }, // empty reasoning
              { score: 5, reasoning: 'test', confidence: -0.1, assumptions: [] }, // confidence too low
              { score: 5, reasoning: 'test', confidence: 1.1, assumptions: [] }, // confidence too high
              { score: 5, reasoning: 'test', confidence: 0.5, assumptions: 'not array' } // invalid assumptions
            ];
            
            return {
              model: `invalid-model-${i}`,
              status: 'fulfilled',
              response: JSON.stringify(invalidTypes[i % invalidTypes.length]),
              error: null
            };
          });
          
          // Shuffle to ensure order doesn't matter
          const rawResponses = [...validResponses, ...invalidResponses]
            .sort(() => Math.random() - 0.5);
          
          // Create test context
          const ctx = {
            traceId: 'test-trace-exclusion-independence',
            rawResponses
          };
          
          // Execute parseOutputs stage
          const result = await parseOutputs(ctx);
          
          // Verify exactly the valid responses are included
          expect(result.validResponses.length).toBe(numValid);
          
          // Verify all valid models are present
          const validModels = validResponses.map(r => r.model);
          result.validResponses.forEach(response => {
            expect(validModels).toContain(response.model);
          });
          
          // Verify no invalid models are present
          const invalidModels = invalidResponses.map(r => r.model);
          result.validResponses.forEach(response => {
            expect(invalidModels).not.toContain(response.model);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
