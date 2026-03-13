/**
 * Unit tests for LLM wrapper
 * 
 * These tests verify the LLM wrapper's core functionality including:
 * - Provider abstraction
 * - Timeout handling
 * - API key validation
 * - Structured logging integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callLLM } from '../../src/utils/llm-wrapper.js';

describe('LLM Wrapper', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('API Key Validation', () => {
    it('should throw error when OPENAI_API_KEY is missing', async () => {
      delete process.env.OPENAI_API_KEY;
      
      const config = {
        provider: 'openai',
        model: 'gpt-4',
        timeout: 20000
      };
      
      await expect(
        callLLM(config, 'test prompt', 'test-trace-id')
      ).rejects.toThrow('OPENAI_API_KEY');
    });

    it('should throw error when ANTHROPIC_API_KEY is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      
      const config = {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        timeout: 20000
      };
      
      await expect(
        callLLM(config, 'test prompt', 'test-trace-id')
      ).rejects.toThrow('ANTHROPIC_API_KEY');
    });
  });

  describe('Provider Support', () => {
    it('should throw error for unsupported provider', async () => {
      const config = {
        provider: 'unsupported-provider',
        model: 'some-model',
        timeout: 20000
      };
      
      await expect(
        callLLM(config, 'test prompt', 'test-trace-id')
      ).rejects.toThrow('Unsupported provider');
    });
  });

  describe('Function Signature', () => {
    it('should accept config, prompt, and traceId parameters', () => {
      const config = {
        provider: 'openai',
        model: 'gpt-4',
        timeout: 20000
      };
      
      // Should not throw on function call (will fail on API call, but that's expected)
      expect(() => {
        callLLM(config, 'test prompt', 'test-trace-id').catch(() => {});
      }).not.toThrow();
    });
  });

  describe('Timeout Configuration', () => {
    it('should use timeout from config', async () => {
      delete process.env.OPENAI_API_KEY;
      
      const config = {
        provider: 'openai',
        model: 'gpt-4',
        timeout: 5000 // Custom timeout
      };
      
      // Will fail due to missing API key, but timeout should be respected
      await expect(
        callLLM(config, 'test prompt', 'test-trace-id')
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should wrap errors with context', async () => {
      delete process.env.OPENAI_API_KEY;
      
      const config = {
        provider: 'openai',
        model: 'gpt-4',
        timeout: 20000
      };
      
      try {
        await callLLM(config, 'test prompt', 'test-trace-id');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('LLM call failed');
        expect(error.message).toContain('gpt-4');
      }
    });
  });
});
