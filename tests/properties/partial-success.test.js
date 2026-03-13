/**
 * Property-based test for partial success handling
 * 
 * Feature: trust360-v0-1-pipeline, Property 13
 * 
 * Property 13: Partial Success Handling
 * **Validates: Requirements 5.3**
 * 
 * For any request where at least 1 model returns a valid response (even if
 * others fail), the pipeline should proceed to consensus computation and
 * return a response.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

// Mock the LLM provider modules BEFORE importing
vi.mock('openai', () => {
  const OpenAI = vi.fn();
  OpenAI.prototype.chat = {
    completions: {
      create: vi.fn()
    }
  };
  return { default: OpenAI };
});

vi.mock('@anthropic-ai/sdk', () => {
  const Anthropic = vi.fn();
  Anthropic.prototype.messages = {
    create: vi.fn()
  };
  return { default: Anthropic };
});

// Import after mocking
const { runLLMEnsemble } = await import('../../src/stages/run-llm-ensemble.js');
const { MODEL_CONFIG } = await import('../../src/config/models.js');

describe('Feature: trust360-v0-1-pipeline, Property 13: Partial Success Handling', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Set up environment with mock API keys
    process.env = { 
      ...originalEnv,
      OPENAI_API_KEY: 'test-key-openai',
      ANTHROPIC_API_KEY: 'test-key-anthropic'
    };
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should proceed with at least 1 valid response when other models fail', async () => {
    /**
     * **Validates: Requirements 5.3**
     * 
     * This property test verifies that the runLLMEnsemble stage continues
     * processing as long as at least one model succeeds, regardless of how
     * many other models fail.
     * 
     * Strategy:
     * - Generate random failure patterns where at least 1 model succeeds
     * - For each pattern, configure mocks so some models fail and at least 1 succeeds
     * - Verify the stage completes successfully and returns rawResponses
     * - Verify the successful response is included in rawResponses
     * - Test across 100 iterations with different failure patterns
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate a boolean array representing success/failure for each model
        // Constraint: at least one must be true (at least 1 success)
        fc.array(fc.boolean(), { 
          minLength: MODEL_CONFIG.length, 
          maxLength: MODEL_CONFIG.length 
        }).filter(arr => arr.some(v => v === true)),
        async (successPattern) => {
          // Get the mocked provider constructors
          const OpenAI = (await import('openai')).default;
          const Anthropic = (await import('@anthropic-ai/sdk')).default;
          
          // Create a valid model response
          const validResponse = JSON.stringify({
            score: 7,
            reasoning: 'Test reasoning for partial success',
            confidence: 0.8,
            assumptions: ['Test assumption']
          });
          
          // Set up OpenAI mock
          const openaiMockCreate = vi.fn();
          OpenAI.mockImplementation(() => ({
            chat: {
              completions: {
                create: openaiMockCreate
              }
            }
          }));
          
          // Set up Anthropic mock
          const anthropicMockCreate = vi.fn();
          Anthropic.mockImplementation(() => ({
            messages: {
              create: anthropicMockCreate
            }
          }));
          
          // Configure each model's mock based on the success pattern
          MODEL_CONFIG.forEach((config, index) => {
            const shouldSucceed = successPattern[index];
            
            if (config.provider === 'openai') {
              if (shouldSucceed) {
                openaiMockCreate.mockResolvedValueOnce({
                  choices: [
                    {
                      message: {
                        content: validResponse
                      }
                    }
                  ]
                });
              } else {
                openaiMockCreate.mockRejectedValueOnce(
                  new Error('Simulated OpenAI failure')
                );
              }
            } else if (config.provider === 'anthropic') {
              if (shouldSucceed) {
                anthropicMockCreate.mockResolvedValueOnce({
                  content: [
                    {
                      text: validResponse
                    }
                  ]
                });
              } else {
                anthropicMockCreate.mockRejectedValueOnce(
                  new Error('Simulated Anthropic failure')
                );
              }
            }
          });
          
          // Create test context
          const ctx = {
            traceId: 'test-trace-id',
            prompt: 'Test prompt for partial success'
          };
          
          // Execute the stage
          const result = await runLLMEnsemble(ctx);
          
          // Verify the stage completed successfully
          expect(result).toBeDefined();
          expect(result.rawResponses).toBeDefined();
          expect(Array.isArray(result.rawResponses)).toBe(true);
          
          // Verify we have responses for all models
          expect(result.rawResponses.length).toBe(MODEL_CONFIG.length);
          
          // Count successful and failed responses
          const successCount = result.rawResponses.filter(
            r => r.status === 'fulfilled'
          ).length;
          const failedCount = result.rawResponses.filter(
            r => r.status === 'rejected'
          ).length;
          
          // Verify at least one succeeded
          expect(successCount).toBeGreaterThanOrEqual(1);
          
          // Verify the success/failure counts match our pattern
          const expectedSuccessCount = successPattern.filter(v => v).length;
          const expectedFailedCount = successPattern.filter(v => !v).length;
          
          expect(successCount).toBe(expectedSuccessCount);
          expect(failedCount).toBe(expectedFailedCount);
          
          // Verify successful responses have the expected structure
          result.rawResponses.forEach((response, index) => {
            expect(response.model).toBe(MODEL_CONFIG[index].model);
            
            if (successPattern[index]) {
              expect(response.status).toBe('fulfilled');
              expect(response.response).toBe(validResponse);
              expect(response.error).toBeNull();
            } else {
              expect(response.status).toBe('rejected');
              expect(response.response).toBeNull();
              expect(response.error).toBeDefined();
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // 30 second timeout for the entire property test

  it('should fail when all models fail', async () => {
    /**
     * **Validates: Requirements 5.3**
     * 
     * This test verifies the inverse property: when NO models succeed,
     * the stage should throw an error. This ensures the "at least 1"
     * requirement is properly enforced.
     */
    
    // Get the mocked provider constructors
    const OpenAI = (await import('openai')).default;
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    
    // Set up all mocks to fail
    const openaiMockCreate = vi.fn().mockRejectedValue(
      new Error('Simulated OpenAI failure')
    );
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: openaiMockCreate
        }
      }
    }));
    
    const anthropicMockCreate = vi.fn().mockRejectedValue(
      new Error('Simulated Anthropic failure')
    );
    Anthropic.mockImplementation(() => ({
      messages: {
        create: anthropicMockCreate
      }
    }));
    
    // Create test context
    const ctx = {
      traceId: 'test-trace-id',
      prompt: 'Test prompt for all failures'
    };
    
    // Execute the stage and expect it to throw
    await expect(runLLMEnsemble(ctx)).rejects.toThrow('All LLM calls failed');
  });

  it('should handle mixed failure types with at least 1 success', async () => {
    /**
     * **Validates: Requirements 5.3**
     * 
     * This property test verifies that the stage handles various types of
     * failures (timeouts, errors, invalid responses) as long as at least
     * one model succeeds.
     * 
     * Strategy:
     * - Generate random failure types for failing models
     * - Ensure at least one model succeeds
     * - Verify the stage completes successfully
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate which model index will succeed (0 to MODEL_CONFIG.length - 1)
        fc.integer({ min: 0, max: MODEL_CONFIG.length - 1 }),
        // Generate failure types for other models
        fc.array(
          fc.constantFrom('timeout', 'error', 'network'),
          { minLength: MODEL_CONFIG.length - 1, maxLength: MODEL_CONFIG.length - 1 }
        ),
        async (successIndex, failureTypes) => {
          // Get the mocked provider constructors
          const OpenAI = (await import('openai')).default;
          const Anthropic = (await import('@anthropic-ai/sdk')).default;
          
          const validResponse = JSON.stringify({
            score: 8,
            reasoning: 'Test reasoning with mixed failures',
            confidence: 0.9,
            assumptions: ['Assumption 1', 'Assumption 2']
          });
          
          // Set up OpenAI mock
          const openaiMockCreate = vi.fn();
          OpenAI.mockImplementation(() => ({
            chat: {
              completions: {
                create: openaiMockCreate
              }
            }
          }));
          
          // Set up Anthropic mock
          const anthropicMockCreate = vi.fn();
          Anthropic.mockImplementation(() => ({
            messages: {
              create: anthropicMockCreate
            }
          }));
          
          // Configure each model's mock
          let failureIndex = 0;
          MODEL_CONFIG.forEach((config, index) => {
            const shouldSucceed = index === successIndex;
            
            if (config.provider === 'openai') {
              if (shouldSucceed) {
                openaiMockCreate.mockResolvedValueOnce({
                  choices: [
                    {
                      message: {
                        content: validResponse
                      }
                    }
                  ]
                });
              } else {
                const failureType = failureTypes[failureIndex++];
                let error;
                
                if (failureType === 'timeout') {
                  error = new Error('Request timeout');
                  error.name = 'AbortError';
                } else if (failureType === 'network') {
                  error = new Error('Network error');
                  error.code = 'ECONNREFUSED';
                } else {
                  error = new Error('API error');
                }
                
                openaiMockCreate.mockRejectedValueOnce(error);
              }
            } else if (config.provider === 'anthropic') {
              if (shouldSucceed) {
                anthropicMockCreate.mockResolvedValueOnce({
                  content: [
                    {
                      text: validResponse
                    }
                  ]
                });
              } else {
                const failureType = failureTypes[failureIndex++];
                let error;
                
                if (failureType === 'timeout') {
                  error = new Error('Request timeout');
                  error.name = 'AbortError';
                } else if (failureType === 'network') {
                  error = new Error('Network error');
                  error.code = 'ECONNREFUSED';
                } else {
                  error = new Error('API error');
                }
                
                anthropicMockCreate.mockRejectedValueOnce(error);
              }
            }
          });
          
          // Create test context
          const ctx = {
            traceId: 'test-trace-id-mixed',
            prompt: 'Test prompt for mixed failures'
          };
          
          // Execute the stage
          const result = await runLLMEnsemble(ctx);
          
          // Verify the stage completed successfully
          expect(result).toBeDefined();
          expect(result.rawResponses).toBeDefined();
          
          // Verify exactly one model succeeded
          const successCount = result.rawResponses.filter(
            r => r.status === 'fulfilled'
          ).length;
          expect(successCount).toBe(1);
          
          // Verify the successful response is at the expected index
          expect(result.rawResponses[successIndex].status).toBe('fulfilled');
          expect(result.rawResponses[successIndex].response).toBe(validResponse);
          
          // Verify all other responses failed
          result.rawResponses.forEach((response, index) => {
            if (index !== successIndex) {
              expect(response.status).toBe('rejected');
              expect(response.error).toBeDefined();
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // 30 second timeout for the entire property test
});
