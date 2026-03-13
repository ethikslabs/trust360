# Trust360 v0.1 Pipeline

A modular AI trust evaluation engine built on a deterministic, stage-based pipeline architecture. The system accepts trust evaluation requests via HTTP, processes them through six sequential stages, executes multiple LLMs in parallel, and returns structured consensus reports with trust scores and agreement metrics.

## Features

- **Stage-Based Pipeline**: Six sequential stages (createContext, buildPrompt, runLLMEnsemble, parseOutputs, computeConsensus, buildResponse)
- **Parallel LLM Execution**: Multiple models evaluated simultaneously for consensus
- **Fault Tolerance**: Continues with partial success if at least one model succeeds
- **Structured Logging**: Comprehensive observability with trace IDs
- **Property-Based Testing**: 25 correctness properties validated with 100+ iterations each

## Requirements

- Node.js 20.0.0 or higher
- OpenAI API key
- Anthropic API key

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure your API keys:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   PORT=3000
   LOG_LEVEL=info
   ```

## Usage

### Start the Server

```bash
npm start
```

The server will start on port 3000 (or the port specified in your `.env` file).

### API Endpoints

#### POST /trust

Evaluate the trustworthiness of a claim.

**Request:**
```json
{
  "question": "Is the Earth round?",
  "evidence": "Scientific observations and satellite imagery confirm the Earth's spherical shape.",
  "metadata": {
    "source": "example"
  }
}
```

**Response (200 - All models succeeded):**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "consensus": {
    "mos": 9.33,
    "variance": 0.22,
    "agreement": "high"
  },
  "models": [
    {
      "model": "gpt-4",
      "score": 9,
      "confidence": 0.95,
      "reasoning": "Strong scientific evidence supports this claim...",
      "assumptions": ["Scientific consensus is reliable"]
    }
  ],
  "metrics": {
    "totalModels": 3,
    "successfulModels": 3,
    "failedModels": 0,
    "executionTimeMs": 2340
  }
}
```

**Response (206 - Partial success):**
Same structure as 200, but with `failedModels > 0`.

**Response (400 - Validation error):**
```json
{
  "error": "Validation failed",
  "details": "question must be 2000 characters or fewer",
  "statusCode": 400
}
```

**Response (500 - All models failed):**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "error": "All LLM calls failed",
  "statusCode": 500
}
```

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "0.1.0"
}
```

## Docker

### Build Image

```bash
docker build -t trust360:0.1.0 .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e ANTHROPIC_API_KEY=your_key \
  trust360:0.1.0
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Property-Based Tests Only

```bash
npm run test:properties
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Test Coverage

The project maintains 80%+ test coverage with:
- Unit tests for individual components
- Property-based tests for universal correctness properties
- Integration tests for end-to-end flows

## Architecture

### Pipeline Stages

1. **createContext**: Initialize context with trace ID and timestamps
2. **buildPrompt**: Generate structured prompts for LLM evaluation
3. **runLLMEnsemble**: Execute parallel LLM calls with 20s timeout
4. **parseOutputs**: Parse and validate model responses
5. **computeConsensus**: Calculate MOS, variance, and agreement
6. **buildResponse**: Format final response payload

### Models

- OpenAI GPT-4
- OpenAI GPT-3.5 Turbo
- Anthropic Claude 3 Opus

All models execute in parallel with a 20-second timeout per model.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `ANTHROPIC_API_KEY` | Yes | - | Anthropic API key |
| `PORT` | No | 3000 | Server port |
| `HOST` | No | 0.0.0.0 | Server host |
| `LOG_LEVEL` | No | info | Logging level (debug, info, warn, error) |
| `NODE_ENV` | No | development | Environment (development, production) |

## License

ISC
