/**
 * Stage 6: buildResponse
 * 
 * Formats final response payload with consensus report and metrics.
 * 
 * Requirements: 8.3, 8.5, 8.6, 3.1
 * 
 * @module stages/build-response
 */

import { logger } from '../utils/logger.js';

/**
 * Build final response payload
 * 
 * @param {Object} ctx - Context object from pipeline
 * @param {string} ctx.traceId - UUID v4 trace identifier
 * @param {number} ctx.startTime - Pipeline start timestamp
 * @param {Object} ctx.consensus - Consensus metrics
 * @param {Array} ctx.validResponses - Valid model responses
 * @param {Array} ctx.rawResponses - Raw responses from LLM ensemble
 * @returns {Promise<Object>} Context object with response object added
 */
export async function buildResponse(ctx) {
  // Calculate execution time
  const executionTimeMs = Date.now() - ctx.startTime;
  
  // Calculate model counts
  const totalModels = ctx.rawResponses.length;
  const successfulModels = ctx.validResponses.length;
  const failedModels = totalModels - successfulModels;
  
  // Build response object
  const response = {
    traceId: ctx.traceId,
    consensus: ctx.consensus,
    models: ctx.validResponses,
    metrics: {
      totalModels,
      successfulModels,
      failedModels,
      executionTimeMs
    }
  };
  
  // Log response completion
  logger.info({ 
    traceId: ctx.traceId, 
    stage: 'buildResponse', 
    action: 'completed',
    executionTimeMs 
  });
  
  // Return context with response added
  return { ...ctx, response };
}
