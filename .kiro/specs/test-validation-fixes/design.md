# Test Validation Fixes Bugfix Design

## Overview

This bugfix addresses 8 distinct bugs across 4 categories in the Trust360 v0.1 Pipeline: request validation (5 bugs), status code handling (1 bug), context preservation (1 bug), and metrics calculation (1 bug). The bugs cause the API to return incorrect HTTP status codes for validation errors, fail to communicate partial success scenarios, lose context data during pipeline execution, and report inaccurate execution metrics.

The fix strategy involves:
1. Adding explicit request validation before pipeline execution (bugs 1.1-1.5)
2. Correcting status code logic for partial success scenarios (bug 1.6)
3. Fixing evidence field preservation logic in buildPrompt stage (bug 1.7)
4. Correcting execution time calculation in buildResponse stage (bug 1.8)

## Glossary

- **Bug_Condition (C)**: The condition that triggers each bug - invalid request types, partial success scenarios, empty string evidence, or execution time calculation
- **Property (P)**: The desired behavior - proper validation with 400 status codes, 206 for partial success, evidence preservation, and accurate metrics
- **Preservation**: Existing behaviors that must remain unchanged - 200 status for full success, valid request processing, non-empty evidence handling, and all other pipeline functionality
- **Request Validation**: The process of checking request body fields (question, evidence, metadata) for type correctness and required field presence before pipeline execution
- **Partial Success**: A scenario where some LLM models fail but at least one succeeds, requiring HTTP 206 status code
- **Evidence Field**: Optional string field in request body that provides context for trust evaluation
- **Execution Time Metric**: The executionTimeMs field in response metrics that reports pipeline execution duration
- **Context Object (ctx)**: The object passed through pipeline stages containing request data, intermediate results, and metadata

## Bug Details

### Bug Condition 1: Invalid Question Type Returns 500

The bug manifests when a request contains a question field with an invalid type (integer, boolean, null, array, or object). The Fastify schema validation is not catching these type errors, causing the pipeline to fail with a 500 error instead of returning a 400 validation error.

**Formal Specification:**
```
FUNCTION isBugCondition1(input)
  INPUT: input of type HTTPRequest
  OUTPUT: boolean
  
  RETURN input.body.question EXISTS
         AND typeof(input.body.question) IN ['number', 'boolean', 'object']
         OR input.body.question === null
END FUNCTION
```

### Bug Condition 2: Invalid Evidence Type Returns 500

The bug manifests when a request contains an evidence field with an invalid type (integer, boolean, null, array, or object). The Fastify schema validation allows evidence to be optional but does not properly validate its type when present.

**Formal Specification:**
```
FUNCTION isBugCondition2(input)
  INPUT: input of type HTTPRequest
  OUTPUT: boolean
  
  RETURN input.body.evidence EXISTS
         AND typeof(input.body.evidence) IN ['number', 'boolean', 'object']
         OR input.body.evidence === null
END FUNCTION
```

### Bug Condition 3: Invalid Metadata Type Returns 500

The bug manifests when a request contains a metadata field with an invalid type (string, integer, boolean, null, or array). The Fastify schema specifies metadata should be an object but does not properly reject other types.

**Formal Specification:**
```
FUNCTION isBugCondition3(input)
  INPUT: input of type HTTPRequest
  OUTPUT: boolean
  
  RETURN input.body.metadata EXISTS
         AND (typeof(input.body.metadata) IN ['string', 'number', 'boolean']
              OR input.body.metadata === null
              OR Array.isArray(input.body.metadata))
END FUNCTION
```

### Bug Condition 4: Missing Question Field Returns 500

The bug manifests when a request is missing the required question field. The Fastify schema marks question as required but the validation is not properly enforced.

**Formal Specification:**
```
FUNCTION isBugCondition4(input)
  INPUT: input of type HTTPRequest
  OUTPUT: boolean
  
  RETURN input.body.question DOES_NOT_EXIST
         OR input.body.question === undefined
END FUNCTION
```

### Bug Condition 5: Empty String Question Returns 500

The bug manifests when a request contains an empty string for the question field. The Fastify schema specifies minLength: 1 but this validation is not properly enforced.

**Formal Specification:**
```
FUNCTION isBugCondition5(input)
  INPUT: input of type HTTPRequest
  OUTPUT: boolean
  
  RETURN input.body.question EXISTS
         AND typeof(input.body.question) === 'string'
         AND input.body.question.length === 0
END FUNCTION
```

### Bug Condition 6: Partial Success Returns 500

The bug manifests when some LLM models fail but at least one succeeds and all pipeline stages complete successfully. The status code logic in server.js only checks if failedModels > 0 but does not verify that at least one model succeeded.

**Formal Specification:**
```
FUNCTION isBugCondition6(result)
  INPUT: result of type PipelineResult
  OUTPUT: boolean
  
  RETURN result.metrics.failedModels > 0
         AND result.metrics.successfulModels > 0
         AND pipelineCompletedSuccessfully(result)
END FUNCTION
```

### Bug Condition 7: Empty String Evidence Not Preserved

The bug manifests when the evidence field is an empty string. The buildPrompt stage uses a truthy check (`ctx.evidence`) which treats empty string as falsy, causing it to be omitted from the context instead of preserved.

**Formal Specification:**
```
FUNCTION isBugCondition7(input)
  INPUT: input of type Context
  OUTPUT: boolean
  
  RETURN input.evidence EXISTS
         AND typeof(input.evidence) === 'string'
         AND input.evidence.length === 0
END FUNCTION
```

### Bug Condition 8: Execution Time Returns 0

The bug manifests when a successful request completes. The buildResponse stage calculates executionTimeMs but the startTime is not being set correctly in the context, causing the calculation to return 0 or a negative value.

**Formal Specification:**
```
FUNCTION isBugCondition8(ctx)
  INPUT: ctx of type Context
  OUTPUT: boolean
  
  RETURN ctx.startTime DOES_NOT_EXIST
         OR ctx.startTime === undefined
         OR ctx.startTime === null
END FUNCTION
```

### Examples

**Bug 1 - Invalid Question Type:**
- Request: `{ question: 123, evidence: "test" }` → Returns 500, should return 400
- Request: `{ question: true, evidence: "test" }` → Returns 500, should return 400
- Request: `{ question: null, evidence: "test" }` → Returns 500, should return 400

**Bug 2 - Invalid Evidence Type:**
- Request: `{ question: "Is this true?", evidence: 123 }` → Returns 500, should return 400
- Request: `{ question: "Is this true?", evidence: ["array"] }` → Returns 500, should return 400

**Bug 3 - Invalid Metadata Type:**
- Request: `{ question: "Is this true?", metadata: "string" }` → Returns 500, should return 400
- Request: `{ question: "Is this true?", metadata: null }` → Returns 500, should return 400

**Bug 4 - Missing Question:**
- Request: `{ evidence: "test" }` → Returns 500, should return 400

**Bug 5 - Empty Question:**
- Request: `{ question: "", evidence: "test" }` → Returns 500, should return 400

**Bug 6 - Partial Success:**
- Result: `{ metrics: { failedModels: 1, successfulModels: 2 } }` → Returns 500, should return 206

**Bug 7 - Empty Evidence:**
- Context: `{ evidence: "" }` → Evidence section omitted, should be preserved

**Bug 8 - Execution Time:**
- Context: `{ startTime: undefined }` → executionTimeMs = 0, should be positive value

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- HTTP 200 status code when all LLM models succeed and all pipeline stages complete successfully
- Valid request processing when question, evidence, and metadata fields have correct types
- Non-empty evidence string inclusion in prompt template
- Evidence section omission when evidence is null or undefined
- Response structure including traceId, consensus, models array, and metrics
- Model response validation for score, reasoning, confidence, and assumptions fields
- Consensus calculation for MOS, variance, and agreement classification
- Unique trace ID generation for each request
- Metadata preservation in context object
- HTTP 500 status code when all models fail

**Scope:**
All inputs that do NOT involve the 8 specific bug conditions should be completely unaffected by this fix. This includes:
- Valid requests with proper types and non-empty required fields
- Full success scenarios (all models succeed)
- Complete failure scenarios (all models fail)
- Non-empty evidence strings
- Null or undefined evidence values
- All other pipeline stages and their functionality

## Hypothesized Root Cause

Based on the bug descriptions and code analysis, the root causes are:

### Bugs 1-5: Request Validation Issues

**Root Cause**: Fastify schema validation is not being properly enforced or is configured incorrectly.

Possible issues:
1. **Schema Validation Not Enabled**: Fastify may not be configured to validate request bodies against the schema
2. **Schema Definition Issues**: The schema may not properly specify type constraints or required fields
3. **Error Handler Missing**: Fastify validation errors may not be caught and converted to 400 responses
4. **Type Coercion**: Fastify may be attempting type coercion instead of strict validation

Evidence from code:
- The schema in server.js defines types and constraints but validation failures result in 500 errors
- No explicit validation error handler is visible in the server configuration
- The try-catch block catches all errors and returns 500, including validation errors

### Bug 6: Status Code Logic Error

**Root Cause**: The status code determination logic in server.js line 52 is incomplete.

Current logic:
```javascript
const statusCode = result.metrics.failedModels > 0 ? 206 : 200;
```

This logic returns 206 whenever any models fail, but it doesn't verify that at least one model succeeded. If all models fail, the pipeline throws an error before reaching this line, but the logic is still incorrect for the partial success case.

Evidence from code:
- The condition only checks `failedModels > 0` without checking `successfulModels > 0`
- This could theoretically return 206 even if all models failed (though pipeline would error first)

### Bug 7: Evidence Field Truthy Check

**Root Cause**: The buildPrompt stage uses a truthy check for evidence field presence.

Current logic in build-prompt.js line 48:
```javascript
const evidenceSection = ctx.evidence 
  ? `EVIDENCE:\n${ctx.evidence}\n\n` 
  : '';
```

This truthy check treats empty string (`""`) as falsy, causing it to be omitted. The correct behavior should distinguish between:
- `undefined` or `null` → omit evidence section
- Empty string `""` → include evidence section with empty content
- Non-empty string → include evidence section with content

Evidence from code:
- The comment says "truthy check" which confirms this is intentional but incorrect
- Empty string is a valid value that should be preserved

### Bug 8: Missing startTime Initialization

**Root Cause**: The context object does not have startTime set before pipeline execution begins.

Current logic in build-response.js line 21:
```javascript
const executionTimeMs = Date.now() - ctx.startTime;
```

This calculation assumes ctx.startTime exists, but examining pipeline.js shows no initialization of startTime in the context. The createContext stage likely needs to set this value.

Evidence from code:
- pipeline.js does not set ctx.startTime before executing stages
- buildResponse assumes startTime exists but it's never initialized
- This would result in `Date.now() - undefined` which equals NaN or 0

## Correctness Properties

Property 1: Bug Condition - Request Validation Returns 400

_For any_ HTTP request where the question field has an invalid type (integer, boolean, null, array, object), is missing, or is an empty string, OR where the evidence field has an invalid type (integer, boolean, null, array, object), OR where the metadata field has an invalid type (string, integer, boolean, null, array), the server SHALL return HTTP 400 status code with validation error details.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Bug Condition - Partial Success Returns 206

_For any_ pipeline execution result where some LLM models failed but at least one succeeded and all pipeline stages completed successfully, the server SHALL return HTTP 206 status code with complete response structure including consensus computed from successful models only.

**Validates: Requirements 2.6**

Property 3: Bug Condition - Empty Evidence Preservation

_For any_ request where the evidence field is an empty string, the buildPrompt stage SHALL preserve it correctly in the context object and include an empty evidence section in the prompt template.

**Validates: Requirements 2.7**

Property 4: Bug Condition - Execution Time Calculation

_For any_ successful request that completes pipeline execution, the executionTimeMs metric SHALL return a positive millisecond value representing the actual execution time from pipeline start to response building.

**Validates: Requirements 2.8**

Property 5: Preservation - Valid Request Processing

_For any_ HTTP request with valid question (non-empty string), valid evidence (string, null, or undefined), and valid metadata (object, null, or undefined), the server SHALL continue to accept and process the request successfully, returning HTTP 200 or 206 based on model success rates.

**Validates: Requirements 3.1, 3.2**

Property 6: Preservation - Evidence Handling

_For any_ request where the evidence field is a non-empty string, null, or undefined, the buildPrompt stage SHALL continue to handle it correctly: including non-empty strings in the prompt template and omitting the evidence section for null or undefined values.

**Validates: Requirements 3.3, 3.4**

Property 7: Preservation - Response Structure and Processing

_For any_ request that completes pipeline execution, the response SHALL continue to include traceId, consensus, models array, and metrics; model responses SHALL continue to be validated for required fields; consensus SHALL continue to be calculated correctly; each request SHALL continue to receive a unique trace ID; metadata SHALL continue to be preserved; and complete failures SHALL continue to return HTTP 500.

**Validates: Requirements 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

Based on root cause analysis, the following changes are needed:

**File**: `src/server.js`

**Function**: `createServer`

**Specific Changes**:

1. **Enable Schema Validation Error Handling**: Add a Fastify error handler to catch schema validation errors and return 400 status codes
   - Add `setErrorHandler` configuration to catch validation errors
   - Check if error is a validation error (error.validation exists)
   - Return 400 with validation error details instead of 500

2. **Add Explicit Request Validation**: Add manual validation logic before pipeline execution to catch edge cases
   - Validate question field: must be non-empty string
   - Validate evidence field: must be string, null, or undefined (not other types)
   - Validate metadata field: must be object, null, or undefined (not other types)
   - Return 400 with specific error messages for validation failures

3. **Fix Partial Success Status Code Logic**: Update status code determination to properly handle partial success
   - Change condition from `result.metrics.failedModels > 0 ? 206 : 200`
   - To: `result.metrics.failedModels > 0 && result.metrics.successfulModels > 0 ? 206 : 200`
   - This ensures 206 is only returned when there's actual partial success

**File**: `src/stages/build-prompt.js`

**Function**: `buildPrompt`

**Specific Changes**:

4. **Fix Evidence Field Preservation**: Change truthy check to explicit null/undefined check
   - Replace: `const evidenceSection = ctx.evidence ? ... : '';`
   - With: `const evidenceSection = ctx.evidence !== null && ctx.evidence !== undefined ? ... : '';`
   - This preserves empty string evidence while still omitting null/undefined

**File**: `src/stages/create-context.js` (assumed to exist)

**Function**: `createContext`

**Specific Changes**:

5. **Initialize startTime**: Add startTime to context object at pipeline start
   - Set `ctx.startTime = Date.now()` when creating initial context
   - This enables accurate execution time calculation in buildResponse

**Alternative if create-context.js doesn't set startTime**:

**File**: `src/pipeline.js`

**Function**: `executePipeline`

**Specific Changes**:

5. **Initialize startTime in Pipeline**: Add startTime to initial context object
   - Change: `let ctx = { request: requestBody };`
   - To: `let ctx = { request: requestBody, startTime: Date.now() };`
   - This ensures startTime is available for execution time calculation

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that send invalid requests and partial success scenarios to the API, then observe the actual status codes and behavior. Run these tests on the UNFIXED code to observe failures and understand the root causes.

**Test Cases**:

1. **Invalid Question Type Test**: Send requests with question as integer, boolean, null, array, object (will fail on unfixed code - returns 500 instead of 400)

2. **Invalid Evidence Type Test**: Send requests with evidence as integer, boolean, null, array, object (will fail on unfixed code - returns 500 instead of 400)

3. **Invalid Metadata Type Test**: Send requests with metadata as string, integer, boolean, null, array (will fail on unfixed code - returns 500 instead of 400)

4. **Missing Question Test**: Send request without question field (will fail on unfixed code - returns 500 instead of 400)

5. **Empty Question Test**: Send request with empty string question (will fail on unfixed code - returns 500 instead of 400)

6. **Partial Success Test**: Mock LLM ensemble to have some models fail and some succeed (will fail on unfixed code - returns 500 instead of 206)

7. **Empty Evidence Preservation Test**: Send request with empty string evidence and verify context (will fail on unfixed code - evidence not preserved)

8. **Execution Time Test**: Send valid request and check executionTimeMs metric (will fail on unfixed code - returns 0 instead of positive value)

**Expected Counterexamples**:
- Validation errors return 500 status code with generic error messages
- Partial success scenarios return 500 instead of 206
- Empty string evidence is omitted from context
- Execution time metric is 0 or NaN
- Possible causes: missing validation error handler, incomplete status code logic, incorrect truthy check, missing startTime initialization

### Fix Checking

**Goal**: Verify that for all inputs where the bug conditions hold, the fixed functions produce the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition1(input) OR isBugCondition2(input) OR ... OR isBugCondition5(input) DO
  response := POST_fixed('/trust', input)
  ASSERT response.statusCode === 400
  ASSERT response.body.error EXISTS
END FOR

FOR ALL result WHERE isBugCondition6(result) DO
  statusCode := determineStatusCode_fixed(result)
  ASSERT statusCode === 206
END FOR

FOR ALL ctx WHERE isBugCondition7(ctx) DO
  newCtx := buildPrompt_fixed(ctx)
  ASSERT newCtx.evidence === ""
  ASSERT newCtx.prompt CONTAINS "EVIDENCE:"
END FOR

FOR ALL ctx WHERE isBugCondition8(ctx) DO
  newCtx := executePipeline_fixed(ctx.request)
  ASSERT newCtx.response.metrics.executionTimeMs > 0
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed functions produce the same result as the original functions.

**Pseudocode:**
```
FOR ALL input WHERE NOT (isBugCondition1(input) OR ... OR isBugCondition5(input)) DO
  ASSERT POST_original('/trust', input).statusCode = POST_fixed('/trust', input).statusCode
  ASSERT POST_original('/trust', input).body = POST_fixed('/trust', input).body
END FOR

FOR ALL result WHERE NOT isBugCondition6(result) DO
  ASSERT determineStatusCode_original(result) = determineStatusCode_fixed(result)
END FOR

FOR ALL ctx WHERE NOT isBugCondition7(ctx) DO
  ASSERT buildPrompt_original(ctx).evidence = buildPrompt_fixed(ctx).evidence
  ASSERT buildPrompt_original(ctx).prompt = buildPrompt_fixed(ctx).prompt
END FOR

FOR ALL ctx WHERE NOT isBugCondition8(ctx) DO
  // If startTime exists, execution time should be calculated the same way
  ASSERT buildResponse_original(ctx).response.metrics.executionTimeMs 
         = buildResponse_fixed(ctx).response.metrics.executionTimeMs
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for valid requests, full success scenarios, non-empty evidence, and existing startTime contexts, then write property-based tests capturing that behavior.

**Test Cases**:

1. **Valid Request Preservation**: Observe that valid requests (non-empty string question, valid evidence/metadata types) return 200 or 206 on unfixed code, then verify this continues after fix

2. **Full Success Preservation**: Observe that requests where all models succeed return 200 on unfixed code, then verify this continues after fix

3. **Complete Failure Preservation**: Observe that requests where all models fail return 500 on unfixed code, then verify this continues after fix

4. **Non-Empty Evidence Preservation**: Observe that non-empty evidence strings are included in prompts on unfixed code, then verify this continues after fix

5. **Null/Undefined Evidence Preservation**: Observe that null or undefined evidence is omitted from prompts on unfixed code, then verify this continues after fix

6. **Response Structure Preservation**: Observe that responses include traceId, consensus, models, and metrics on unfixed code, then verify this continues after fix

7. **Metadata Preservation**: Observe that metadata is preserved in context on unfixed code, then verify this continues after fix

8. **Unique Trace ID Preservation**: Observe that each request gets a unique trace ID on unfixed code, then verify this continues after fix

### Unit Tests

- Test validation error handler catches schema validation errors and returns 400
- Test manual validation logic for question, evidence, and metadata fields
- Test status code determination for full success (200), partial success (206), and complete failure (500)
- Test evidence field handling for empty string, non-empty string, null, and undefined
- Test execution time calculation with valid startTime
- Test edge cases: very long strings, special characters, boundary values

### Property-Based Tests

- Generate random invalid request bodies and verify all return 400 status codes
- Generate random valid request bodies and verify all are accepted and processed
- Generate random model success/failure combinations and verify correct status codes
- Generate random evidence values (strings of various lengths, null, undefined) and verify correct handling
- Generate random pipeline execution scenarios and verify positive execution times

### Integration Tests

- Test full request flow with invalid inputs and verify 400 responses
- Test full request flow with partial model failures and verify 206 response
- Test full request flow with empty evidence and verify preservation
- Test full request flow and verify accurate execution time metrics
- Test that all existing integration tests continue to pass
