/**
 * Property-based test for LLM timeout enforcement
 * 
 * Feature: trust360-v0-1-pipeline, Property 12
 * 
 * Property 12: Model Timeout Enforcement
 * **Validates: Requirements 5.2**
 * 
 * For any model invocation that exceeds 20 seconds, the LLM_Wrapper should
 * abort the call and treat it as a failure.
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
const { callLLM } = await import('../../src/utils/llm-wrapper.js');

describe('Feature: trust360-v0-1-pipeline, Property 12: Model Timeout Enforcement', () => {
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

  it('should abort OpenAI calls that exceed the configured timeout', async () => {
    /**
     * **Validates: Requirements 5.2**
     * 
     * This property test verifies that the LLM wrapper enforces timeout
     * by testing with various timeout values and simulated delays.
     * 
     * Strategy:
     * - Generate random timeout values (100-1000ms for fast testing)
     * - Mock the provider to delay longer than the timeout AND respect abort signal
     * - Verify the call is aborted and fails within the timeout window
     * - Test across 100 iterations with different timeout values
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate random timeout values between 100ms and 1000ms
        fc.integer({ min: 100, max: 1000 }),
        async (timeout) => {
          // Get the mocked OpenAI constructor
          const OpenAI = (await import('openai')).default;
          
          // Mock the create method to simulate a slow response that respects abort signal
          const mockCreate = vi.fn().mockImplementation(async (params, options) => {
            const signal = options?.signal;
            
            // Create a promise that will be rejected if aborted
            return new Promise((resolve, reject) => {
              // Set up abort handler
              if (signal) {
                signal.addEventListener('abort', () => {
                  const error = new Error('Request aborted');
                  error.name = 'AbortError';
                  reject(error);
                });
              }
              
              // Simulate a delay longer than the timeout
              setTimeout(() => {
                resolve({
                  choices: [
                    {
                      message: {
                        content: JSON.stringify({
                          score: 7,
                          reasoning: 'Test reasoning',
                          confidence: 0.8,
                          assumptions: ['Test assumption']
                        })
                      }
                    }
                  ]
                });
              }, timeout + 500);
            });
          });
          
          // Set up the mock
          OpenAI.mockImplementation(() => ({
            chat: {
              completions: {
                create: mockCreate
              }
            }
          }));
          
          const config = {
            provider: 'openai',
            model: 'gpt-4',
            timeout
          };
          
          const startTime = Date.now();
          
          try {
            await callLLM(config, 'test prompt', 'test-trace-id');
            // If we get here, the timeout didn't work
            throw new Error('Call should have timed out but did not');
          } catch (error) {
            const duration = Date.now() - startTime;
            
            // Verify the call failed with appropriate error message
            expect(error.message).toContain('LLM call failed');
            
            // Verify the call was aborted within a reasonable time
            // Allow some buffer for execution overhead (timeout + 300ms)
            expect(duration).toBeLessThan(timeout + 300);
            
            // Verify the call was not completed too early (should wait for timeout)
            expect(duration).toBeGreaterThanOrEqual(timeout - 50);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 30000); // 30 second timeout for the entire property test

  it('should abort Anthropic calls that exceed the configured timeout', async () => {
    /**
     * **Validates: Requirements 5.2**
     * 
     * This property test verifies timeout enforcement for Anthropic provider.
     * Tests the same timeout property across a different provider to ensure
     * the timeout mechanism is provider-agnostic.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 1000 }),
        async (timeout) => {
          // Get the mocked Anthropic constructor
          const Anthropic = (await import('@anthropic-ai/sdk')).default;
          
          // Mock the create method to simulate a slow response that respects abort signal
          const mockCreate = vi.fn().mockImplementation(async (params, options) => {
            const signal = options?.signal;
            
            return new Promise((resolve, reject) => {
              // Set up abort handler
              if (signal) {
                signal.addEventListener('abort', () => {
                  const error = new Error('Request aborted');
                  error.name = 'AbortError';
                  reject(error);
                });
              }
              
              // Simulate a delay longer than the timeout
              setTimeout(() => {
                resolve({
                  content: [
                    {
                      text: JSON.stringify({
                        score: 7,
                        reasoning: 'Test reasoning',
                        confidence: 0.8,
                        assumptions: ['Test assumption']
                      })
                    }
                  ]
                });
              }, timeout + 500);
            });
          });
          
          // Set up the mock
          Anthropic.mockImplementation(() => ({
            messages: {
              create: mockCreate
            }
          }));
          
          const config = {
            provider: 'anthropic',
            model: 'claude-3-opus',
            timeout
          };
          
          const startTime = Date.now();
          
          try {
            await callLLM(config, 'test prompt', 'test-trace-id');
            throw new Error('Call should have timed out but did not');
          } catch (error) {
            const duration = Date.now() - startTime;
            
            expect(error.message).toContain('LLM call failed');
            expect(duration).toBeLessThan(timeout + 300);
            expect(duration).toBeGreaterThanOrEqual(timeout - 50);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 30000); // 30 second timeout for the entire property test

  it('should enforce the 20-second production timeout specification', async () => {
    /**
     * **Validates: Requirements 5.2**
     * 
     * This test specifically validates the 20-second timeout requirement
     * from the design specification. Since we can't wait 20 seconds in tests,
     * we verify the timeout mechanism works correctly with a shorter timeout
     * that represents the same behavior.
     */
    
    // Use a shorter timeout for testing (500ms represents the 20s production timeout)
    const testTimeout = 500;
    
    // Get the mocked OpenAI constructor
    const OpenAI = (await import('openai')).default;
    
    const mockCreate = vi.fn().mockImplementation(async (params, options) => {
      const signal = options?.signal;
      
      return new Promise((resolve, reject) => {
        // Set up abort handler
        if (signal) {
          signal.addEventListener('abort', () => {
            const error = new Error('Request aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }
        
        // Simulate a delay that exceeds the timeout
        setTimeout(() => {
          resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    score: 7,
                    reasoning: 'Test reasoning',
                    confidence: 0.8,
                    assumptions: ['Test assumption']
                  })
                }
              }
            ]
          });
        }, testTimeout + 200);
      });
    });
    
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }));
    
    const config = {
      provider: 'openai',
      model: 'gpt-4',
      timeout: testTimeout
    };
    
    const startTime = Date.now();
    
    try {
      await callLLM(config, 'test prompt', 'test-trace-id');
      throw new Error('Call should have timed out');
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Verify timeout was enforced
      expect(error.message).toContain('LLM call failed');
      expect(error.message).toContain('Timeout');
      expect(duration).toBeLessThan(testTimeout + 300);
    }
  });

  it('should successfully complete calls that finish before timeout', async () => {
    /**
     * **Validates: Requirements 5.2**
     * 
     * This property test verifies that calls completing within the timeout
     * are not aborted. This ensures the timeout mechanism doesn't interfere
     * with successful calls.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 200, max: 1000 }),
        fc.integer({ min: 50, max: 150 }),
        async (timeout, responseDelay) => {
          // Ensure response delay is less than timeout
          const actualDelay = Math.min(responseDelay, timeout - 50);
          
          // Get the mocked OpenAI constructor
          const OpenAI = (await import('openai')).default;
          
          const mockCreate = vi.fn().mockImplementation(async (params, options) => {
            const signal = options?.signal;
            
            return new Promise((resolve, reject) => {
              // Set up abort handler
              if (signal) {
                signal.addEventListener('abort', () => {
                  const error = new Error('Request aborted');
                  error.name = 'AbortError';
                  reject(error);
                });
              }
              
              // Simulate a response that completes before timeout
              setTimeout(() => {
                resolve({
                  choices: [
                    {
                      message: {
                        content: JSON.stringify({
                          score: 7,
                          reasoning: 'Test reasoning',
                          confidence: 0.8,
                          assumptions: ['Test assumption']
                        })
                      }
                    }
                  ]
                });
              }, actualDelay);
            });
          });
          
          OpenAI.mockImplementation(() => ({
            chat: {
              completions: {
                create: mockCreate
              }
            }
          }));
          
          const config = {
            provider: 'openai',
            model: 'gpt-4',
            timeout
          };
          
          // This should succeed without timeout
          const result = await callLLM(config, 'test prompt', 'test-trace-id');
          
          // Verify we got a valid response
          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
        }
      ),
      { numRuns: 20 }
    );
  }, 30000); // 30 second timeout for the entire property test
});
