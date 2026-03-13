/**
 * Property-based test for question inclusion in prompt
 * 
 * Feature: trust360-v0-1-pipeline, Property 9
 * 
 * Property 9: Question Inclusion in Prompt
 * **Validates: Requirements 4.2**
 * 
 * For any request with a question, the generated prompt should contain the question text.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { buildPrompt } from '../../src/stages/build-prompt.js';
import { logger } from '../../src/utils/logger.js';

describe('Feature: trust360-v0-1-pipeline, Property 9: Question Inclusion in Prompt', () => {
  let logSpy;
  
  beforeEach(() => {
    // Spy on logger to avoid console output during tests
    logSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include question text in generated prompt for any question', async () => {
    /**
     * **Validates: Requirements 4.2**
     * 
     * This property test verifies that for any request with a question,
     * the buildPrompt stage generates a prompt that contains the exact
     * question text provided in the context.
     * 
     * Strategy:
     * - Generate random questions of various lengths and content
     * - Build prompt with each question
     * - Verify the question appears in the generated prompt
     * - Test across 100 iterations with different questions
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate random questions (1-2000 chars as per requirements)
        fc.string({ minLength: 1, maxLength: 2000 }),
        // Generate random trace IDs
        fc.uuid(),
        // Generate optional evidence
        fc.option(fc.string({ minLength: 0, maxLength: 500 })),
        async (question, traceId, evidence) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify prompt is generated
          expect(result).toHaveProperty('prompt');
          expect(result.prompt).toBeDefined();
          expect(typeof result.prompt).toBe('string');
          expect(result.prompt.length).toBeGreaterThan(0);
          
          // Verify question is included in the prompt
          expect(result.prompt).toContain(question);
          
          // Verify QUESTION: label is present
          expect(result.prompt).toContain('QUESTION:');
          
          // Verify question appears in the question section
          // Extract the section after QUESTION: to verify question is there
          const questionSectionStart = result.prompt.indexOf('QUESTION:');
          const questionSection = result.prompt.substring(questionSectionStart);
          expect(questionSection).toContain(question);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve question text exactly without modification', async () => {
    /**
     * **Validates: Requirements 4.2**
     * 
     * This property test verifies that the question text is included
     * in the prompt exactly as provided, without any modifications,
     * truncation, or transformation.
     * 
     * Strategy:
     * - Generate questions with special characters, whitespace, etc.
     * - Build prompt
     * - Verify exact question text is preserved in prompt
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate questions with various special characters
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.uuid(),
        async (question, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence: null
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify exact question text is in prompt
          expect(result.prompt).toContain(question);
          
          // Extract the question from the prompt and verify it matches exactly
          const questionSectionMatch = result.prompt.match(/QUESTION:\n(.+?)\n\n/s);
          if (questionSectionMatch) {
            expect(questionSectionMatch[1]).toBe(question);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include question in prompt regardless of evidence presence', async () => {
    /**
     * **Validates: Requirements 4.2**
     * 
     * This property test verifies that the question is always included
     * in the prompt, whether or not evidence is provided.
     * 
     * Strategy:
     * - Generate questions with and without evidence
     * - Build prompts for both cases
     * - Verify question is present in all cases
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.uuid(),
        fc.boolean(),
        async (question, traceId, hasEvidence) => {
          const ctx = {
            traceId,
            question,
            evidence: hasEvidence ? 'Some evidence text' : null
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify question is always included
          expect(result.prompt).toContain(question);
          expect(result.prompt).toContain('QUESTION:');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle questions with newlines and special formatting', async () => {
    /**
     * **Validates: Requirements 4.2**
     * 
     * This property test verifies that questions containing newlines,
     * tabs, and other special formatting characters are included
     * correctly in the prompt.
     * 
     * Strategy:
     * - Generate questions with newlines, tabs, special characters
     * - Build prompt
     * - Verify the formatted question is preserved in prompt
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
        fc.uuid(),
        async (questionParts, traceId) => {
          // Create question with newlines
          const question = questionParts.join('\n');
          
          const ctx = {
            traceId,
            question,
            evidence: null
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify question with newlines is included
          expect(result.prompt).toContain(question);
          
          // Verify all parts of the question are present
          questionParts.forEach(part => {
            expect(result.prompt).toContain(part);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include question in prompt with proper context structure', async () => {
    /**
     * **Validates: Requirements 4.2**
     * 
     * This property test verifies that the question is included as part
     * of a properly structured prompt with the QUESTION: label and
     * appropriate formatting.
     * 
     * Strategy:
     * - Generate various questions
     * - Build prompt
     * - Verify question appears in proper structural context
     * - Verify prompt maintains template structure
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
          
          // Verify structural elements are present
          expect(result.prompt).toContain('QUESTION:');
          expect(result.prompt).toContain(question);
          
          // Verify question comes before the JSON format instructions
          const questionIndex = result.prompt.indexOf(question);
          const jsonFormatIndex = result.prompt.indexOf('Provide your response in the following JSON format');
          expect(questionIndex).toBeLessThan(jsonFormatIndex);
          
          // Verify question comes before scoring guide
          const scoringGuideIndex = result.prompt.indexOf('SCORING GUIDE:');
          expect(questionIndex).toBeLessThan(scoringGuideIndex);
        }
      ),
      { numRuns: 100 }
    );
  });
});
