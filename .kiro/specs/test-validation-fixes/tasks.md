# Implementation Plan

- [ ] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Request Validation and Status Code Bugs
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failures confirm the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior - they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate all 8 bugs exist
  - **Scoped PBT Approach**: For deterministic bugs, scope properties to concrete failing cases to ensure reproducibility
  
  - [x] 1.1 Test invalid question type returns 400 (Bug 1)
    - Test that requests with question as integer, boolean, null, array, or object return 400 status code
    - Bug Condition: `typeof(request.body.question) IN ['number', 'boolean', 'object'] OR request.body.question === null`
    - Expected: HTTP 400 with validation error details
    - Run on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (returns 500 instead of 400)
    - Document counterexamples: `{ question: 123 }`, `{ question: true }`, `{ question: null }`
    - _Requirements: 2.1_
  
  - [x] 1.2 Test invalid evidence type returns 400 (Bug 2)
    - Test that requests with evidence as integer, boolean, null, array, or object return 400 status code
    - Bug Condition: `typeof(request.body.evidence) IN ['number', 'boolean', 'object'] OR request.body.evidence === null`
    - Expected: HTTP 400 with validation error details
    - Run on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (returns 500 instead of 400)
    - Document counterexamples: `{ question: "test", evidence: 123 }`, `{ question: "test", evidence: ["array"] }`
    - _Requirements: 2.2_
  
  - [x] 1.3 Test invalid metadata type returns 400 (Bug 3)
    - Test that requests with metadata as string, integer, boolean, null, or array return 400 status code
    - Bug Condition: `typeof(request.body.metadata) IN ['string', 'number', 'boolean'] OR request.body.metadata === null OR Array.isArray(request.body.metadata)`
    - Expected: HTTP 400 with validation error details
    - Run on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (returns 500 instead of 400)
    - Document counterexamples: `{ question: "test", metadata: "string" }`, `{ question: "test", metadata: null }`
    - _Requirements: 2.3_
  
  - [x] 1.4 Test missing question field returns 400 (Bug 4)
    - Test that requests without question field return 400 status code
    - Bug Condition: `request.body.question DOES_NOT_EXIST OR request.body.question === undefined`
    - Expected: HTTP 400 with validation error details
    - Run on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (returns 500 instead of 400)
    - Document counterexample: `{ evidence: "test" }`
    - _Requirements: 2.4_
  
  - [x] 1.5 Test empty string question returns 400 (Bug 5)
    - Test that requests with empty string question return 400 status code
    - Bug Condition: `request.body.question === ""`
    - Expected: HTTP 400 with validation error details
    - Run on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (returns 500 instead of 400)
    - Document counterexample: `{ question: "", evidence: "test" }`
    - _Requirements: 2.5_
  
  - [x] 1.6 Test partial success returns 206 (Bug 6)
    - Test that pipeline results with some failed and some successful models return 206 status code
    - Bug Condition: `result.metrics.failedModels > 0 AND result.metrics.successfulModels > 0`
    - Expected: HTTP 206 with complete response structure
    - Mock LLM ensemble to have 1 model fail and 2 succeed
    - Run on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (returns 500 instead of 206)
    - Document counterexample: `{ metrics: { failedModels: 1, successfulModels: 2 } }`
    - _Requirements: 2.6_
  
  - [x] 1.7 Test empty string evidence preservation (Bug 7)
    - Test that empty string evidence is preserved in context and included in prompt
    - Bug Condition: `ctx.evidence === ""`
    - Expected: Evidence section included in prompt with empty content
    - Send request with `{ question: "test", evidence: "" }`
    - Run on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (evidence section omitted from prompt)
    - Document counterexample: Empty evidence not preserved in context
    - _Requirements: 2.7_
  
  - [x] 1.8 Test execution time calculation (Bug 8)
    - Test that executionTimeMs metric returns positive value
    - Bug Condition: `ctx.startTime DOES_NOT_EXIST OR ctx.startTime === undefined OR ctx.startTime === null`
    - Expected: executionTimeMs > 0
    - Send valid request and check metrics
    - Run on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (executionTimeMs is 0 or NaN)
    - Document counterexample: executionTimeMs = 0 for successful request
    - _Requirements: 2.8_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Behavior Preservation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  
  - [x] 2.1 Test valid request processing preservation
    - Observe: Valid requests with non-empty string question, valid evidence/metadata types return 200 or 206 on unfixed code
    - Write property: For all requests with valid types and non-empty question, status code is 200 or 206
    - Non-bug condition: `typeof(question) === 'string' AND question.length > 0 AND (evidence is string/null/undefined) AND (metadata is object/null/undefined)`
    - Verify test passes on UNFIXED code
    - _Requirements: 3.1, 3.2_
  
  - [x] 2.2 Test full success status code preservation
    - Observe: Requests where all models succeed return 200 on unfixed code
    - Write property: For all results with failedModels = 0, status code is 200
    - Non-bug condition: `result.metrics.failedModels === 0`
    - Verify test passes on UNFIXED code
    - _Requirements: 3.1_
  
  - [x] 2.3 Test complete failure status code preservation
    - Observe: Requests where all models fail return 500 on unfixed code
    - Write property: For all results with successfulModels = 0, status code is 500
    - Non-bug condition: `result.metrics.successfulModels === 0`
    - Verify test passes on UNFIXED code
    - _Requirements: 3.10_
  
  - [x] 2.4 Test non-empty evidence handling preservation
    - Observe: Non-empty evidence strings are included in prompts on unfixed code
    - Write property: For all requests with non-empty evidence string, prompt contains "EVIDENCE:" section
    - Non-bug condition: `typeof(evidence) === 'string' AND evidence.length > 0`
    - Verify test passes on UNFIXED code
    - _Requirements: 3.3_
  
  - [x] 2.5 Test null/undefined evidence handling preservation
    - Observe: Null or undefined evidence is omitted from prompts on unfixed code
    - Write property: For all requests with null or undefined evidence, prompt does not contain "EVIDENCE:" section
    - Non-bug condition: `evidence === null OR evidence === undefined`
    - Verify test passes on UNFIXED code
    - _Requirements: 3.4_
  
  - [x] 2.6 Test response structure preservation
    - Observe: Responses include traceId, consensus, models array, and metrics on unfixed code
    - Write property: For all successful requests, response has required structure
    - Verify test passes on UNFIXED code
    - _Requirements: 3.5_
  
  - [x] 2.7 Test model response validation preservation
    - Observe: Model responses are validated for score, reasoning, confidence, assumptions on unfixed code
    - Write property: For all model responses, required fields are present and valid
    - Verify test passes on UNFIXED code
    - _Requirements: 3.6_
  
  - [x] 2.8 Test consensus calculation preservation
    - Observe: Consensus is calculated correctly for MOS, variance, agreement on unfixed code
    - Write property: For all successful requests, consensus values are calculated correctly
    - Verify test passes on UNFIXED code
    - _Requirements: 3.7_
  
  - [x] 2.9 Test unique trace ID preservation
    - Observe: Each request gets a unique trace ID on unfixed code
    - Write property: For all requests, trace IDs are unique
    - Verify test passes on UNFIXED code
    - _Requirements: 3.8_
  
  - [x] 2.10 Test metadata preservation
    - Observe: Metadata is preserved in context object on unfixed code
    - Write property: For all requests with metadata, it is preserved throughout pipeline
    - Verify test passes on UNFIXED code
    - _Requirements: 3.9_

- [ ] 3. Fix for test validation bugs

  - [x] 3.1 Add validation error handler in server.js
    - Add Fastify `setErrorHandler` to catch schema validation errors
    - Check if error is validation error (error.validation exists)
    - Return 400 status code with validation error details
    - Return 500 for non-validation errors
    - _Bug_Condition: isBugCondition1-5 from design (invalid types, missing fields, empty strings)_
    - _Expected_Behavior: HTTP 400 with validation error details for all invalid requests_
    - _Preservation: Valid requests continue to be processed normally_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

  - [x] 3.2 Add explicit request validation in server.js
    - Add manual validation before pipeline execution
    - Validate question: must be non-empty string
    - Validate evidence: must be string, null, or undefined (reject other types)
    - Validate metadata: must be object, null, or undefined (reject other types)
    - Return 400 with specific error messages for validation failures
    - _Bug_Condition: isBugCondition1-5 from design_
    - _Expected_Behavior: HTTP 400 for all invalid request types_
    - _Preservation: Valid requests continue to be processed_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

  - [x] 3.3 Fix partial success status code logic in server.js
    - Locate status code determination logic (around line 52)
    - Change from: `result.metrics.failedModels > 0 ? 206 : 200`
    - Change to: `result.metrics.failedModels > 0 && result.metrics.successfulModels > 0 ? 206 : 200`
    - This ensures 206 only for actual partial success (some fail, some succeed)
    - _Bug_Condition: isBugCondition6 from design (failedModels > 0 AND successfulModels > 0)_
    - _Expected_Behavior: HTTP 206 for partial success scenarios_
    - _Preservation: Full success (200) and complete failure (500) unchanged_
    - _Requirements: 2.6, 3.1, 3.10_

  - [x] 3.4 Fix evidence field preservation in build-prompt.js
    - Locate evidence section logic (around line 48)
    - Change from: `const evidenceSection = ctx.evidence ? ... : '';`
    - Change to: `const evidenceSection = ctx.evidence !== null && ctx.evidence !== undefined ? ... : '';`
    - This preserves empty string while omitting null/undefined
    - _Bug_Condition: isBugCondition7 from design (evidence === "")_
    - _Expected_Behavior: Empty string evidence preserved in prompt_
    - _Preservation: Non-empty strings included, null/undefined omitted_
    - _Requirements: 2.7, 3.3, 3.4_

  - [x] 3.5 Initialize startTime for execution time calculation
    - Check if create-context.js exists and sets startTime
    - If yes: Add `ctx.startTime = Date.now()` in createContext function
    - If no: Add startTime to initial context in pipeline.js
    - Change: `let ctx = { request: requestBody };`
    - To: `let ctx = { request: requestBody, startTime: Date.now() };`
    - This enables accurate execution time calculation in buildResponse
    - _Bug_Condition: isBugCondition8 from design (startTime undefined/null)_
    - _Expected_Behavior: executionTimeMs > 0 for all requests_
    - _Preservation: All other context fields and pipeline behavior unchanged_
    - _Requirements: 2.8_

  - [x] 3.6 Fix error response format to match test expectations
    - Update validation error handler in server.js to include `message` field
    - Change error response from `{ error, details, statusCode }` to `{ error, message, statusCode }`
    - For Fastify validation errors, format message from validation array
    - For manual validation errors, use the details string as message
    - Ensure all 400 responses have consistent structure
    - _Bug_Condition: Error responses missing expected `message` field_
    - _Expected_Behavior: All validation errors include error, message, and statusCode fields_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.7 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - All Bugs Fixed
    - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run all 8 bug condition tests from step 1
    - **EXPECTED OUTCOME**: All tests PASS (confirms all bugs are fixed)
    - **CURRENT STATUS**: 25 tests still failing across 7 test files
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ] 3.7 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - All Bugs Fixed
    - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run all 8 bug condition tests from step 1
    - **EXPECTED OUTCOME**: All tests PASS (confirms all bugs are fixed)
    - **CURRENT STATUS**: 25 tests still failing across 7 test files
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - No Regressions
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run all 10 preservation property tests from step 2
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
    - Confirm all existing behavior is preserved after fixes

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run all bug condition exploration tests (should now pass)
  - Run all preservation property tests (should still pass)
  - Run existing unit tests (should all pass)
  - Run existing integration tests (should all pass)
  - Verify no regressions in any existing functionality
  - If any tests fail, investigate and fix before proceeding
  - **CURRENT STATUS**: Need to investigate and fix 25 failing tests
  - Ask the user if questions arise
