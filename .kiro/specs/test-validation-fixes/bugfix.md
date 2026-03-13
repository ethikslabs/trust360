# Bugfix Requirements Document

## Introduction

The Trust360 v0.1 Pipeline has 17 failing property-based tests across 4 distinct bug categories. These failures indicate critical issues with request validation, status code handling, context preservation, and metrics calculation. The bugs affect the API's ability to properly validate inputs, communicate partial success scenarios, preserve context data through pipeline stages, and report accurate execution metrics.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a request contains an invalid question type (integer, boolean, null, array, or object) THEN the system returns HTTP 500 status code instead of 400

1.2 WHEN a request contains an invalid evidence type (integer, boolean, null, array, or object) THEN the system returns HTTP 500 status code instead of 400

1.3 WHEN a request contains an invalid metadata type (string, integer, boolean, null, or array) THEN the system returns HTTP 500 status code instead of 400

1.4 WHEN a request is missing the required question field THEN the system returns HTTP 500 status code instead of 400

1.5 WHEN a request contains an empty string question THEN the system returns HTTP 500 status code instead of 400

1.6 WHEN some LLM models fail but at least one succeeds and all pipeline stages complete THEN the system returns HTTP 500 status code instead of 206

1.7 WHEN the evidence field is an empty string THEN the buildPrompt stage does not preserve it correctly in the context

1.8 WHEN a successful request completes THEN the executionTimeMs metric returns 0 instead of a positive millisecond value

### Expected Behavior (Correct)

2.1 WHEN a request contains an invalid question type (integer, boolean, null, array, or object) THEN the system SHALL return HTTP 400 status code with validation error details

2.2 WHEN a request contains an invalid evidence type (integer, boolean, null, array, or object) THEN the system SHALL return HTTP 400 status code with validation error details

2.3 WHEN a request contains an invalid metadata type (string, integer, boolean, null, or array) THEN the system SHALL return HTTP 400 status code with validation error details

2.4 WHEN a request is missing the required question field THEN the system SHALL return HTTP 400 status code with validation error details

2.5 WHEN a request contains an empty string question THEN the system SHALL return HTTP 400 status code with validation error details

2.6 WHEN some LLM models fail but at least one succeeds and all pipeline stages complete THEN the system SHALL return HTTP 206 status code with complete response structure including consensus computed from successful models only

2.7 WHEN the evidence field is an empty string THEN the buildPrompt stage SHALL preserve it correctly in the context object

2.8 WHEN a successful request completes THEN the executionTimeMs metric SHALL return a positive millisecond value representing the actual execution time

### Unchanged Behavior (Regression Prevention)

3.1 WHEN all LLM models succeed and all pipeline stages complete successfully THEN the system SHALL CONTINUE TO return HTTP 200 status code

3.2 WHEN a request contains valid question, evidence, and metadata fields with correct types THEN the system SHALL CONTINUE TO accept and process the request successfully

3.3 WHEN the evidence field is a non-empty string THEN the buildPrompt stage SHALL CONTINUE TO include it in the prompt template

3.4 WHEN the evidence field is null or undefined THEN the buildPrompt stage SHALL CONTINUE TO omit the evidence section from the prompt

3.5 WHEN pipeline execution completes successfully THEN the response SHALL CONTINUE TO include traceId, consensus, models array, and metrics

3.6 WHEN model responses are parsed THEN the system SHALL CONTINUE TO validate score, reasoning, confidence, and assumptions fields

3.7 WHEN consensus is computed THEN the system SHALL CONTINUE TO calculate MOS, variance, and agreement classification correctly

3.8 WHEN multiple requests are processed THEN each SHALL CONTINUE TO receive a unique trace ID

3.9 WHEN a request includes metadata THEN the system SHALL CONTINUE TO preserve it in the context object

3.10 WHEN all models fail THEN the system SHALL CONTINUE TO return HTTP 500 status code with error details
