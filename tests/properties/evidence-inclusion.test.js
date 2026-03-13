/**
 * Property-based test for conditional evidence inclusion
 * 
 * Feature: trust360-v0-1-pipeline, Property 10
 * 
 * Property 10: Conditional Evidence Inclusion
 * **Validates: Requirements 4.3**
 * 
 * For any request, if evidence is provided, the generated prompt should contain
 * the evidence text; if evidence is not provided, the prompt should not contain
 * an evidence section.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { buildPrompt } from '../../src/stages/build-prompt.js';
import { logger } from '../../src/utils/logger.js';

describe('Feature: trust360-v0-1-pipeline, Property 10: Conditional Evidence Inclusion', () => {
  let logSpy;
  
  beforeEach(() => {
    // Spy on logger to avoid console output during tests
    logSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include evidence in prompt when evidence is provided', async () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * This property test verifies that when evidence is provided in the context,
     * the buildPrompt stage includes both the EVIDENCE: label and the evidence
     * text in the generated prompt.
     * 
     * Strategy:
     * - Generate random questions and evidence
     * - Build prompt with evidence
     * - Verify EVIDENCE: label is present
     * - Verify evidence text is included
     * - Test across 100 iterations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 5000 }),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify evidence section is present
          expect(result.prompt).toContain('EVIDENCE:');
          
          // Verify evidence text is included
          expect(result.prompt).toContain(evidence);
          
          // Verify evidence appears in the evidence section
          // Extract the section after EVIDENCE: to verify evidence is there
          const evidenceSectionStart = result.prompt.indexOf('EVIDENCE:');
          const evidenceSection = result.prompt.substring(evidenceSectionStart);
          expect(evidenceSection).toContain(evidence);
          
          // Verify evidence comes after question
          const questionIndex = result.prompt.indexOf(question);
          const evidenceLabelIndex = result.prompt.indexOf('EVIDENCE:');
          expect(evidenceLabelIndex).toBeGreaterThan(questionIndex);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT include evidence section when evidence is null', async () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * This property test verifies that when evidence is null, the prompt
     * does not contain an EVIDENCE: section.
     * 
     * Strategy:
     * - Generate random questions without evidence
     * - Build prompt with evidence = null
     * - Verify EVIDENCE: label is NOT present
     * - Test across various questions
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
          
          // Verify evidence section is NOT present
          expect(result.prompt).not.toContain('EVIDENCE:');
          
          // Verify prompt still contains other required sections
          expect(result.prompt).toContain('QUESTION:');
          expect(result.prompt).toContain(question);
          expect(result.prompt).toContain('SCORING GUIDE:');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT include evidence section when evidence is empty string', async () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * This property test verifies that when evidence is an empty string,
     * the prompt does not contain an EVIDENCE: section (empty string is falsy).
     * 
     * Strategy:
     * - Generate questions with empty evidence
     * - Build prompt
     * - Verify EVIDENCE: label is NOT present
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.uuid(),
        async (question, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence: ''
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify evidence section is NOT present for empty string
          expect(result.prompt).not.toContain('EVIDENCE:');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT include evidence section when evidence is undefined', async () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * This property test verifies that when evidence is undefined,
     * the prompt does not contain an EVIDENCE: section.
     * 
     * Strategy:
     * - Generate questions without evidence field
     * - Build prompt
     * - Verify EVIDENCE: label is NOT present
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.uuid(),
        async (question, traceId) => {
          const ctx = {
            traceId,
            question
            // evidence is undefined (not set)
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify evidence section is NOT present
          expect(result.prompt).not.toContain('EVIDENCE:');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve evidence text exactly without modification', async () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * This property test verifies that when evidence is provided,
     * it is included in the prompt exactly as provided without
     * any modifications or transformations.
     * 
     * Strategy:
     * - Generate evidence with special characters, whitespace, etc.
     * - Build prompt
     * - Verify exact evidence text is preserved
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 1000 }),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify exact evidence text is in prompt
          expect(result.prompt).toContain(evidence);
          
          // Extract evidence section and verify it matches
          const evidenceSectionMatch = result.prompt.match(/EVIDENCE:\n(.+?)\n\n/s);
          if (evidenceSectionMatch) {
            expect(evidenceSectionMatch[1]).toBe(evidence);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle evidence with newlines and special formatting', async () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * This property test verifies that evidence containing newlines,
     * tabs, and other special formatting is included correctly.
     * 
     * Strategy:
     * - Generate evidence with multiple lines
     * - Build prompt
     * - Verify formatted evidence is preserved
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
        fc.uuid(),
        async (question, evidenceParts, traceId) => {
          // Create evidence with newlines
          const evidence = evidenceParts.join('\n');
          
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify evidence with newlines is included
          expect(result.prompt).toContain('EVIDENCE:');
          expect(result.prompt).toContain(evidence);
          
          // Verify all parts of evidence are present
          evidenceParts.forEach(part => {
            expect(result.prompt).toContain(part);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should conditionally include evidence based on truthiness', async () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * This property test verifies the conditional logic: evidence is
     * included if and only if it is truthy.
     * 
     * Strategy:
     * - Test with various truthy and falsy evidence values
     * - Verify EVIDENCE: section presence matches evidence truthiness
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.uuid(),
        fc.oneof(
          fc.constant(null),
          fc.constant(''),
          fc.constant(undefined),
          fc.string({ minLength: 1, maxLength: 500 })
        ),
        async (question, traceId, evidence) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Verify evidence section presence matches truthiness
          if (evidence) {
            expect(result.prompt).toContain('EVIDENCE:');
            expect(result.prompt).toContain(evidence);
          } else {
            expect(result.prompt).not.toContain('EVIDENCE:');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should position evidence between question and JSON format instructions', async () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * This property test verifies that when evidence is included,
     * it appears in the correct position in the prompt structure:
     * after the question and before the JSON format instructions.
     * 
     * Strategy:
     * - Generate questions and evidence
     * - Build prompt
     * - Verify evidence positioning in prompt structure
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.uuid(),
        async (question, evidence, traceId) => {
          const ctx = {
            traceId,
            question,
            evidence
          };
          
          const result = await buildPrompt(ctx);
          
          // Get positions of key sections
          const questionIndex = result.prompt.indexOf(question);
          const evidenceIndex = result.prompt.indexOf('EVIDENCE:');
          const jsonFormatIndex = result.prompt.indexOf('Provide your response in the following JSON format');
          
          // Verify ordering: question < evidence < JSON format
          expect(evidenceIndex).toBeGreaterThan(questionIndex);
          expect(jsonFormatIndex).toBeGreaterThan(evidenceIndex);
        }
      ),
      { numRuns: 100 }
    );
  });
});
