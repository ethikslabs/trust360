/**
 * Stage 3: runLLMEnsemble
 * 
 * Executes parallel LLM calls and collects raw responses.
 * Uses Promise.allSettled for fault tolerance.
 * 
 * Requirements: 5.1, 5.2, 5.3, 3.1
 * 
 * @module stages/run-llm-ensemble
 */

import { logger } from '../utils/logger.js';
import { callLLM } from '../utils/llm-wrapper.js';
import { MODEL_CONFIG } from '../config/models.js';

/**
 * Execute parallel LLM calls and collect raw responses
 * 
 * @param {Object} ctx - Context object from pipeline
 * @param {string} ctx.traceId - UUID v4 trace identifier
 * @param {string} ctx.prompt - Generated prompt for LLM evaluation
 * @returns {Promise<Object>} Context object with rawResponses array added
 * @throws {Error} If all models fail or timeout
 */
export async function runLLMEnsemble(ctx) {
  // Create array of promises for parallel execution
  const modelPromises = MODEL_CONFIG.map(config => 
    callLLM(config, ctx.prompt, ctx.traceId)
  );
  
  // Execute all models in parallel with Promise.allSettled for fault tolerance
  const results = await Promise.allSettled(modelPromises);
  
  // Map results to rawResponses array
  const rawResponses = results.map((result, index) => ({
    model: MODEL_CONFIG[index].model,
    status: result.status,
    response: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));
  
  // Count successful responses
  const successCount = rawResponses.filter(r => r.status === 'fulfilled').length;
  const failedCount = rawResponses.length - successCount;
  
  // Check for all-models-failed condition
  if (successCount === 0) {
    logger.error({ 
      traceId: ctx.traceId, 
      stage: 'runLLMEnsemble', 
      error: 'All models failed',
      failedCount,
      totalModels: rawResponses.length
    });
    throw new Error('All LLM calls failed');
  }
  
  // Log success/failure counts
  logger.info({ 
    traceId: ctx.traceId, 
    stage: 'runLLMEnsemble', 
    action: 'completed',
    successCount, 
    failedCount,
    totalModels: rawResponses.length
  });
  
  // Return context with rawResponses added
  return { ...ctx, rawResponses };
}
