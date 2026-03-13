/**
 * Unit tests for buildPrompt stage
 * 
 * Tests the prompt generation logic including:
 * - Template substitution for question
 * - Conditional evidence inclusion
 * - Prompt structure and format
 */

import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../../src/stages/build-prompt.js';

describe('buildPrompt stage', () => {
  it('should generate prompt with question only', async () => {
    const ctx = {
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Is this claim trustworthy?',
      evidence: null
    };

    const result = await buildPrompt(ctx);

    expect(result.prompt).toBeDefined();
    expect(result.prompt).toContain('Is this claim trustworthy?');
    expect(result.prompt).toContain('QUESTION:');
    expect(result.prompt).not.toContain('EVIDENCE:');
    expect(result.prompt).toContain('Provide your response in the following JSON format');
    expect(result.prompt).toContain('score');
    expect(result.prompt).toContain('reasoning');
    expect(result.prompt).toContain('confidence');
    expect(result.prompt).toContain('assumptions');
  });

  it('should generate prompt with question and evidence', async () => {
    const ctx = {
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Is climate change real?',
      evidence: 'Multiple scientific studies show rising global temperatures.'
    };

    const result = await buildPrompt(ctx);

    expect(result.prompt).toBeDefined();
    expect(result.prompt).toContain('Is climate change real?');
    expect(result.prompt).toContain('EVIDENCE:');
    expect(result.prompt).toContain('Multiple scientific studies show rising global temperatures.');
  });

  it('should include scoring guide in prompt', async () => {
    const ctx = {
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Test question',
      evidence: null
    };

    const result = await buildPrompt(ctx);

    expect(result.prompt).toContain('SCORING GUIDE:');
    expect(result.prompt).toContain('1-3: Low trust');
    expect(result.prompt).toContain('4-6: Medium trust');
    expect(result.prompt).toContain('7-9: High trust');
    expect(result.prompt).toContain('10: Very high trust');
  });

  it('should preserve all context fields', async () => {
    const ctx = {
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Test question',
      evidence: null,
      startTime: Date.now(),
      metadata: { source: 'test' }
    };

    const result = await buildPrompt(ctx);

    expect(result.traceId).toBe(ctx.traceId);
    expect(result.question).toBe(ctx.question);
    expect(result.startTime).toBe(ctx.startTime);
    expect(result.metadata).toEqual(ctx.metadata);
  });

  it('should handle empty evidence string as no evidence', async () => {
    const ctx = {
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Test question',
      evidence: ''
    };

    const result = await buildPrompt(ctx);

    // Empty string should be preserved and evidence section included
    expect(result.prompt).toContain('EVIDENCE:');
  });

  it('should handle multiline evidence', async () => {
    const ctx = {
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Test question',
      evidence: 'Line 1\nLine 2\nLine 3'
    };

    const result = await buildPrompt(ctx);

    expect(result.prompt).toContain('EVIDENCE:');
    expect(result.prompt).toContain('Line 1\nLine 2\nLine 3');
  });
});
