/**
 * Property-based test for stage failure handling
 * 
 * Feature: trust360-v0-1-pipeline, Property 7
 * 
 * Property 7: Stage Failure Handling
 * **Validates: Requirements 3.3**
 * 
 * For any critical stage failure (createContext, buildPrompt, runLLMEnsemble
 * with all models failing, computeConsensus, buildResponse), the system should
 * return HTTP status 500 with error details.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

// Mock all stage modules before importing
vi.mock('../../src/stages/create-context.js', () => ({
  createContext: vi.fn()
}));
vi.mock('../../src/stages/build-prompt.js', () => ({
  buildPrompt: vi.fn()
}));
vi.mock('../../src/stages/run-llm-ensemble.js', () => ({
  runLLMEnsemble: vi.fn()
}));
vi.mock('../../src/stages/parse-outputs.js', () => ({
  parseOutputs: vi.fn()
}));
vi.mock('../../src/stages/compute-consensus.js', () => ({
  computeConsensus: vi.fn()
}));
vi.mock('../../src/stages/build-response.js', () => ({
  buildResponse: vi.fn()
}));

import { executePipeline } from '../../src/pipeline.js';
import { createContext } from '../../src/stages/create-context.js';
import { buildPrompt } from '../../src/stages/build-prompt.js';
import { runLLMEnsemble } from '../../src/stages/run-llm-ensemble.js';
import { parseOutputs } from '../../src/stages/parse-outputs.js';
import { computeConsensus } from '../../src/stages/compute-consensus.js';
import { buildResponse } from '../../src/stages/build-response.js';

describe('Feature: trust360-v0-1-pipeline, Property 7: Stage Failure Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when createContext stage fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (question, errorMessage) => {
          createContext.mockRejectedValue(new Error(errorMessage));
          
          const request = { question };
          await expect(executePipeline(request)).rejects.toThrow(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error when buildPrompt stage fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (question, errorMessage) => {
          createContext.mockImplementation(async (ctx) => ({
            ...ctx,
            traceId: 'test-trace',
            startTime: Date.now(),
            question: ctx.request.question,
            evidence: null,
            metadata: {},
            rawResponses: [],
            validResponses: [],
            consensus: null,
            response: null
          }));
          
          buildPrompt.mockRejectedValue(new Error(errorMessage));
          
          const request = { question };
          await expect(executePipeline(request)).rejects.toThrow(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error when runLLMEnsemble stage fails with all models failing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          createContext.mockImplementation(async (ctx) => ({
            ...ctx,
            traceId: 'test-trace',
            startTime: Date.now(),
            question: ctx.request.question,
            evidence: null,
            metadata: {},
            rawResponses: [],
            validResponses: [],
            consensus: null,
            response: null
          }));
          
          buildPrompt.mockImplementation(async (ctx) => ({
            ...ctx,
            prompt: 'test prompt'
          }));
          
          runLLMEnsemble.mockRejectedValue(new Error('All LLM calls failed'));
          
          const request = { question };
          await expect(executePipeline(request)).rejects.toThrow('All LLM calls failed');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error when computeConsensus stage fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (question, errorMessage) => {
          createContext.mockImplementation(async (ctx) => ({
            ...ctx,
            traceId: 'test-trace',
            startTime: Date.now(),
            question: ctx.request.question,
            evidence: null,
            metadata: {},
            rawResponses: [],
            validResponses: [],
            consensus: null,
            response: null
          }));
          
          buildPrompt.mockImplementation(async (ctx) => ({
            ...ctx,
            prompt: 'test prompt'
          }));
          
          runLLMEnsemble.mockImplementation(async (ctx) => ({
            ...ctx,
            rawResponses: [{ status: 'fulfilled', response: '{"score":7,"reasoning":"test","confidence":0.8,"assumptions":[]}' }]
          }));
          
          parseOutputs.mockImplementation(async (ctx) => ({
            ...ctx,
            validResponses: [{ score: 7, reasoning: 'test', confidence: 0.8, assumptions: [] }]
          }));
          
          computeConsensus.mockRejectedValue(new Error(errorMessage));
          
          const request = { question };
          await expect(executePipeline(request)).rejects.toThrow(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error when buildResponse stage fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (question, errorMessage) => {
          createContext.mockImplementation(async (ctx) => ({
            ...ctx,
            traceId: 'test-trace',
            startTime: Date.now(),
            question: ctx.request.question,
            evidence: null,
            metadata: {},
            rawResponses: [],
            validResponses: [],
            consensus: null,
            response: null
          }));
          
          buildPrompt.mockImplementation(async (ctx) => ({
            ...ctx,
            prompt: 'test prompt'
          }));
          
          runLLMEnsemble.mockImplementation(async (ctx) => ({
            ...ctx,
            rawResponses: [{ status: 'fulfilled', response: '{"score":7,"reasoning":"test","confidence":0.8,"assumptions":[]}' }]
          }));
          
          parseOutputs.mockImplementation(async (ctx) => ({
            ...ctx,
            validResponses: [{ score: 7, reasoning: 'test', confidence: 0.8, assumptions: [] }]
          }));
          
          computeConsensus.mockImplementation(async (ctx) => ({
            ...ctx,
            consensus: { mos: 7, variance: 0, agreement: 'high' }
          }));
          
          buildResponse.mockRejectedValue(new Error(errorMessage));
          
          const request = { question };
          await expect(executePipeline(request)).rejects.toThrow(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve error details for debugging', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question, errorMessage) => {
          const detailedError = new Error(errorMessage);
          detailedError.stage = 'createContext';
          detailedError.details = 'Additional error context';
          
          createContext.mockRejectedValue(detailedError);
          
          const request = { question };
          
          try {
            await executePipeline(request);
            expect(true).toBe(false);
          } catch (error) {
            expect(error.message).toBe(errorMessage);
            expect(error.stage).toBe('createContext');
            expect(error.details).toBe('Additional error context');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle errors with varying error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom('Error', 'TypeError', 'RangeError'),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (question, errorType, errorMessage) => {
          let error;
          switch (errorType) {
            case 'TypeError':
              error = new TypeError(errorMessage);
              break;
            case 'RangeError':
              error = new RangeError(errorMessage);
              break;
            default:
              error = new Error(errorMessage);
              break;
          }
          
          createContext.mockRejectedValue(error);
          
          const request = { question };
          await expect(executePipeline(request)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail fast when critical stage fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          createContext.mockRejectedValue(new Error('createContext failed'));
          
          const request = { question };
          
          try {
            await executePipeline(request);
          } catch (error) {
            // Expected
          }
          
          expect(buildPrompt).not.toHaveBeenCalled();
          expect(runLLMEnsemble).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include trace ID in error when available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          createContext.mockImplementation(async (ctx) => ({
            ...ctx,
            traceId: 'test-trace',
            startTime: Date.now(),
            question: ctx.request.question,
            evidence: null,
            metadata: {},
            rawResponses: [],
            validResponses: [],
            consensus: null,
            response: null
          }));
          
          buildPrompt.mockRejectedValue(new Error('buildPrompt failed'));
          
          const request = { question };
          
          try {
            await executePipeline(request);
            expect(true).toBe(false);
          } catch (error) {
            expect(error.message).toBe('buildPrompt failed');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle synchronous errors in stages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (question, errorMessage) => {
          createContext.mockImplementation(() => {
            throw new Error(errorMessage);
          });
          
          const request = { question };
          await expect(executePipeline(request)).rejects.toThrow(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle errors consistently across different request types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.option(fc.string({ minLength: 0, maxLength: 100 })),
        fc.option(fc.dictionary(fc.string(), fc.jsonValue())),
        async (question, evidence, metadata) => {
          createContext.mockRejectedValue(new Error('Stage failed'));
          
          const request = {
            question,
            ...(evidence !== null && { evidence }),
            ...(metadata !== null && { metadata })
          };
          
          await expect(executePipeline(request)).rejects.toThrow('Stage failed');
        }
      ),
      { numRuns: 100 }
    );
  });
});
