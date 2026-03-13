/**
 * Unit tests for Stage 3: runLLMEnsemble
 * 
 * Tests parallel model execution, error handling, and rawResponses structure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runLLMEnsemble } from '../../src/stages/run-llm-ensemble.js';

// Mock dependencies
vi.mock('../../src/utils/llm-wrapper.js', () => ({
  callLLM: vi.fn()
}));

vi.mock('../../src/config/models.js', () => ({
  MODEL_CONFIG: [
    { provider: 'openai', model: 'gpt-4', timeout: 20000 },
    { provider: 'openai', model: 'gpt-3.5-turbo', timeout: 20000 },
    { provider: 'anthropic', model: 'claude-3-opus-20240229', timeout: 20000 }
  ]
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

import { callLLM } from '../../src/utils/llm-wrapper.js';
import { logger } from '../../src/utils/logger.js';

describe('runLLMEnsemble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute all models in parallel and return rawResponses', async () => {
    // Arrange
    const ctx = {
      traceId: 'test-trace-id',
      prompt: 'Test prompt'
    };

    // Mock successful responses from all models
    callLLM
      .mockResolvedValueOnce('{"score": 8, "reasoning": "Good", "confidence": 0.9, "assumptions": []}')
      .mockResolvedValueOnce('{"score": 7, "reasoning": "Decent", "confidence": 0.8, "assumptions": []}')
      .mockResolvedValueOnce('{"score": 9, "reasoning": "Excellent", "confidence": 0.95, "assumptions": []}');

    // Act
    const result = await runLLMEnsemble(ctx);

    // Assert
    expect(result.rawResponses).toHaveLength(3);
    expect(result.rawResponses[0]).toEqual({
      model: 'gpt-4',
      status: 'fulfilled',
      response: '{"score": 8, "reasoning": "Good", "confidence": 0.9, "assumptions": []}',
      error: null
    });
    expect(result.rawResponses[1]).toEqual({
      model: 'gpt-3.5-turbo',
      status: 'fulfilled',
      response: '{"score": 7, "reasoning": "Decent", "confidence": 0.8, "assumptions": []}',
      error: null
    });
    expect(result.rawResponses[2]).toEqual({
      model: 'claude-3-opus-20240229',
      status: 'fulfilled',
      response: '{"score": 9, "reasoning": "Excellent", "confidence": 0.95, "assumptions": []}',
      error: null
    });

    // Verify logging
    expect(logger.info).toHaveBeenCalledWith({
      traceId: 'test-trace-id',
      stage: 'runLLMEnsemble',
      action: 'completed',
      successCount: 3,
      failedCount: 0,
      totalModels: 3
    });
  });

  it('should handle partial success when some models fail', async () => {
    // Arrange
    const ctx = {
      traceId: 'test-trace-id',
      prompt: 'Test prompt'
    };

    // Mock mixed success/failure
    callLLM
      .mockResolvedValueOnce('{"score": 8, "reasoning": "Good", "confidence": 0.9, "assumptions": []}')
      .mockRejectedValueOnce(new Error('Timeout after 20000ms'))
      .mockResolvedValueOnce('{"score": 9, "reasoning": "Excellent", "confidence": 0.95, "assumptions": []}');

    // Act
    const result = await runLLMEnsemble(ctx);

    // Assert
    expect(result.rawResponses).toHaveLength(3);
    expect(result.rawResponses[0].status).toBe('fulfilled');
    expect(result.rawResponses[1]).toEqual({
      model: 'gpt-3.5-turbo',
      status: 'rejected',
      response: null,
      error: 'Timeout after 20000ms'
    });
    expect(result.rawResponses[2].status).toBe('fulfilled');

    // Verify logging shows partial success
    expect(logger.info).toHaveBeenCalledWith({
      traceId: 'test-trace-id',
      stage: 'runLLMEnsemble',
      action: 'completed',
      successCount: 2,
      failedCount: 1,
      totalModels: 3
    });
  });

  it('should throw error when all models fail', async () => {
    // Arrange
    const ctx = {
      traceId: 'test-trace-id',
      prompt: 'Test prompt'
    };

    // Mock all failures
    callLLM
      .mockRejectedValueOnce(new Error('API error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockRejectedValueOnce(new Error('Network error'));

    // Act & Assert
    await expect(runLLMEnsemble(ctx)).rejects.toThrow('All LLM calls failed');

    // Verify error logging
    expect(logger.error).toHaveBeenCalledWith({
      traceId: 'test-trace-id',
      stage: 'runLLMEnsemble',
      error: 'All models failed',
      failedCount: 3,
      totalModels: 3
    });
  });

  it('should preserve context and add rawResponses', async () => {
    // Arrange
    const ctx = {
      traceId: 'test-trace-id',
      prompt: 'Test prompt',
      question: 'Is this true?',
      evidence: 'Some evidence',
      metadata: { source: 'test' }
    };

    // Mock successful response
    callLLM.mockResolvedValue('{"score": 8, "reasoning": "Good", "confidence": 0.9, "assumptions": []}');

    // Act
    const result = await runLLMEnsemble(ctx);

    // Assert - verify context is preserved
    expect(result.traceId).toBe('test-trace-id');
    expect(result.prompt).toBe('Test prompt');
    expect(result.question).toBe('Is this true?');
    expect(result.evidence).toBe('Some evidence');
    expect(result.metadata).toEqual({ source: 'test' });
    expect(result.rawResponses).toBeDefined();
  });

  it('should call callLLM with correct parameters for each model', async () => {
    // Arrange
    const ctx = {
      traceId: 'test-trace-id',
      prompt: 'Test prompt'
    };

    callLLM.mockResolvedValue('{"score": 8, "reasoning": "Good", "confidence": 0.9, "assumptions": []}');

    // Act
    await runLLMEnsemble(ctx);

    // Assert - verify callLLM was called correctly for each model
    expect(callLLM).toHaveBeenCalledTimes(3);
    expect(callLLM).toHaveBeenNthCalledWith(
      1,
      { provider: 'openai', model: 'gpt-4', timeout: 20000 },
      'Test prompt',
      'test-trace-id'
    );
    expect(callLLM).toHaveBeenNthCalledWith(
      2,
      { provider: 'openai', model: 'gpt-3.5-turbo', timeout: 20000 },
      'Test prompt',
      'test-trace-id'
    );
    expect(callLLM).toHaveBeenNthCalledWith(
      3,
      { provider: 'anthropic', model: 'claude-3-opus-20240229', timeout: 20000 },
      'Test prompt',
      'test-trace-id'
    );
  });
});
