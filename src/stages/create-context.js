/**
 * Stage 1: createContext
 * 
 * Initializes the Context_Object with request data, generates a unique trace ID,
 * and sets up the initial state for pipeline processing.
 * 
 * This is the first stage in the Trust360 pipeline. It:
 * - Generates a UUID v4 trace ID for request tracing
 * - Captures the start time for execution metrics
 * - Initializes the Context_Object with request data and empty arrays
 * - Adds structured logging for observability
 * 
 * @module stages/createContext
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

/**
 * Create and initialize the Context_Object for pipeline processing
 * 
 * @param {Object} ctx - Initial context containing the request
 * @param {Object} ctx.request - The trust evaluation request
 * @param {string} ctx.request.question - The question to evaluate
 * @param {string} [ctx.request.evidence] - Optional evidence for evaluation
 * @param {Object} [ctx.request.metadata] - Optional metadata to pass through
 * @returns {Promise<Object>} Context_Object with initialized fields
 * 
 * @example
 * const ctx = await createContext({
 *   request: {
 *     question: "Is this claim trustworthy?",
 *     evidence: "Supporting evidence...",
 *     metadata: { source: "api" }
 *   }
 * });
 */
export async function createContext(ctx) {
  // Generate unique trace ID for request tracking
  const traceId = uuidv4();
  
  // Capture start time for execution metrics
  const startTime = Date.now();
  
  // Log context initialization
  logger.info({ traceId, stage: 'createContext', action: 'initialized' });
  
  // Return initialized Context_Object
  return {
    ...ctx,
    traceId,
    startTime,
    question: ctx.request.question,
    evidence: ctx.request.evidence !== undefined ? ctx.request.evidence : null,
    metadata: ctx.request.metadata || {},
    rawResponses: [],
    validResponses: [],
    consensus: null,
    response: null
  };
}
