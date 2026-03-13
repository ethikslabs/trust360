/**
 * Stage 5: computeConsensus
 * 
 * Calculates consensus metrics from valid responses.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 3.1
 * 
 * @module stages/compute-consensus
 */

import { logger } from '../utils/logger.js';
import { calculateMOS, calculateVariance, classifyAgreement } from '../utils/consensus.js';

/**
 * Compute consensus metrics from valid responses
 * 
 * @param {Object} ctx - Context object from pipeline
 * @param {string} ctx.traceId - UUID v4 trace identifier
 * @param {Array} ctx.validResponses - Valid model responses
 * @returns {Promise<Object>} Context object with consensus object added
 */
export async function computeConsensus(ctx) {
  // Extract scores from valid responses
  const scores = ctx.validResponses.map(r => r.score);
  
  // Calculate MOS
  const mos = calculateMOS(scores);
  
  // Calculate variance
  const variance = calculateVariance(scores, mos);
  
  // Classify agreement
  const agreement = classifyAgreement(variance);
  
  // Build consensus object
  const consensus = {
    mos,
    variance,
    agreement
  };
  
  // Log consensus results
  logger.info({ 
    traceId: ctx.traceId, 
    stage: 'computeConsensus', 
    action: 'completed',
    consensus 
  });
  
  // Return context with consensus added
  return { ...ctx, consensus };
}
