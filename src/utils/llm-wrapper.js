/**
 * LLM Wrapper - Single abstraction layer for all language model calls
 * 
 * Provides a unified interface for invoking multiple LLM providers with:
 * - 20-second timeout enforcement using AbortController
 * - Provider-specific API integration (OpenAI, Anthropic)
 * - Structured logging for observability
 * - API key management from environment variables
 * 
 * @module llm-wrapper
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logModelCallStart, logModelCallSuccess, logModelCallFailed } from './logger.js';

/**
 * Call an LLM with timeout and observability
 * 
 * This function provides a single abstraction layer for all LLM calls in the system.
 * It handles provider routing, timeout enforcement, and structured logging.
 * 
 * @param {import('../types.js').ModelConfig} config - Model configuration
 * @param {string} prompt - The prompt to send to the model
 * @param {string} traceId - UUID v4 trace identifier for logging
 * @returns {Promise<string>} Raw text response from the model
 * @throws {Error} If the call fails, times out, or API key is missing
 */
export async function callLLM(config, prompt, traceId) {
  const startTime = Date.now();
  
  // Log call start
  logModelCallStart(traceId, config.provider, config.model);
  
  try {
    // Create AbortController for timeout enforcement
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    // Invoke provider-specific implementation
    const response = await invokeProvider(config, prompt, controller.signal);
    
    // Clear timeout on success
    clearTimeout(timeoutId);
    
    // Log success
    const duration = Date.now() - startTime;
    logModelCallSuccess(traceId, config.model, duration);
    
    return response;
    
  } catch (error) {
    // Calculate duration even on failure
    const duration = Date.now() - startTime;
    
    // Determine error message
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = `Timeout after ${config.timeout}ms`;
    }
    
    // Log failure
    logModelCallFailed(traceId, config.model, errorMessage, duration);
    
    // Re-throw with context
    throw new Error(`LLM call failed for ${config.model}: ${errorMessage}`);
  }
}

/**
 * Invoke provider-specific API
 * 
 * Routes to the appropriate provider implementation based on config.provider.
 * Supports OpenAI and Anthropic providers.
 * 
 * @param {import('../types.js').ModelConfig} config - Model configuration
 * @param {string} prompt - The prompt to send to the model
 * @param {AbortSignal} signal - AbortController signal for timeout
 * @returns {Promise<string>} Raw text response from the model
 * @throws {Error} If provider is unsupported or API call fails
 */
async function invokeProvider(config, prompt, signal) {
  switch (config.provider) {
    case 'openai':
      return await invokeOpenAI(config, prompt, signal);
    case 'anthropic':
      return await invokeAnthropic(config, prompt, signal);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

/**
 * Invoke OpenAI API
 * 
 * @param {import('../types.js').ModelConfig} config - Model configuration
 * @param {string} prompt - The prompt to send to the model
 * @param {AbortSignal} signal - AbortController signal for timeout
 * @returns {Promise<string>} Raw text response from OpenAI
 * @throws {Error} If API key is missing or API call fails
 */
async function invokeOpenAI(config, prompt, signal) {
  // Retrieve API key from environment
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  // Initialize OpenAI client
  const client = new OpenAI({
    apiKey,
    timeout: config.timeout,
    maxRetries: 0 // No retries, let timeout handle it
  });
  
  // Make API call with abort signal
  const completion = await client.chat.completions.create(
    {
      model: config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      signal
    }
  );
  
  // Extract and return response text
  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('Empty response from OpenAI');
  }
  
  return responseText;
}

/**
 * Invoke Anthropic API
 * 
 * @param {import('../types.js').ModelConfig} config - Model configuration
 * @param {string} prompt - The prompt to send to the model
 * @param {AbortSignal} signal - AbortController signal for timeout
 * @returns {Promise<string>} Raw text response from Anthropic
 * @throws {Error} If API key is missing or API call fails
 */
async function invokeAnthropic(config, prompt, signal) {
  // Retrieve API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  
  // Initialize Anthropic client
  const client = new Anthropic({
    apiKey,
    timeout: config.timeout,
    maxRetries: 0 // No retries, let timeout handle it
  });
  
  // Make API call with abort signal
  const message = await client.messages.create(
    {
      model: config.model,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      signal
    }
  );
  
  // Extract and return response text
  const responseText = message.content[0]?.text;
  if (!responseText) {
    throw new Error('Empty response from Anthropic');
  }
  
  return responseText;
}
