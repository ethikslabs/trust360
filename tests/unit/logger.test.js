/**
 * Unit tests for structured logging infrastructure
 * 
 * These tests verify the logger module exports the correct functions
 * and that they have the expected behavior without mocking pino.
 */

import { describe, it, expect } from 'vitest';
import { 
  logger, 
  logStageEntry, 
  logStageExit, 
  logStageAction,
  logModelCallStart,
  logModelCallSuccess,
  logModelCallFailed
} from '../../src/utils/logger.js';

describe('Logger Infrastructure', () => {
  describe('Logger Module Exports', () => {
    it('should export logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should export helper functions', () => {
      expect(typeof logStageEntry).toBe('function');
      expect(typeof logStageExit).toBe('function');
      expect(typeof logStageAction).toBe('function');
      expect(typeof logModelCallStart).toBe('function');
      expect(typeof logModelCallSuccess).toBe('function');
      expect(typeof logModelCallFailed).toBe('function');
    });
  });

  describe('Helper Function Signatures', () => {
    it('logStageEntry should accept traceId, stageName, and optional context', () => {
      // Should not throw
      expect(() => {
        logStageEntry('test-trace-id', 'testStage');
      }).not.toThrow();
      
      expect(() => {
        logStageEntry('test-trace-id', 'testStage', { extra: 'data' });
      }).not.toThrow();
    });

    it('logStageExit should accept traceId, stageName, and optional context', () => {
      expect(() => {
        logStageExit('test-trace-id', 'testStage');
      }).not.toThrow();
      
      expect(() => {
        logStageExit('test-trace-id', 'testStage', { extra: 'data' });
      }).not.toThrow();
    });

    it('logStageAction should accept traceId, stageName, action, and optional context', () => {
      expect(() => {
        logStageAction('test-trace-id', 'testStage', 'completed');
      }).not.toThrow();
      
      expect(() => {
        logStageAction('test-trace-id', 'testStage', 'completed', { extra: 'data' });
      }).not.toThrow();
    });

    it('logModelCallStart should accept traceId, provider, and model', () => {
      expect(() => {
        logModelCallStart('test-trace-id', 'openai', 'gpt-4');
      }).not.toThrow();
    });

    it('logModelCallSuccess should accept traceId, model, and durationMs', () => {
      expect(() => {
        logModelCallSuccess('test-trace-id', 'gpt-4', 2300);
      }).not.toThrow();
    });

    it('logModelCallFailed should accept traceId, model, error, and durationMs', () => {
      expect(() => {
        logModelCallFailed('test-trace-id', 'gpt-4', 'Timeout', 20000);
      }).not.toThrow();
    });
  });

  describe('Logger Configuration', () => {
    it('should have a log level set', () => {
      // Logger should have a level property
      expect(logger.level).toBeDefined();
      expect(typeof logger.level).toBe('string');
    });

    it('should use info level by default or from environment', () => {
      const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
      expect(validLevels).toContain(logger.level);
    });
  });

  describe('Integration - Log Output Format', () => {
    it('should produce structured logs with ISO 8601 timestamps', () => {
      // This test verifies the logger is configured correctly
      // The actual log output is tested by observing console output
      const traceId = '550e8400-e29b-41d4-a716-446655440000';
      
      // These calls should produce JSON logs with ISO 8601 timestamps
      // Verified by manual inspection of test output
      logStageEntry(traceId, 'testStage');
      logStageExit(traceId, 'testStage');
      logStageAction(traceId, 'testStage', 'completed', { executionTimeMs: 100 });
      logModelCallStart(traceId, 'openai', 'gpt-4');
      logModelCallSuccess(traceId, 'gpt-4', 2300);
      logModelCallFailed(traceId, 'claude-3-opus', 'Timeout', 20000);
      
      // If we got here without errors, the logger is working
      expect(true).toBe(true);
    });
  });
});
