/**
 * Stage 4: parseOutputs
 * 
 * Parses and validates model responses, filtering invalid entries.
 * 
 * Requirements: 6.1, 6.2, 6.6, 6.7, 3.1
 * 
 * @module stages/parse-outputs
 */

import { logger } from '../utils/logger.js';
import { isValidModelResponse } from '../utils/validation.js';

/**
 * Parse and validate model responses
 * 
 * @param {Object} ctx - Context object from pipeline
 * @param {string} ctx.traceId - UUID v4 trace identifier
 * @param {Array} ctx.rawResponses - Raw responses from LLM ensemble
 * @returns {Promise<Object>} Context object with validResponses array added
 */
export async function parseOutputs(ctx) {
  const validResponses = [];
  
  for (const raw of ctx.rawResponses) {
    // Skip failed responses
    if (raw.status !== 'fulfilled') {
      continue;
    }
    
    try {
      // Parse JSON response
      const parsed = JSON.parse(raw.response);
      
      // Validate schema
      if (!isValidModelResponse(parsed)) {
        logger.warn({ 
          traceId: ctx.traceId, 
          stage: 'parseOutputs', 
          model: raw.model,
          error: 'Validation failed' 
        });
        continue;
      }
      
      // Add to valid responses
      validResponses.push({
        model: raw.model,
        score: parsed.score,
        reasoning: parsed.reasoning,
        confidence: parsed.confidence,
        assumptions: parsed.assumptions
      });
      
    } catch (error) {
      // Log parse failures
      logger.warn({ 
        traceId: ctx.traceId, 
        stage: 'parseOutputs', 
        model: raw.model,
        error: 'Parse failed' 
      });
    }
  }
  
  // Log valid response count
  logger.info({ 
    traceId: ctx.traceId, 
    stage: 'parseOutputs', 
    action: 'completed',
    validCount: validResponses.length 
  });
  
  // Return context with validResponses added
  return { ...ctx, validResponses };
}
