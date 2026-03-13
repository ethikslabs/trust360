/**
 * Unit tests for createContext stage
 * 
 * Tests the initialization of the Context_Object with request data,
 * trace ID generation, and proper field initialization.
 */

import { describe, it, expect } from 'vitest';
import { createContext } from '../../src/stages/create-context.js';

describe('createContext stage', () => {
  it('should initialize Context_Object with all required fields', async () => {
    const input = {
      request: {
        question: 'Is this claim trustworthy?',
        evidence: 'Supporting evidence here',
        metadata: { source: 'test' }
      }
    };

    const result = await createContext(input);

    // Verify all fields are present
    expect(result.traceId).toBeDefined();
    expect(result.startTime).toBeDefined();
    expect(result.question).toBe('Is this claim trustworthy?');
    expect(result.evidence).toBe('Supporting evidence here');
    expect(result.metadata).toEqual({ source: 'test' });
    expect(result.rawResponses).toEqual([]);
    expect(result.validResponses).toEqual([]);
    expect(result.consensus).toBeNull();
    expect(result.response).toBeNull();
  });

  it('should generate a valid UUID v4 trace ID', async () => {
    const input = {
      request: {
        question: 'Test question'
      }
    };

    const result = await createContext(input);

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(result.traceId).toMatch(uuidV4Regex);
  });

  it('should set evidence to null when not provided', async () => {
    const input = {
      request: {
        question: 'Test question'
      }
    };

    const result = await createContext(input);

    expect(result.evidence).toBeNull();
  });

  it('should set metadata to empty object when not provided', async () => {
    const input = {
      request: {
        question: 'Test question'
      }
    };

    const result = await createContext(input);

    expect(result.metadata).toEqual({});
  });

  it('should capture startTime as a timestamp', async () => {
    const before = Date.now();
    
    const input = {
      request: {
        question: 'Test question'
      }
    };

    const result = await createContext(input);
    
    const after = Date.now();

    expect(result.startTime).toBeGreaterThanOrEqual(before);
    expect(result.startTime).toBeLessThanOrEqual(after);
  });

  it('should preserve the original request in the context', async () => {
    const input = {
      request: {
        question: 'Test question',
        evidence: 'Test evidence',
        metadata: { key: 'value' }
      }
    };

    const result = await createContext(input);

    expect(result.request).toEqual(input.request);
  });

  it('should generate unique trace IDs for different requests', async () => {
    const input1 = { request: { question: 'Question 1' } };
    const input2 = { request: { question: 'Question 2' } };

    const result1 = await createContext(input1);
    const result2 = await createContext(input2);

    expect(result1.traceId).not.toBe(result2.traceId);
  });
});
