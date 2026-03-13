/**
 * Structured logging infrastructure using Pino
 * 
 * Provides JSON-formatted logs with ISO 8601 timestamps and trace ID support.
 * Log level is configurable via LOG_LEVEL environment variable (default: info).
 * 
 * @module logger
 */

import pino from 'pino';

/**
 * Initialize Pino logger with structured JSON output
 * 
 * Configuration:
 * - level: Controlled by LOG_LEVEL env var (default: 'info')
 * - timestamp: ISO 8601 format
 * - formatters: Ensure consistent log structure
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

/**
 * Helper function to log stage entry events
 * 
 * @param {string} traceId - UUID v4 trace identifier for the request
 * @param {string} stageName - Name of the pipeline stage
 * @param {Object} [additionalContext] - Optional additional context to include
 */
export function logStageEntry(traceId, stageName, additionalContext = {}) {
  logger.info({
    traceId,
    stage: stageName,
    action: 'entry',
    ...additionalContext
  });
}

/**
 * Helper function to log stage exit events
 * 
 * @param {string} traceId - UUID v4 trace identifier for the request
 * @param {string} stageName - Name of the pipeline stage
 * @param {Object} [additionalContext] - Optional additional context to include
 */
export function logStageExit(traceId, stageName, additionalContext = {}) {
  logger.info({
    traceId,
    stage: stageName,
    action: 'exit',
    ...additionalContext
  });
}

/**
 * Helper function to log stage completion with custom action
 * 
 * @param {string} traceId - UUID v4 trace identifier for the request
 * @param {string} stageName - Name of the pipeline stage
 * @param {string} action - Custom action description
 * @param {Object} [additionalContext] - Optional additional context to include
 */
export function logStageAction(traceId, stageName, action, additionalContext = {}) {
  logger.info({
    traceId,
    stage: stageName,
    action,
    ...additionalContext
  });
}

/**
 * Helper function to log model invocation start
 * 
 * @param {string} traceId - UUID v4 trace identifier for the request
 * @param {string} provider - LLM provider name (e.g., 'openai', 'anthropic')
 * @param {string} model - Model identifier (e.g., 'gpt-4', 'claude-3-opus')
 */
export function logModelCallStart(traceId, provider, model) {
  logger.info({
    traceId,
    action: 'llm_call_start',
    provider,
    model
  });
}

/**
 * Helper function to log successful model invocation
 * 
 * @param {string} traceId - UUID v4 trace identifier for the request
 * @param {string} model - Model identifier
 * @param {number} durationMs - Call duration in milliseconds
 */
export function logModelCallSuccess(traceId, model, durationMs) {
  logger.info({
    traceId,
    action: 'llm_call_success',
    model,
    durationMs
  });
}

/**
 * Helper function to log failed model invocation
 * 
 * @param {string} traceId - UUID v4 trace identifier for the request
 * @param {string} model - Model identifier
 * @param {string} error - Error message
 * @param {number} durationMs - Call duration in milliseconds
 */
export function logModelCallFailed(traceId, model, error, durationMs) {
  logger.error({
    traceId,
    action: 'llm_call_failed',
    model,
    error,
    durationMs
  });
}
