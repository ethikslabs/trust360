/**
 * Model Configuration for Trust360 v0.1 Pipeline
 * 
 * Defines the ensemble of language models used for trust evaluation.
 * Each model is invoked in parallel during the runLLMEnsemble stage.
 * 
 * @module config/models
 */

/**
 * @typedef {Object} ModelConfig
 * @property {string} provider - The LLM provider (e.g., 'openai', 'anthropic')
 * @property {string} model - The specific model identifier
 * @property {number} timeout - Timeout in milliseconds for model invocation
 */

/**
 * Model configuration array for the LLM ensemble.
 * All models are invoked in parallel with a 20-second timeout.
 * 
 * @type {ModelConfig[]}
 */
const MODEL_CONFIG = [
  {
    provider: 'openai',
    model: 'gpt-4',
    timeout: 20000
  },
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    timeout: 20000
  },
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    timeout: 20000
  }
];

export { MODEL_CONFIG };
