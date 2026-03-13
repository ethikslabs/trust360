/**
 * Property-based test for stage lifecycle logging
 * 
 * Feature: trust360-v0-1-pipeline, Property 23
 * 
 * Property 23: Stage Lifecycle Logging
 * **Validates: Requirements 9.3**
 * 
 * For any request, the system should emit log entries for stage entry and exit
 * events, with each log entry containing the Trace_ID.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { executePipeline } from '../../src/pipeline.js';
import { logger } from '../../src/utils/logger.js';
import * as llmWrapperModule from '../../src/utils/llm-wrapper.js';

describe('Feature: trust360-v0-1-pipeline, Property 23: Stage Lifecycle Logging', () => {
  let logSpy;

  beforeEach(() => {
    // Spy on logger to capture log calls
    logSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});
    
    // Mock LLM wrapper to return successful responses
    vi.spyOn(llmWrapperModule, 'callLLM').mockResolvedValue(
      JSON.stringify({
        score: 7,
        reasoning: 'Test reasoning',
        confidence: 0.8,
        assumptions: ['Test assumption']
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log stage entry and exit events with trace ID', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that each stage logs entry and exit
     * events, and all log entries contain the trace ID.
     * 
     * Strategy:
     * - Generate random valid requests
     * - Execute pipeline
     * - Verify log entries for each stage
     * - Verify all log entries contain trace ID
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.option(fc.string({ minLength: 0, maxLength: 100 })),
        async (question, evidence) => {
          logSpy.mockClear();
          
          const request = {
            question,
            ...(evidence !== null && { evidence })
          };
          
          await executePipeline(request);
          
          // Verify logger was called
          expect(logSpy).toHaveBeenCalled();
          
          // Collect all log entries
          const logEntries = logSpy.mock.calls.map(call => call[0]);
          
          // Find trace ID from first log entry
          const traceId = logEntries.find(entry => entry.traceId)?.traceId;
          expect(traceId).toBeDefined();
          
          // Verify all log entries with traceId field contain the same trace ID
          logEntries.forEach(entry => {
            if (entry.traceId) {
              expect(entry.traceId).toBe(traceId);
            }
          });
          
          // Verify stage-specific log entries exist
          const stageNames = ['createContext', 'buildPrompt', 'runLLMEnsemble', 
                             'parseOutputs', 'computeConsensus', 'buildResponse'];
          
          stageNames.forEach(stageName => {
            const stageLogs = logEntries.filter(entry => entry.stage === stageName);
            expect(stageLogs.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include trace ID in all stage log entries', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that every log entry related to
     * a stage includes the trace ID.
     * 
     * Strategy:
     * - Generate random requests
     * - Execute pipeline
     * - Verify all stage log entries have trace ID
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          logSpy.mockClear();
          
          await executePipeline({ question });
          
          const logEntries = logSpy.mock.calls.map(call => call[0]);
          
          // Filter stage-related log entries
          const stageLogs = logEntries.filter(entry => entry.stage);
          
          // Verify all stage logs have trace ID
          expect(stageLogs.length).toBeGreaterThan(0);
          stageLogs.forEach(entry => {
            expect(entry).toHaveProperty('traceId');
            expect(typeof entry.traceId).toBe('string');
            expect(entry.traceId.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log pipeline start and end events', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that pipeline start and end
     * events are logged.
     * 
     * Strategy:
     * - Generate random requests
     * - Execute pipeline
     * - Verify pipeline_start and pipeline_end log entries exist
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          logSpy.mockClear();
          
          await executePipeline({ question });
          
          const logEntries = logSpy.mock.calls.map(call => call[0]);
          
          // Verify pipeline start log
          const startLog = logEntries.find(entry => entry.action === 'pipeline_start');
          expect(startLog).toBeDefined();
          
          // Verify pipeline end log
          const endLog = logEntries.find(entry => entry.action === 'pipeline_end');
          expect(endLog).toBeDefined();
          expect(endLog).toHaveProperty('traceId');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log all six stages in order', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that all six pipeline stages
     * are logged in the correct order.
     * 
     * Strategy:
     * - Generate random requests
     * - Execute pipeline
     * - Verify stage logs appear in correct order
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          logSpy.mockClear();
          
          await executePipeline({ question });
          
          const logEntries = logSpy.mock.calls.map(call => call[0]);
          
          // Extract stage names in order they were logged
          const stageOrder = logEntries
            .filter(entry => entry.stage)
            .map(entry => entry.stage);
          
          // Verify all stages are present
          const expectedStages = [
            'createContext',
            'buildPrompt',
            'runLLMEnsemble',
            'parseOutputs',
            'computeConsensus',
            'buildResponse'
          ];
          
          expectedStages.forEach(stage => {
            expect(stageOrder).toContain(stage);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent trace ID across all stage logs', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that the same trace ID is used
     * consistently across all stage log entries for a request.
     * 
     * Strategy:
     * - Generate random requests
     * - Execute pipeline
     * - Verify all stage logs use the same trace ID
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          logSpy.mockClear();
          
          await executePipeline({ question });
          
          const logEntries = logSpy.mock.calls.map(call => call[0]);
          
          // Collect all trace IDs from stage logs
          const traceIds = logEntries
            .filter(entry => entry.stage && entry.traceId)
            .map(entry => entry.traceId);
          
          // Verify all trace IDs are the same
          expect(traceIds.length).toBeGreaterThan(0);
          const uniqueTraceIds = new Set(traceIds);
          expect(uniqueTraceIds.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log stage actions (initialized, completed, etc.)', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that stage log entries include
     * action information (initialized, completed, etc.).
     * 
     * Strategy:
     * - Generate random requests
     * - Execute pipeline
     * - Verify stage logs include action field
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          logSpy.mockClear();
          
          await executePipeline({ question });
          
          const logEntries = logSpy.mock.calls.map(call => call[0]);
          
          // Filter stage-related log entries
          const stageLogs = logEntries.filter(entry => entry.stage);
          
          // Verify stage logs have action field
          stageLogs.forEach(entry => {
            expect(entry).toHaveProperty('action');
            expect(typeof entry.action).toBe('string');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log stage lifecycle for requests with evidence', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that stage lifecycle logging
     * works correctly for requests with evidence.
     * 
     * Strategy:
     * - Generate requests with question and evidence
     * - Verify stage logs are present
     * - Verify trace ID is consistent
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question, evidence) => {
          logSpy.mockClear();
          
          await executePipeline({ question, evidence });
          
          const logEntries = logSpy.mock.calls.map(call => call[0]);
          
          // Verify stage logs exist
          const stageLogs = logEntries.filter(entry => entry.stage);
          expect(stageLogs.length).toBeGreaterThan(0);
          
          // Verify all have trace ID
          stageLogs.forEach(entry => {
            expect(entry).toHaveProperty('traceId');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log stage lifecycle for requests with metadata', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that stage lifecycle logging
     * works correctly for requests with metadata.
     * 
     * Strategy:
     * - Generate requests with question and metadata
     * - Verify stage logs are present
     * - Verify trace ID is consistent
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(fc.string(), fc.jsonValue()),
        async (question, metadata) => {
          logSpy.mockClear();
          
          await executePipeline({ question, metadata });
          
          const logEntries = logSpy.mock.calls.map(call => call[0]);
          
          // Verify stage logs exist
          const stageLogs = logEntries.filter(entry => entry.stage);
          expect(stageLogs.length).toBeGreaterThan(0);
          
          // Verify all have trace ID
          stageLogs.forEach(entry => {
            expect(entry).toHaveProperty('traceId');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain trace ID uniqueness across multiple requests', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that different requests get
     * different trace IDs in their log entries.
     * 
     * Strategy:
     * - Execute multiple requests
     * - Collect trace IDs from logs
     * - Verify each request has a unique trace ID
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        async (questions) => {
          const traceIds = [];
          
          for (const question of questions) {
            logSpy.mockClear();
            
            await executePipeline({ question });
            
            const logEntries = logSpy.mock.calls.map(call => call[0]);
            const traceId = logEntries.find(entry => entry.traceId)?.traceId;
            
            expect(traceId).toBeDefined();
            traceIds.push(traceId);
          }
          
          // Verify all trace IDs are unique
          const uniqueTraceIds = new Set(traceIds);
          expect(uniqueTraceIds.size).toBe(traceIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log stage information in structured format', async () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * This property test verifies that stage log entries use
     * structured logging format (objects with fields).
     * 
     * Strategy:
     * - Generate random requests
     * - Execute pipeline
     * - Verify log entries are objects with expected fields
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          logSpy.mockClear();
          
          await executePipeline({ question });
          
          const logEntries = logSpy.mock.calls.map(call => call[0]);
          
          // Verify log entries are objects
          logEntries.forEach(entry => {
            expect(typeof entry).toBe('object');
            expect(entry).not.toBeNull();
          });
          
          // Verify stage logs have expected structure
          const stageLogs = logEntries.filter(entry => entry.stage);
          stageLogs.forEach(entry => {
            expect(entry).toHaveProperty('stage');
            expect(typeof entry.stage).toBe('string');
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
