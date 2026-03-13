/**
 * @fileoverview Type definitions for Trust360 v0.1 Pipeline
 * 
 * This file contains TypeScript JSDoc annotations for all core data structures
 * used throughout the Trust360 pipeline. These types ensure type safety and
 * provide documentation for the API contracts.
 */

/**
 * Trust evaluation request payload
 * 
 * @typedef {Object} TrustRequest
 * @property {string} question - The claim or question to evaluate (1-2000 characters)
 * @property {string} [evidence] - Optional supporting evidence (0-5000 characters)
 * @property {Record<string, any>} [metadata] - Optional metadata passed through pipeline
 */

/**
 * Trust evaluation response payload
 * 
 * @typedef {Object} TrustResponse
 * @property {string} traceId - UUID v4 identifier for request tracing
 * @property {ConsensusReport} consensus - Consensus metrics from model evaluations
 * @property {ModelResponse[]} models - Array of valid model responses
 * @property {ResponseMetrics} metrics - Execution metrics and model success counts
 */

/**
 * Consensus report containing aggregated trust metrics
 * 
 * @typedef {Object} ConsensusReport
 * @property {number} mos - Mean Opinion Score (1-10, rounded to 2 decimals)
 * @property {number} variance - Statistical variance across model scores (rounded to 2 decimals)
 * @property {'high' | 'medium' | 'low'} agreement - Agreement level classification
 */

/**
 * Individual model response after validation
 * 
 * @typedef {Object} ModelResponse
 * @property {string} model - Model identifier (e.g., 'gpt-4', 'claude-3-opus')
 * @property {number} score - Trust score from 1-10 (inclusive)
 * @property {number} confidence - Model's confidence in assessment (0-1, inclusive)
 * @property {string} reasoning - Detailed reasoning for the score
 * @property {string[]} assumptions - Array of assumptions made during evaluation
 */

/**
 * Response execution metrics
 * 
 * @typedef {Object} ResponseMetrics
 * @property {number} totalModels - Total number of models invoked
 * @property {number} successfulModels - Number of models that returned valid responses
 * @property {number} failedModels - Number of models that failed or timed out
 * @property {number} executionTimeMs - Total execution time in milliseconds
 */

/**
 * Error response payload
 * 
 * @typedef {Object} ErrorResponse
 * @property {string} [traceId] - UUID v4 identifier (present if context was created)
 * @property {string} error - Human-readable error message
 * @property {string} [details] - Additional error context or stack trace
 * @property {number} statusCode - HTTP status code (400, 500, etc.)
 */

/**
 * Context object passed through all pipeline stages
 * 
 * This object accumulates data as it flows through the pipeline. Each stage
 * adds its own fields while preserving existing data.
 * 
 * @typedef {Object} Context_Object
 * 
 * Stage 1: createContext
 * @property {TrustRequest} request - Original request payload
 * @property {string} traceId - UUID v4 identifier for request tracing
 * @property {number} startTime - Request start timestamp (milliseconds since epoch)
 * @property {string} question - The claim or question to evaluate
 * @property {string | null} evidence - Supporting evidence or null if not provided
 * @property {Record<string, any>} metadata - Metadata object (empty if not provided)
 * 
 * Stage 2: buildPrompt
 * @property {string} [prompt] - Generated prompt for LLM evaluation
 * 
 * Stage 3: runLLMEnsemble
 * @property {RawModelResponse[]} [rawResponses] - Raw responses from all model invocations
 * 
 * Stage 4: parseOutputs
 * @property {ModelResponse[]} [validResponses] - Parsed and validated model responses
 * 
 * Stage 5: computeConsensus
 * @property {ConsensusReport} [consensus] - Computed consensus metrics
 * 
 * Stage 6: buildResponse
 * @property {TrustResponse} [response] - Final formatted response payload
 */

/**
 * Raw model response from LLM ensemble execution
 * 
 * @typedef {Object} RawModelResponse
 * @property {string} model - Model identifier
 * @property {'fulfilled' | 'rejected'} status - Promise settlement status
 * @property {string | null} response - Raw text response (null if rejected)
 * @property {string | null} error - Error message (null if fulfilled)
 */

/**
 * Model configuration for LLM invocation
 * 
 * @typedef {Object} ModelConfig
 * @property {string} provider - Provider name ('openai', 'anthropic', etc.)
 * @property {string} model - Model identifier (e.g., 'gpt-4', 'claude-3-opus-20240229')
 * @property {number} timeout - Timeout in milliseconds (default: 20000)
 * @property {string} [apiKey] - API key retrieved from environment variables
 */

/**
 * Validation schema for request body
 * 
 * Used by Fastify for automatic request validation
 */
export const TrustRequestSchema = {
  type: 'object',
  required: ['question'],
  properties: {
    question: {
      type: 'string',
      minLength: 1,
      maxLength: 2000
    },
    evidence: {
      type: 'string',
      maxLength: 5000
    },
    metadata: {
      type: 'object'
    }
  },
  additionalProperties: false
};

/**
 * Validation schema for model response structure
 * 
 * Used to validate parsed LLM responses before consensus computation
 */
export const ModelResponseSchema = {
  type: 'object',
  required: ['score', 'reasoning', 'confidence', 'assumptions'],
  properties: {
    score: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
    reasoning: {
      type: 'string',
      minLength: 1
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1
    },
    assumptions: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  }
};

// Export empty object to make this a module
export default {};
