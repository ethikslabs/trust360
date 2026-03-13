/**
 * Property-based test for prompt template structure
 * 
 * Feature: trust360-v0-1-pipeline, Property 11
 * 
 * Property 11: Prompt Template Structure
 * **Validates: Requirements 4.4**
 * 
 * For any generated prompt, it should contain instructions for models to return
 * responses with score, reasoning, confidence, and assumptions fields.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { buildPrompt } from '../../src/stages/build-prompt.js';
import { logger } from '../../src/utils/logger.js';

describe('Feature: trust360-v0-1-pipeline, Property 11: Prompt Template Structure', () => {
  let logSpy;
  
  beforeEach(() => {
    // Spy on logger to avoid console output during tests
    logSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include instructions for all required response fields', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that every generated prompt contains
     * instructions for models to return responses with all four required
     * fields: score, reasoning, confidence, and assumptions.
     * 
     * Strategy:
     * - Generate random questions and evidence
     * - Build prompt
     * - Verify all four field names appear in the prompt
     * - Test across 100 iterations with various inputs
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.option(fc.string({ minLength: 1, maxLength: 500 })),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify all required field names are mentioned in prompt
          expect(result.prompt).toContain('score');
          expect(result.prompt).toContain('reasoning');
          expect(result.prompt).toContain('confidence');
          expect(result.prompt).toContain('assumptions');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include JSON format instructions', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that the prompt includes explicit
     * instructions for returning a JSON-formatted response.
     * 
     * Strategy:
     * - Generate various questions
     * - Build prompt
     * - Verify JSON format instructions are present
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.option(fc.string({ minLength: 1, maxLength: 500 })),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify JSON format instructions are present
          expect(result.prompt).toContain('JSON format');
          expect(result.prompt).toContain('Provide your response');
          
          // Verify JSON structure indicators
          expect(result.prompt).toContain('{');
          expect(result.prompt).toContain('}');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include scoring guide with 1-10 scale', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that the prompt includes a scoring
     * guide that instructs models to use a 1-10 scale.
     * 
     * Strategy:
     * - Generate various questions
     * - Build prompt
     * - Verify scoring guide is present with 1-10 scale
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.option(fc.string({ minLength: 1, maxLength: 500 })),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify scoring guide is present
          expect(result.prompt).toContain('SCORING GUIDE');
          
          // Verify 1-10 scale is mentioned
          expect(result.prompt).toContain('1-10');
          
          // Verify score ranges are described
          expect(result.prompt).toMatch(/1-3/);
          expect(result.prompt).toMatch(/4-6/);
          expect(result.prompt).toMatch(/7-9/);
          expect(result.prompt).toContain('10');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include confidence field instructions with 0-1 range', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that the prompt includes instructions
     * for the confidence field with the 0-1 range specification.
     * 
     * Strategy:
     * - Generate various questions
     * - Build prompt
     * - Verify confidence instructions with 0-1 range
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.option(fc.string({ minLength: 1, maxLength: 500 })),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify confidence field is mentioned
          expect(result.prompt).toContain('confidence');
          expect(result.prompt).toContain('CONFIDENCE');
          
          // Verify 0-1 range is specified
          expect(result.prompt).toMatch(/0.*1/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include assumptions field instructions as array', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that the prompt includes instructions
     * for the assumptions field and indicates it should be an array.
     * 
     * Strategy:
     * - Generate various questions
     * - Build prompt
     * - Verify assumptions instructions with array format
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.option(fc.string({ minLength: 1, maxLength: 500 })),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify assumptions field is mentioned
          expect(result.prompt).toContain('assumptions');
          expect(result.prompt).toContain('ASSUMPTIONS');
          
          // Verify array format is indicated
          expect(result.prompt).toContain('[');
          expect(result.prompt).toContain(']');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent template structure across all inputs', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that the template structure remains
     * consistent regardless of the input question or evidence content.
     * 
     * Strategy:
     * - Generate various questions and evidence combinations
     * - Build prompts
     * - Verify all prompts have the same structural elements
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.option(fc.string({ minLength: 1, maxLength: 500 })),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify all structural elements are present
          const requiredElements = [
            'QUESTION:',
            'Provide your response in the following JSON format',
            'score',
            'reasoning',
            'confidence',
            'assumptions',
            'SCORING GUIDE:',
            'CONFIDENCE:',
            'ASSUMPTIONS:'
          ];
          
          requiredElements.forEach(element => {
            expect(result.prompt).toContain(element);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include detailed scoring guide descriptions', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that the scoring guide includes
     * detailed descriptions for different trust levels.
     * 
     * Strategy:
     * - Generate various questions
     * - Build prompt
     * - Verify scoring descriptions are present
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.uuid(),
        async (question, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence: null
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify scoring descriptions are present
          expect(result.prompt).toContain('Low trust');
          expect(result.prompt).toContain('Medium trust');
          expect(result.prompt).toContain('High trust');
          expect(result.prompt).toContain('Very high trust');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should position template elements in correct order', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that template elements appear in
     * the correct order: question, evidence (if present), JSON format
     * instructions, scoring guide, confidence explanation, assumptions explanation.
     * 
     * Strategy:
     * - Generate various questions and evidence
     * - Build prompt
     * - Verify element ordering
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.option(fc.string({ minLength: 1, maxLength: 500 })),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Get positions of key elements
          const questionIndex = result.prompt.indexOf('QUESTION:');
          const jsonFormatIndex = result.prompt.indexOf('Provide your response in the following JSON format');
          const scoringGuideIndex = result.prompt.indexOf('SCORING GUIDE:');
          const confidenceIndex = result.prompt.indexOf('CONFIDENCE:');
          const assumptionsIndex = result.prompt.indexOf('ASSUMPTIONS:');
          
          // Verify ordering
          expect(questionIndex).toBeLessThan(jsonFormatIndex);
          expect(jsonFormatIndex).toBeLessThan(scoringGuideIndex);
          expect(scoringGuideIndex).toBeLessThan(confidenceIndex);
          expect(confidenceIndex).toBeLessThan(assumptionsIndex);
          
          // If evidence is present, verify it comes after question
          if (evidence) {
            const evidenceIndex = result.prompt.indexOf('EVIDENCE:');
            expect(evidenceIndex).toBeGreaterThan(questionIndex);
            expect(evidenceIndex).toBeLessThan(jsonFormatIndex);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include evaluation context instructions', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that the prompt includes context
     * about the evaluation task (trustworthiness evaluation).
     * 
     * Strategy:
     * - Generate various questions
     * - Build prompt
     * - Verify evaluation context is present
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.uuid(),
        async (question, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence: null
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify evaluation context is present
          expect(result.prompt).toContain('trustworthiness');
          expect(result.prompt).toContain('evaluating');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain template structure regardless of question length', async () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * This property test verifies that the template structure is
     * maintained even with very short or very long questions.
     * 
     * Strategy:
     * - Generate questions of varying lengths (1-2000 chars)
     * - Build prompts
     * - Verify all structural elements are present
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
        fc.uuid(),
        async (question, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence: null
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify all required fields are present regardless of question length
          expect(result.prompt).toContain('score');
          expect(result.prompt).toContain('reasoning');
          expect(result.prompt).toContain('confidence');
          expect(result.prompt).toContain('assumptions');
          expect(result.prompt).toContain('SCORING GUIDE');
        }
      ),
      { numRuns: 100 }
    );
  });
});
