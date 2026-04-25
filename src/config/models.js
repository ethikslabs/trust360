/**
 * Model Configuration for Trust360 v0.1 Pipeline
 *
 * All models route through ai-gateway (port 3003).
 * claude-* models → Anthropic. Everything else → NVIDIA NIM (Nemotron 120B).
 */

const MODEL_CONFIG = [
  {
    provider: 'gateway',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    timeout: 20000
  },
  {
    provider: 'gateway',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    timeout: 20000
  },
  {
    provider: 'gateway',
    model: 'claude-3-opus-20240229',
    timeout: 20000
  }
];

export { MODEL_CONFIG };
