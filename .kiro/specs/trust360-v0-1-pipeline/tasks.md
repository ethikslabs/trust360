# Implementation Plan: Trust360 v0.1 Pipeline

## Overview

This implementation plan breaks down the Trust360 v0.1 Pipeline into discrete, actionable coding tasks. The system is a modular AI trust evaluation engine built on Node.js 20+ with Fastify, featuring a deterministic six-stage pipeline architecture that processes trust evaluation requests through parallel LLM execution and consensus computation.

The implementation follows a pure functional pipeline pattern where each stage transforms a shared Context_Object. Tasks are organized to build incrementally, validating core functionality early through automated tests.

## Tasks

- [x] 1. Initialize project structure and dependencies
  - Create package.json with Node.js 20+ requirement
  - Install core dependencies: fastify, pino (logging), uuid
  - Install LLM provider SDKs: openai, @anthropic-ai/sdk
  - Install dev dependencies: vitest, fast-check, @vitest/coverage-v8
  - Create folder structure: src/, src/stages/, src/utils/, tests/, tests/unit/, tests/properties/
  - Create .env.example with required environment variables
  - Set up .gitignore for node_modules, .env, coverage/
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 2. Implement core data models and types
  - Create src/types.js with TypeScript JSDoc annotations for all interfaces
  - Define TrustRequest, TrustResponse, ErrorResponse, Context_Object, ModelConfig interfaces
  - Define validation schemas for request/response structures
  - _Requirements: 1.1, 1.2, 1.3, 8.3, 8.4, 8.5_

- [x] 3. Set up structured logging infrastructure
  - Create src/utils/logger.js using pino
  - Configure JSON output format with ISO 8601 timestamps
  - Set log level from environment variable (default: info)
  - Add helper functions for stage logging with traceId
  - _Requirements: 9.1, 9.2_

- [x] 4. Implement LLM wrapper with timeout handling
  - Create src/utils/llm-wrapper.js
  - Implement callLLM function with provider abstraction
  - Add 20-second timeout using AbortController
  - Implement provider-specific invocation for OpenAI and Anthropic
  - Add structured logging for call start, success, failure, and timeout events
  - Handle API key retrieval from environment variables
  - _Requirements: 5.1, 5.2, 5.4, 9.4_

- [x] 4.1 Write property test for LLM timeout enforcement
  - **Property 12: Model Timeout Enforcement**
  - **Validates: Requirements 5.2**
  - Test that calls exceeding 20s are aborted
  - Use fast-check with random delays (100 iterations minimum)
  - Tag: "Feature: trust360-v0-1-pipeline, Property 12"

- [x] 5. Implement Stage 1: createContext
  - Create src/stages/create-context.js
  - Generate UUID v4 trace ID using uuid library
  - Initialize Context_Object with request data, timestamps, and empty arrays
  - Add structured logging for context initialization
  - _Requirements: 2.1, 2.2, 3.1, 3.4_

- [x] 5.1 Write property test for Trace ID generation
  - **Property 5: Trace ID Generation and Format**
  - **Validates: Requirements 2.1, 2.2, 2.3**
  - Test UUID v4 format validation
  - Test uniqueness across multiple requests
  - Tag: "Feature: trust360-v0-1-pipeline, Property 5"

- [x] 5.2 Write property test for metadata preservation
  - **Property 4: Metadata Preservation**
  - **Validates: Requirements 1.6**
  - Test metadata accessibility throughout pipeline
  - Use fast-check to generate random metadata objects
  - Tag: "Feature: trust360-v0-1-pipeline, Property 4"

- [x] 6. Implement Stage 2: buildPrompt
  - Create src/stages/build-prompt.js
  - Define prompt template constant with JSON format instructions
  - Implement template substitution for question and conditional evidence
  - Add structured logging for prompt generation
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6.1 Write property test for question inclusion
  - **Property 9: Question Inclusion in Prompt**
  - **Validates: Requirements 4.2**
  - Test that generated prompts contain question text
  - Use fast-check to generate random questions
  - Tag: "Feature: trust360-v0-1-pipeline, Property 9"

- [x] 6.2 Write property test for conditional evidence inclusion
  - **Property 10: Conditional Evidence Inclusion**
  - **Validates: Requirements 4.3**
  - Test evidence presence/absence in prompt based on input
  - Tag: "Feature: trust360-v0-1-pipeline, Property 10"

- [x] 6.3 Write property test for prompt template structure
  - **Property 11: Prompt Template Structure**
  - **Validates: Requirements 4.4**
  - Test that prompts contain instructions for score, reasoning, confidence, assumptions
  - Tag: "Feature: trust360-v0-1-pipeline, Property 11"

- [x] 7. Implement model configuration system
  - Create src/config/models.js
  - Define MODEL_CONFIG array with OpenAI (gpt-4, gpt-3.5-turbo) and Anthropic (claude-3-opus)
  - Set 20-second timeout for all models
  - Export configuration for use in runLLMEnsemble stage
  - _Requirements: 5.1, 5.2_

- [x] 8. Implement Stage 3: runLLMEnsemble
  - Create src/stages/run-llm-ensemble.js
  - Implement parallel model execution using Promise.allSettled
  - Map results to rawResponses array with status, response, and error fields
  - Check for all-models-failed condition and throw error
  - Add structured logging for success/failure counts
  - _Requirements: 5.1, 5.2, 5.3, 3.1_

- [x] 8.1 Write property test for partial success handling
  - **Property 13: Partial Success Handling**
  - **Validates: Requirements 5.3**
  - Test pipeline continuation with at least 1 valid response
  - Tag: "Feature: trust360-v0-1-pipeline, Property 13"

- [x] 9. Implement validation utilities
  - Create src/utils/validation.js
  - Implement isValidModelResponse function with schema checks
  - Validate score (1-10), reasoning (non-empty string), confidence (0-1), assumptions (array)
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 9.1 Write property test for model response validation
  - **Property 14: Model Response Validation**
  - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
  - Test validation rules across generated responses
  - Use fast-check to generate valid and invalid responses
  - Tag: "Feature: trust360-v0-1-pipeline, Property 14"

- [x] 10. Implement Stage 4: parseOutputs
  - Create src/stages/parse-outputs.js
  - Parse JSON from raw responses with try-catch
  - Validate each parsed response using isValidModelResponse
  - Filter to validResponses array, excluding invalid entries
  - Add structured logging for parse failures and validation failures
  - _Requirements: 6.1, 6.2, 6.6, 6.7, 3.1_

- [x] 10.1 Write property test for invalid response exclusion
  - **Property 15: Invalid Response Exclusion**
  - **Validates: Requirements 6.6, 6.7**
  - Test that invalid responses are excluded from consensus
  - Tag: "Feature: trust360-v0-1-pipeline, Property 15"

- [x] 11. Implement consensus computation algorithms
  - Create src/utils/consensus.js
  - Implement calculateMOS function (arithmetic mean)
  - Implement calculateVariance function (mean of squared differences)
  - Implement classifyAgreement function with thresholds (<0.5 high, <1.5 medium, ≥1.5 low)
  - Round MOS and variance to 2 decimal places
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 11.1 Write property test for MOS calculation
  - **Property 16: MOS Calculation Correctness**
  - **Validates: Requirements 7.1**
  - Test arithmetic mean correctness across random score sets
  - Use fast-check to generate score arrays (100 iterations)
  - Tag: "Feature: trust360-v0-1-pipeline, Property 16"

- [x] 11.2 Write property test for variance calculation
  - **Property 17: Variance Calculation Correctness**
  - **Validates: Requirements 7.2**
  - Test variance formula correctness across random score sets
  - Tag: "Feature: trust360-v0-1-pipeline, Property 17"

- [x] 11.3 Write property test for agreement classification
  - **Property 18: Agreement Classification Thresholds**
  - **Validates: Requirements 7.3**
  - Test threshold boundaries: <0.5 high, <1.5 medium, ≥1.5 low
  - Use fast-check to generate variance values
  - Tag: "Feature: trust360-v0-1-pipeline, Property 18"

- [x] 12. Implement Stage 5: computeConsensus
  - Create src/stages/compute-consensus.js
  - Extract scores from validResponses
  - Call calculateMOS, calculateVariance, classifyAgreement
  - Build consensus object with mos, variance, agreement fields
  - Add structured logging for consensus results
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 3.1_

- [x] 12.1 Write property test for consensus report structure
  - **Property 19: Consensus Report Structure**
  - **Validates: Requirements 7.4, 8.4**
  - Test that consensus object contains required fields
  - Tag: "Feature: trust360-v0-1-pipeline, Property 19"

- [x] 13. Implement Stage 6: buildResponse
  - Create src/stages/build-response.js
  - Calculate execution time from startTime
  - Build metrics object with totalModels, successfulModels, failedModels, executionTimeMs
  - Construct TrustResponse with traceId, consensus, models, metrics
  - Add structured logging for response completion
  - _Requirements: 8.3, 8.5, 8.6, 3.1_

- [x] 13.1 Write property test for response structure completeness
  - **Property 22: Response Structure Completeness**
  - **Validates: Requirements 8.3, 8.5, 8.6**
  - Test that responses contain all required fields
  - Tag: "Feature: trust360-v0-1-pipeline, Property 22"

- [x] 14. Implement pipeline engine with stage registry
  - Create src/pipeline.js
  - Define stages array with all six stages in order
  - Implement executePipeline function with sequential stage execution
  - Add error handling with stage identification
  - Add structured logging for pipeline start/end
  - _Requirements: 3.1, 3.2, 3.3, 10.6, 10.7_

- [x] 14.1 Write property test for stage execution order
  - **Property 6: Stage Execution Order**
  - **Validates: Requirements 3.1, 3.2**
  - Test that stages execute in correct sequence
  - Tag: "Feature: trust360-v0-1-pipeline, Property 6"

- [x] 14.2 Write property test for stage function signature
  - **Property 8: Stage Function Signature**
  - **Validates: Requirements 3.4, 10.6**
  - Test that all stages follow async stage(ctx) => ctx pattern
  - Tag: "Feature: trust360-v0-1-pipeline, Property 8"

- [x] 14.3 Write property test for stage failure handling
  - **Property 7: Stage Failure Handling**
  - **Validates: Requirements 3.3**
  - Test that critical stage failures return 500 status
  - Tag: "Feature: trust360-v0-1-pipeline, Property 7"

- [x] 15. Checkpoint - Ensure all tests pass
  - Run all unit and property tests
  - Verify test coverage for core pipeline logic
  - Ask the user if questions arise

- [x] 16. Implement HTTP API with Fastify
  - Create src/server.js
  - Initialize Fastify with pino logger integration
  - Define POST /trust route with JSON schema validation
  - Implement request validation for question (1-2000 chars) and evidence (0-5000 chars)
  - Call executePipeline and handle response
  - Determine status code: 200 (all success), 206 (partial), 400 (validation), 500 (failure)
  - Format error responses with traceId, error, details, statusCode
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_

- [x] 16.1 Write property test for question length validation
  - **Property 1: Question Length Validation**
  - **Validates: Requirements 1.2**
  - Test rejection of questions exceeding 2000 characters
  - Use fast-check to generate long strings
  - Tag: "Feature: trust360-v0-1-pipeline, Property 1"

- [x] 16.2 Write property test for evidence length validation
  - **Property 2: Evidence Length Validation**
  - **Validates: Requirements 1.3**
  - Test rejection of evidence exceeding 5000 characters
  - Tag: "Feature: trust360-v0-1-pipeline, Property 2"

- [x] 16.3 Write property test for invalid request rejection
  - **Property 3: Invalid Request Rejection**
  - **Validates: Requirements 1.4, 1.5**
  - Test 400 status for malformed JSON, wrong types, missing fields
  - Tag: "Feature: trust360-v0-1-pipeline, Property 3"

- [x] 16.4 Write property test for success status code
  - **Property 20: Success Status Code**
  - **Validates: Requirements 8.1**
  - Test 200 status when all models succeed
  - Tag: "Feature: trust360-v0-1-pipeline, Property 20"

- [x] 16.5 Write property test for partial success status code
  - **Property 21: Partial Success Status Code**
  - **Validates: Requirements 8.2**
  - Test 206 status when some models fail but at least 1 succeeds
  - Tag: "Feature: trust360-v0-1-pipeline, Property 21"

- [x] 17. Add health check endpoint
  - Implement GET /health route
  - Return status, timestamp, version fields
  - _Requirements: 10.4_

- [x] 18. Implement application startup and configuration
  - Create src/index.js as entry point
  - Load environment variables from .env
  - Validate required API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY)
  - Initialize server and start listening on configured port (default 3000)
  - Add graceful shutdown handler for SIGTERM
  - Add startup logging with port and environment
  - _Requirements: 10.1, 10.2, 10.5_

- [x] 18.1 Write property test for stage lifecycle logging
  - **Property 23: Stage Lifecycle Logging**
  - **Validates: Requirements 9.3**
  - Test that log entries contain traceId for stage events
  - Tag: "Feature: trust360-v0-1-pipeline, Property 23"

- [x] 18.2 Write property test for model invocation logging
  - **Property 24: Model Invocation Logging**
  - **Validates: Requirements 9.4**
  - Test logging of model results with traceId, model, duration
  - Tag: "Feature: trust360-v0-1-pipeline, Property 24"

- [x] 18.3 Write property test for stage registry structure
  - **Property 25: Stage Registry Structure**
  - **Validates: Requirements 10.7**
  - Test that stage registry is an ordered array
  - Tag: "Feature: trust360-v0-1-pipeline, Property 25"

- [x] 19. Create integration test for end-to-end flow
  - Create tests/integration/trust-endpoint.test.js
  - Mock LLM wrapper to avoid external API calls
  - Test complete request flow: valid request → 200 response with consensus
  - Test partial failure: some models fail → 206 response
  - Test all models fail → 500 response
  - Test validation errors → 400 response
  - Verify response structure matches TrustResponse schema
  - _Requirements: 1.1, 3.1, 8.1, 8.2_

- [x] 20. Set up test configuration and scripts
  - Create vitest.config.js with coverage configuration
  - Add test scripts to package.json: test, test:unit, test:properties, test:coverage
  - Configure coverage thresholds (80% minimum)
  - Set up test environment variables for API keys (use mock values)
  - _Requirements: 10.3_

- [x] 21. Checkpoint - Run full test suite
  - Execute all unit tests, property tests, and integration tests
  - Verify 100 iterations minimum for all property tests
  - Check coverage report meets 80% threshold
  - Ensure all 25 properties are tested
  - Ask the user if questions arise

- [x] 22. Create Docker containerization
  - Create Dockerfile with Node.js 20+ base image
  - Copy package files and install production dependencies
  - Copy source code and set working directory
  - Expose port 3000
  - Set CMD to start application
  - Create .dockerignore for node_modules, tests, coverage
  - _Requirements: 10.5_

- [x] 23. Create documentation files
  - Create README.md with setup instructions, API documentation, and usage examples
  - Document environment variables in .env.example
  - Add API endpoint documentation with request/response examples
  - Include Docker run instructions
  - Document testing approach and how to run tests
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 24. Final checkpoint - End-to-end validation
  - Build Docker image and verify it starts successfully
  - Test health check endpoint returns 200
  - Test POST /trust with valid request (using real or mocked LLM calls)
  - Verify structured logs are emitted with trace IDs
  - Verify all tests pass in CI-like environment
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with minimum 100 iterations
- All property tests are tagged with "Feature: trust360-v0-1-pipeline, Property N"
- LLM calls should be mocked in tests to avoid external API dependencies
- The pipeline follows pure functional architecture: stage(ctx) → ctx
- Parallel model execution uses Promise.allSettled for fault tolerance
- Minimum 1 valid model response required for consensus computation
