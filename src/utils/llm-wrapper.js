/**
 * LLM Wrapper — routes all calls through ai-gateway (port 3003)
 * Gateway handles provider routing: claude-* → Anthropic, everything else → NIM.
 */

import OpenAI from 'openai';
import { logModelCallStart, logModelCallSuccess, logModelCallFailed } from './logger.js';

const GATEWAY_URL = process.env.AI_GATEWAY_URL || 'http://localhost:3003/v1';

const client = new OpenAI({ baseURL: GATEWAY_URL, apiKey: 'gateway', defaultHeaders: { 'X-Tenant-ID': 'trust360' } });

export async function callLLM(config, prompt, traceId) {
  const startTime = Date.now();
  logModelCallStart(traceId, 'gateway', config.model);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const completion = await client.chat.completions.create(
      {
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error('Empty response from gateway');

    logModelCallSuccess(traceId, config.model, Date.now() - startTime);
    return text;

  } catch (error) {
    const msg = error.name === 'AbortError' ? `Timeout after ${config.timeout}ms` : error.message;
    logModelCallFailed(traceId, config.model, msg, Date.now() - startTime);
    throw new Error(`LLM call failed for ${config.model}: ${msg}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
