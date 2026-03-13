/**
 * Unit tests for model configuration
 * 
 * Validates the MODEL_CONFIG structure and values.
 */

import { describe, it, expect } from 'vitest';
import { MODEL_CONFIG } from '../../src/config/models.js';

describe('Model Configuration', () => {
  it('should export MODEL_CONFIG array', () => {
    expect(MODEL_CONFIG).toBeDefined();
    expect(Array.isArray(MODEL_CONFIG)).toBe(true);
  });

  it('should contain exactly 3 models', () => {
    expect(MODEL_CONFIG).toHaveLength(3);
  });

  it('should include gpt-4 model', () => {
    const gpt4 = MODEL_CONFIG.find(m => m.model === 'gpt-4');
    expect(gpt4).toBeDefined();
    expect(gpt4.provider).toBe('openai');
    expect(gpt4.timeout).toBe(20000);
  });

  it('should include gpt-3.5-turbo model', () => {
    const gpt35 = MODEL_CONFIG.find(m => m.model === 'gpt-3.5-turbo');
    expect(gpt35).toBeDefined();
    expect(gpt35.provider).toBe('openai');
    expect(gpt35.timeout).toBe(20000);
  });

  it('should include claude-3-opus model', () => {
    const claude = MODEL_CONFIG.find(m => m.model === 'claude-3-opus-20240229');
    expect(claude).toBeDefined();
    expect(claude.provider).toBe('anthropic');
    expect(claude.timeout).toBe(20000);
  });

  it('should have 20-second timeout for all models', () => {
    MODEL_CONFIG.forEach(config => {
      expect(config.timeout).toBe(20000);
    });
  });

  it('should have valid provider for all models', () => {
    MODEL_CONFIG.forEach(config => {
      expect(['openai', 'anthropic']).toContain(config.provider);
    });
  });

  it('should have required fields for all models', () => {
    MODEL_CONFIG.forEach(config => {
      expect(config).toHaveProperty('provider');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('timeout');
      expect(typeof config.provider).toBe('string');
      expect(typeof config.model).toBe('string');
      expect(typeof config.timeout).toBe('number');
    });
  });
});
