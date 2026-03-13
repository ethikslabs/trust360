/**
 * Pipeline Engine
 * 
 * Executes stages in sequential order with error handling.
 * 
 * Requirements: 3.1, 3.2, 3.3, 10.6, 10.7
 * 
 * @module pipeline
 */

import { logger } from './utils/logger.js';
import { createContext } from './stages/create-context.js';
import { buildPrompt } from './stages/build-prompt.js';
import { runLLMEnsemble } from './stages/run-llm-ensemble.js';
import { parseOutputs } from './stages/parse-outputs.js';
import { computeConsensus } from './stages/compute-consensus.js';
import { buildResponse } from './stages/build-response.js';

/**
 * Stage registry - ordered array of stage functions
 * 
 * Stages execute in this exact order:
 * 1. createContext
 * 2. buildPrompt
 * 3. runLLMEnsemble
 * 4. parseOutputs
 * 5. computeConsensus
 * 6. buildResponse
 */
const stages = [
  createContext,
  buildPrompt,
  runLLMEnsemble,
  parseOutputs,
  computeConsensus,
  buildResponse
];

/**
 * Execute pipeline with sequential stage execution
 * 
 * @param {Object} requestBody - Trust evaluation request
 * @param {string} requestBody.question - Question to evaluate
 * @param {string} [requestBody.evidence] - Optional evidence
 * @param {Object} [requestBody.metadata] - Optional metadata
 * @returns {Promise<Object>} Trust response object
 * @throws {Error} If any critical stage fails
 */
export async function executePipeline(requestBody) {
  let ctx = { request: requestBody };
  
  try {
    // Log pipeline start
    logger.info({ action: 'pipeline_start' });
    
    // Execute stages sequentially
    for (const stage of stages) {
      ctx = await stage(ctx);
    }
    
    // Log pipeline completion
    logger.info({ 
      traceId: ctx.traceId,
      action: 'pipeline_end',
      executionTimeMs: ctx.response.metrics.executionTimeMs
    });
    
    return ctx.response;
    
  } catch (error) {
    // Log pipeline error
    logger.error({ 
      traceId: ctx.traceId, 
      action: 'pipeline_error',
      error: error.message,
      stage: error.stage || 'unknown'
    });
    
    throw error;
  }
}

export { stages };
