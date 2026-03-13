/**
 * Stage 2: buildPrompt
 * 
 * Generates structured prompts for LLM evaluation with JSON format instructions.
 * Includes question, conditional evidence, and detailed response format requirements.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * 
 * @module stages/build-prompt
 */

import { logger } from '../utils/logger.js';

/**
 * Prompt template with JSON format instructions
 * 
 * Template includes:
 * - Evaluation context (trustworthiness assessment)
 * - Question placeholder
 * - Conditional evidence section
 * - JSON response format with score (1-10), reasoning, confidence (0-1), assumptions (array)
 * - Scoring guide with detailed descriptions
 * - Confidence and assumptions explanations
 */
const PROMPT_TEMPLATE = `You are evaluating the trustworthiness of a claim. Analyze the question and any provided evidence, then respond with a structured assessment.

QUESTION:
{question}

{evidence_section}Provide your response in the following JSON format:
{
  "score": <number 1-10>,
  "reasoning": "<your detailed reasoning>",
  "confidence": <number 0-1>,
  "assumptions": ["<assumption 1>", "<assumption 2>", ...]
}

SCORING GUIDE:
1-3: Low trust (significant concerns, contradictions, or lack of evidence)
4-6: Medium trust (some concerns or incomplete evidence)
7-9: High trust (strong evidence and logical consistency)
10: Very high trust (overwhelming evidence and no concerns)

CONFIDENCE: Your certainty in this assessment (0 = not confident, 1 = very confident)

ASSUMPTIONS: List any assumptions you made during evaluation`;

/**
 * Build structured prompt for LLM evaluation
 * 
 * Performs template substitution:
 * - Replaces {question} with ctx.question
 * - Conditionally includes evidence section if ctx.evidence is truthy
 * - Maintains all template structure and instructions
 * 
 * @param {Object} ctx - Context object from pipeline
 * @param {string} ctx.traceId - UUID v4 trace identifier
 * @param {string} ctx.question - Question to evaluate
 * @param {string|null} ctx.evidence - Optional evidence text
 * @returns {Promise<Object>} Context object with prompt field added
 */
export async function buildPrompt(ctx) {
  // Build evidence section if evidence is provided
  // Check for null/undefined explicitly to preserve empty string
  const evidenceSection = ctx.evidence !== null && ctx.evidence !== undefined
    ? `EVIDENCE:\n${ctx.evidence}\n\n` 
    : '';
  
  // Perform template substitution
  // Note: Using a replacer function to avoid issues with special characters ($, $$, $&, etc.)
  // in the replacement strings which have special meaning in String.replace()
  const prompt = PROMPT_TEMPLATE
    .replace('{question}', () => ctx.question)
    .replace('{evidence_section}', () => evidenceSection);
  
  // Log prompt generation completion
  logger.info({ 
    traceId: ctx.traceId, 
    stage: 'buildPrompt', 
    action: 'completed',
    promptLength: prompt.length 
  });
  
  // Return context with prompt added
  return { ...ctx, prompt };
}
