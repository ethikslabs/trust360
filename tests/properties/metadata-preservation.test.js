/**
 * Property-based test for metadata preservation
 * 
 * Feature: trust360-v0-1-pipeline, Property 4
 * 
 * Property 4: Metadata Preservation
 * **Validates: Requirements 1.6**
 * 
 * For any request containing optional metadata, the metadata should be accessible
 * in the Context_Object throughout the pipeline and preserved without modification.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createContext } from '../../src/stages/create-context.js';
import { logger } from '../../src/utils/logger.js';

describe('Feature: trust360-v0-1-pipeline, Property 4: Metadata Preservation', () => {
  let logSpy;
  
  beforeEach(() => {
    // Spy on logger to avoid console output during tests
    logSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should preserve metadata in Context_Object when metadata is provided', async () => {
    /**
     * **Validates: Requirements 1.6**
     * 
     * This property test verifies that when a request includes optional metadata,
     * the metadata is accessible in the Context_Object and preserved exactly as
     * provided without any modification.
     * 
     * Strategy:
     * - Generate random metadata objects with various types and structures
     * - Create context with the metadata
     * - Verify metadata is present and unchanged in the Context_Object
     * - Test across 100 iterations with different metadata structures
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate random question
        fc.string({ minLength: 1, maxLength: 100 }),
        // Generate random metadata objects with various types
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.double(),
            fc.constant(null),
            fc.array(fc.string(), { maxLength: 5 }),
            fc.dictionary(fc.string(), fc.string(), { maxKeys: 3 })
          ),
          { minKeys: 1, maxKeys: 10 }
        ),
        async (question, metadata) => {
          const request = {
            question,
            metadata
          };
          
          const ctx = await createContext({ request });
          
          // Verify metadata exists in Context_Object
          expect(ctx).toHaveProperty('metadata');
          expect(ctx.metadata).toBeDefined();
          
          // Verify metadata is preserved exactly as provided
          expect(ctx.metadata).toEqual(metadata);
          
          // Verify metadata is a deep equal (not just reference)
          expect(JSON.stringify(ctx.metadata)).toBe(JSON.stringify(metadata));
          
          // Verify all keys from original metadata are present
          Object.keys(metadata).forEach(key => {
            expect(ctx.metadata).toHaveProperty(key);
            expect(ctx.metadata[key]).toEqual(metadata[key]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should initialize metadata as empty object when not provided', async () => {
    /**
     * **Validates: Requirements 1.6**
     * 
     * This property test verifies that when a request does not include metadata,
     * the Context_Object initializes metadata as an empty object rather than
     * null or undefined.
     * 
     * Strategy:
     * - Generate requests without metadata field
     * - Create context
     * - Verify metadata is an empty object
     * - Test across various request structures
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.option(fc.string({ minLength: 0, maxLength: 100 })),
        async (question, evidence) => {
          const request = {
            question,
            ...(evidence !== null && { evidence })
            // Explicitly not including metadata
          };
          
          const ctx = await createContext({ request });
          
          // Verify metadata exists and is an empty object
          expect(ctx).toHaveProperty('metadata');
          expect(ctx.metadata).toBeDefined();
          expect(ctx.metadata).toEqual({});
          expect(Object.keys(ctx.metadata).length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve metadata immutability throughout pipeline stages', async () => {
    /**
     * **Validates: Requirements 1.6**
     * 
     * This property test verifies that metadata remains unchanged as the
     * Context_Object flows through pipeline stages. Simulates pipeline
     * mutations to ensure metadata is not accidentally modified.
     * 
     * Strategy:
     * - Generate random metadata
     * - Create context
     * - Simulate pipeline stage mutations (adding fields to context)
     * - Verify metadata remains unchanged
     * - Test that metadata is not affected by context transformations
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          { minKeys: 1, maxKeys: 5 }
        ),
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        async (question, metadata, additionalFields) => {
          const request = { question, metadata };
          const ctx = await createContext({ request });
          
          // Store original metadata for comparison
          const originalMetadata = JSON.parse(JSON.stringify(metadata));
          
          // Simulate pipeline stages adding data to context
          let mutatedCtx = { ...ctx };
          additionalFields.forEach((field, index) => {
            mutatedCtx = {
              ...mutatedCtx,
              [`pipelineField${index}`]: field,
              rawResponses: [...mutatedCtx.rawResponses, { model: field }],
              validResponses: [...mutatedCtx.validResponses]
            };
          });
          
          // Verify metadata hasn't changed
          expect(mutatedCtx.metadata).toEqual(originalMetadata);
          expect(JSON.stringify(mutatedCtx.metadata)).toBe(JSON.stringify(originalMetadata));
          
          // Verify metadata object reference is preserved
          expect(mutatedCtx).toHaveProperty('metadata');
          expect(Object.keys(mutatedCtx.metadata).length).toBe(Object.keys(originalMetadata).length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle complex nested metadata structures', async () => {
    /**
     * **Validates: Requirements 1.6**
     * 
     * This property test verifies that complex, deeply nested metadata
     * structures are preserved correctly. Tests with nested objects,
     * arrays, and mixed types.
     * 
     * Strategy:
     * - Generate complex nested metadata structures
     * - Create context with nested metadata
     * - Verify all nested properties are preserved
     * - Test deep equality of nested structures
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.array(fc.string(), { maxLength: 3 }),
            fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }),
              fc.oneof(fc.string(), fc.integer(), fc.boolean()),
              { maxKeys: 3 }
            )
          ),
          { minKeys: 1, maxKeys: 5 }
        ),
        async (question, metadata) => {
          const request = { question, metadata };
          const ctx = await createContext({ request });
          
          // Verify deep equality of nested structures
          expect(ctx.metadata).toEqual(metadata);
          
          // Verify nested objects are preserved
          Object.entries(metadata).forEach(([key, value]) => {
            expect(ctx.metadata[key]).toEqual(value);
            
            // If value is an object or array, verify deep equality
            if (typeof value === 'object' && value !== null) {
              expect(JSON.stringify(ctx.metadata[key])).toBe(JSON.stringify(value));
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve metadata with special characters and edge case values', async () => {
    /**
     * **Validates: Requirements 1.6**
     * 
     * This property test verifies that metadata with special characters,
     * empty strings, and edge case values are preserved correctly.
     * 
     * Strategy:
     * - Generate metadata with special characters, empty strings, etc.
     * - Create context
     * - Verify all edge case values are preserved exactly
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }), // Including empty strings
            fc.constant(''),
            fc.constant(0),
            fc.constant(false),
            fc.constant(null),
            fc.integer({ min: -1000, max: 1000 }),
            fc.double({ min: -100, max: 100, noNaN: true })
          ),
          { minKeys: 1, maxKeys: 5 }
        ),
        async (question, metadata) => {
          const request = { question, metadata };
          const ctx = await createContext({ request });
          
          // Verify exact preservation of edge case values
          expect(ctx.metadata).toEqual(metadata);
          
          // Verify each edge case value individually
          Object.entries(metadata).forEach(([key, value]) => {
            expect(ctx.metadata).toHaveProperty(key);
            expect(ctx.metadata[key]).toBe(value);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain metadata accessibility across context spreading', async () => {
    /**
     * **Validates: Requirements 1.6**
     * 
     * This property test verifies that metadata remains accessible when
     * the Context_Object is spread and transformed, which is the pattern
     * used throughout the pipeline stages.
     * 
     * Strategy:
     * - Generate random metadata
     * - Create context
     * - Spread context multiple times (simulating stage transformations)
     * - Verify metadata is accessible and unchanged after each spread
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          { minKeys: 1, maxKeys: 5 }
        ),
        fc.integer({ min: 1, max: 10 }),
        async (question, metadata, spreadCount) => {
          const request = { question, metadata };
          let ctx = await createContext({ request });
          
          const originalMetadata = JSON.parse(JSON.stringify(metadata));
          
          // Simulate multiple stage transformations using spread operator
          for (let i = 0; i < spreadCount; i++) {
            ctx = {
              ...ctx,
              [`stage${i}Field`]: `value${i}`
            };
          }
          
          // Verify metadata is still accessible and unchanged
          expect(ctx).toHaveProperty('metadata');
          expect(ctx.metadata).toEqual(originalMetadata);
          expect(JSON.stringify(ctx.metadata)).toBe(JSON.stringify(originalMetadata));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve metadata type information', async () => {
    /**
     * **Validates: Requirements 1.6**
     * 
     * This property test verifies that the type information of metadata
     * values is preserved (strings remain strings, numbers remain numbers, etc.).
     * 
     * Strategy:
     * - Generate metadata with various typed values
     * - Create context
     * - Verify each value maintains its original type
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (question) => {
          // Create metadata with specific types
          const metadata = {
            stringValue: 'test',
            numberValue: 42,
            booleanValue: true,
            nullValue: null,
            arrayValue: ['a', 'b', 'c'],
            objectValue: { nested: 'value' }
          };
          
          const request = { question, metadata };
          const ctx = await createContext({ request });
          
          // Verify type preservation
          expect(typeof ctx.metadata.stringValue).toBe('string');
          expect(typeof ctx.metadata.numberValue).toBe('number');
          expect(typeof ctx.metadata.booleanValue).toBe('boolean');
          expect(ctx.metadata.nullValue).toBeNull();
          expect(Array.isArray(ctx.metadata.arrayValue)).toBe(true);
          expect(typeof ctx.metadata.objectValue).toBe('object');
          
          // Verify exact values
          expect(ctx.metadata.stringValue).toBe('test');
          expect(ctx.metadata.numberValue).toBe(42);
          expect(ctx.metadata.booleanValue).toBe(true);
          expect(ctx.metadata.arrayValue).toEqual(['a', 'b', 'c']);
          expect(ctx.metadata.objectValue).toEqual({ nested: 'value' });
        }
      ),
      { numRuns: 100 }
    );
  });
});
