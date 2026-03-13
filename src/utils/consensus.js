/**
 * Consensus computation algorithms
 * 
 * Requirements: 7.1, 7.2, 7.3
 * 
 * @module utils/consensus
 */

/**
 * Calculate Mean Opinion Score (MOS)
 * 
 * @param {number[]} scores - Array of model scores (1-10)
 * @returns {number} Arithmetic mean rounded to 2 decimal places
 */
export function calculateMOS(scores) {
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const mean = sum / scores.length;
  return Math.round(mean * 100) / 100;
}

/**
 * Calculate variance across scores
 * 
 * @param {number[]} scores - Array of model scores (1-10)
 * @param {number} mean - Mean Opinion Score
 * @returns {number} Variance rounded to 2 decimal places
 */
export function calculateVariance(scores, mean) {
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / scores.length;
  return Math.round(variance * 100) / 100;
}

/**
 * Classify agreement level based on variance
 * 
 * Thresholds:
 * - variance < 0.5: high agreement
 * - variance < 1.5: medium agreement
 * - variance >= 1.5: low agreement
 * 
 * @param {number} variance - Calculated variance
 * @returns {'high'|'medium'|'low'} Agreement classification
 */
export function classifyAgreement(variance) {
  if (variance < 0.5) return 'high';
  if (variance < 1.5) return 'medium';
  return 'low';
}
