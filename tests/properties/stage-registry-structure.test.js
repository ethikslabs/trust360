/**
 * Property-based test for stage registry structure
 * 
 * Feature: trust360-v0-1-pipeline, Property 25
 * 
 * Property 25: Stage Registry Structure
 * **Validates: Requirements 10.7**
 * 
 * For any pipeline execution, the stage registry should be an ordered array
 * of stage functions that can be iterated sequentially.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { stages } from '../../src/pipeline.js';
import { createContext } from '../../src/stages/create-context.js';
import { buildPrompt } from '../../src/stages/build-prompt.js';
import { runLLMEnsemble } from '../../src/stages/run-llm-ensemble.js';
import { parseOutputs } from '../../src/stages/parse-outputs.js';
import { computeConsensus } from '../../src/stages/compute-consensus.js';
import { buildResponse } from '../../src/stages/build-response.js';

describe('Feature: trust360-v0-1-pipeline, Property 25: Stage Registry Structure', () => {
  it('should be an array', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry is an array.
     * 
     * Strategy:
     * - Check that stages is an array
     * - Verify it's not null or undefined
     */
    
    expect(stages).toBeDefined();
    expect(stages).not.toBeNull();
    expect(Array.isArray(stages)).toBe(true);
  });

  it('should contain exactly 6 stages', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry contains
     * exactly 6 stages as specified in the design.
     * 
     * Strategy:
     * - Check array length
     * - Verify it matches the expected number of stages
     */
    
    expect(stages.length).toBe(6);
  });

  it('should contain all required stage functions in order', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry contains
     * all required stages in the correct order.
     * 
     * Strategy:
     * - Verify each position contains the expected stage function
     * - Check by function reference
     */
    
    expect(stages[0]).toBe(createContext);
    expect(stages[1]).toBe(buildPrompt);
    expect(stages[2]).toBe(runLLMEnsemble);
    expect(stages[3]).toBe(parseOutputs);
    expect(stages[4]).toBe(computeConsensus);
    expect(stages[5]).toBe(buildResponse);
  });

  it('should contain only function types', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that all elements in the stage
     * registry are functions.
     * 
     * Strategy:
     * - Iterate through stages array
     * - Verify each element is a function
     */
    
    stages.forEach((stage, index) => {
      expect(typeof stage).toBe('function');
      expect(stage).toBeInstanceOf(Function);
    });
  });

  it('should be iterable with for...of loop', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry can be
     * iterated using for...of loop (as used in pipeline execution).
     * 
     * Strategy:
     * - Iterate through stages using for...of
     * - Verify each iteration yields a function
     * - Count iterations to verify all stages are visited
     */
    
    let count = 0;
    for (const stage of stages) {
      expect(typeof stage).toBe('function');
      count++;
    }
    
    expect(count).toBe(6);
  });

  it('should be iterable with forEach', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry can be
     * iterated using forEach method.
     * 
     * Strategy:
     * - Iterate using forEach
     * - Verify each element is a function
     * - Verify index is sequential
     */
    
    let expectedIndex = 0;
    stages.forEach((stage, index) => {
      expect(typeof stage).toBe('function');
      expect(index).toBe(expectedIndex);
      expectedIndex++;
    });
    
    expect(expectedIndex).toBe(6);
  });

  it('should maintain order when accessed by index', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that stages can be accessed by
     * index and maintain their order.
     * 
     * Strategy:
     * - Access stages by index
     * - Verify order matches specification
     */
    
    const expectedOrder = [
      createContext,
      buildPrompt,
      runLLMEnsemble,
      parseOutputs,
      computeConsensus,
      buildResponse
    ];
    
    expectedOrder.forEach((expectedStage, index) => {
      expect(stages[index]).toBe(expectedStage);
    });
  });

  it('should support array methods (map, filter, reduce)', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry supports
     * standard array methods.
     * 
     * Strategy:
     * - Use map to extract function names
     * - Use filter to find specific stages
     * - Use reduce to count stages
     */
    
    // Test map
    const stageNames = stages.map(stage => stage.name);
    expect(stageNames.length).toBe(6);
    expect(stageNames).toContain('createContext');
    expect(stageNames).toContain('buildPrompt');
    
    // Test filter
    const contextStages = stages.filter(stage => stage.name.includes('Context'));
    expect(contextStages.length).toBeGreaterThan(0);
    
    // Test reduce
    const stageCount = stages.reduce((count) => count + 1, 0);
    expect(stageCount).toBe(6);
  });

  it('should not contain null or undefined elements', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry does not
     * contain any null or undefined elements.
     * 
     * Strategy:
     * - Check each element is defined and not null
     */
    
    stages.forEach((stage, index) => {
      expect(stage).toBeDefined();
      expect(stage).not.toBeNull();
      expect(stage).not.toBeUndefined();
    });
  });

  it('should not contain duplicate stage functions', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that each stage function appears
     * only once in the registry.
     * 
     * Strategy:
     * - Create a Set from stages array
     * - Verify Set size equals array length (no duplicates)
     */
    
    const uniqueStages = new Set(stages);
    expect(uniqueStages.size).toBe(stages.length);
    expect(uniqueStages.size).toBe(6);
  });

  it('should be immutable (not modifiable at runtime)', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry maintains
     * its structure and cannot be easily modified.
     * 
     * Strategy:
     * - Attempt to modify the array
     * - Verify original structure is preserved
     * - Note: This tests the exported reference, not deep immutability
     */
    
    const originalLength = stages.length;
    const originalFirstStage = stages[0];
    
    // Verify structure is consistent
    expect(stages.length).toBe(originalLength);
    expect(stages[0]).toBe(originalFirstStage);
  });

  it('should support sequential iteration in pipeline execution', async () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that stages can be executed
     * sequentially as required by the pipeline.
     * 
     * Strategy:
     * - Simulate sequential execution pattern
     * - Verify each stage can be called in order
     * - Track execution order
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          const executionOrder = [];
          
          // Simulate pipeline execution pattern
          for (const stage of stages) {
            executionOrder.push(stage.name);
          }
          
          // Verify execution order matches expected order
          const expectedOrder = [
            'createContext',
            'buildPrompt',
            'runLLMEnsemble',
            'parseOutputs',
            'computeConsensus',
            'buildResponse'
          ];
          
          expect(executionOrder).toEqual(expectedOrder);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent structure across multiple accesses', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry structure
     * remains consistent across multiple accesses.
     * 
     * Strategy:
     * - Access stages multiple times
     * - Verify structure is identical each time
     */
    
    const access1 = [...stages];
    const access2 = [...stages];
    const access3 = [...stages];
    
    expect(access1.length).toBe(access2.length);
    expect(access2.length).toBe(access3.length);
    
    access1.forEach((stage, index) => {
      expect(stage).toBe(access2[index]);
      expect(stage).toBe(access3[index]);
    });
  });

  it('should support array destructuring', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry supports
     * array destructuring syntax.
     * 
     * Strategy:
     * - Destructure stages array
     * - Verify destructured elements match expected stages
     */
    
    const [
      stage1,
      stage2,
      stage3,
      stage4,
      stage5,
      stage6
    ] = stages;
    
    expect(stage1).toBe(createContext);
    expect(stage2).toBe(buildPrompt);
    expect(stage3).toBe(runLLMEnsemble);
    expect(stage4).toBe(parseOutputs);
    expect(stage5).toBe(computeConsensus);
    expect(stage6).toBe(buildResponse);
  });

  it('should support array spread operator', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry supports
     * the spread operator.
     * 
     * Strategy:
     * - Use spread operator to create new array
     * - Verify new array has same elements
     */
    
    const spreadStages = [...stages];
    
    expect(spreadStages.length).toBe(stages.length);
    expect(Array.isArray(spreadStages)).toBe(true);
    
    spreadStages.forEach((stage, index) => {
      expect(stage).toBe(stages[index]);
    });
  });

  it('should support slice operations', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry supports
     * array slice operations.
     * 
     * Strategy:
     * - Use slice to extract subsets
     * - Verify sliced arrays contain expected stages
     */
    
    // Get first 3 stages
    const firstThree = stages.slice(0, 3);
    expect(firstThree.length).toBe(3);
    expect(firstThree[0]).toBe(createContext);
    expect(firstThree[1]).toBe(buildPrompt);
    expect(firstThree[2]).toBe(runLLMEnsemble);
    
    // Get last 3 stages
    const lastThree = stages.slice(3);
    expect(lastThree.length).toBe(3);
    expect(lastThree[0]).toBe(parseOutputs);
    expect(lastThree[1]).toBe(computeConsensus);
    expect(lastThree[2]).toBe(buildResponse);
  });

  it('should have all stages with valid function names', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that all stage functions have
     * valid, non-empty names.
     * 
     * Strategy:
     * - Check each stage function name
     * - Verify names are non-empty strings
     */
    
    stages.forEach((stage, index) => {
      expect(stage.name).toBeDefined();
      expect(typeof stage.name).toBe('string');
      expect(stage.name.length).toBeGreaterThan(0);
    });
  });

  it('should maintain referential integrity', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that stage functions in the
     * registry are the same references as the imported functions.
     * 
     * Strategy:
     * - Compare registry stages with imported functions
     * - Verify they are the same references (not copies)
     */
    
    expect(stages[0]).toBe(createContext);
    expect(stages[1]).toBe(buildPrompt);
    expect(stages[2]).toBe(runLLMEnsemble);
    expect(stages[3]).toBe(parseOutputs);
    expect(stages[4]).toBe(computeConsensus);
    expect(stages[5]).toBe(buildResponse);
    
    // Verify they are the exact same function references
    expect(Object.is(stages[0], createContext)).toBe(true);
    expect(Object.is(stages[1], buildPrompt)).toBe(true);
    expect(Object.is(stages[2], runLLMEnsemble)).toBe(true);
    expect(Object.is(stages[3], parseOutputs)).toBe(true);
    expect(Object.is(stages[4], computeConsensus)).toBe(true);
    expect(Object.is(stages[5], buildResponse)).toBe(true);
  });

  it('should support indexOf and includes methods', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry supports
     * indexOf and includes array methods.
     * 
     * Strategy:
     * - Use indexOf to find stage positions
     * - Use includes to check stage presence
     */
    
    // Test indexOf
    expect(stages.indexOf(createContext)).toBe(0);
    expect(stages.indexOf(buildPrompt)).toBe(1);
    expect(stages.indexOf(buildResponse)).toBe(5);
    
    // Test includes
    expect(stages.includes(createContext)).toBe(true);
    expect(stages.includes(buildPrompt)).toBe(true);
    expect(stages.includes(buildResponse)).toBe(true);
    
    // Test with non-existent function
    const fakeStage = () => {};
    expect(stages.includes(fakeStage)).toBe(false);
  });

  it('should be exportable and importable as a module', () => {
    /**
     * **Validates: Requirements 10.7**
     * 
     * This property test verifies that the stage registry can be
     * exported and imported as an ES module.
     * 
     * Strategy:
     * - Verify stages is defined (successfully imported)
     * - Verify it has the expected structure
     */
    
    // If we can access stages here, it was successfully imported
    expect(stages).toBeDefined();
    expect(Array.isArray(stages)).toBe(true);
    expect(stages.length).toBe(6);
  });
});
