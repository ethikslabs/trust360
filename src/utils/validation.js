/**
 * Validation utilities for model responses
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5
 * 
 * @module utils/validation
 */

/**
 * Validate model response structure and field values
 * 
 * Validation rules:
 * - score: number, 1-10 inclusive
 * - reasoning: string, non-empty
 * - confidence: number, 0-1 inclusive
 * - assumptions: array
 * 
 * @param {Object} obj - Parsed model response object
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidModelResponse(obj) {
  // Check if obj is an object
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  // Validate score: number, 1-10 inclusive
  if (typeof obj.score !== 'number' || obj.score < 1 || obj.score > 10) {
    return false;
  }
  
  // Validate reasoning: string, non-empty
  if (typeof obj.reasoning !== 'string' || obj.reasoning.length === 0) {
    return false;
  }
  
  // Validate confidence: number, 0-1 inclusive
  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
    return false;
  }
  
  // Validate assumptions: array
  if (!Array.isArray(obj.assumptions)) {
    return false;
  }
  
  return true;
}
