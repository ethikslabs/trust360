/**
 * HTTP API Server with Fastify
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2
 * 
 * @module server
 */

import Fastify from 'fastify';
import { logger } from './utils/logger.js';
import { executePipeline } from './pipeline.js';

/**
 * Create and configure Fastify server
 * 
 * @returns {Object} Configured Fastify instance
 */
export function createServer() {
  const fastify = Fastify({
    logger: logger
  });
  
  // Add validation error handler to catch schema validation errors
  fastify.setErrorHandler((error, request, reply) => {
    // Check if this is a validation error
    if (error.validation) {
      // Format validation errors into a readable message
      const validationMessages = error.validation.map(err => {
        const field = err.instancePath ? err.instancePath.replace(/^\//, '') : 'body';
        return `${field}: ${err.message}`;
      }).join(', ');
      
      return reply.code(400).send({
        error: 'Validation Error',
        message: validationMessages || 'Request validation failed',
        statusCode: 400
      });
    }
    
    // For non-validation errors, return 500
    return reply.code(500).send({
      error: error.message,
      statusCode: 500
    });
  });
  
  /**
   * POST /trust - Trust evaluation endpoint
   * 
   * Accepts trust evaluation requests and returns structured trust reports.
   * 
   * Status codes:
   * - 200: All models succeeded
   * - 206: Partial success (some models failed)
   * - 400: Validation error
   * - 500: Server error (all models failed or stage failure)
   */
  fastify.post('/trust', {
    schema: {
      body: {
        type: 'object',
        required: ['question'],
        properties: {
          question: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 2000 
          },
          evidence: { 
            type: 'string', 
            maxLength: 5000 
          },
          metadata: { 
            type: 'object' 
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Explicit request validation
      const { question, evidence, metadata } = request.body;
      
      // Validate question: must be non-empty string
      if (typeof question !== 'string' || question.length === 0) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'question must be a non-empty string',
          statusCode: 400
        });
      }
      
      // Validate evidence: must be string, null, or undefined
      if (evidence !== null && evidence !== undefined && typeof evidence !== 'string') {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'evidence must be a string, null, or undefined',
          statusCode: 400
        });
      }
      
      // Validate metadata: must be object, null, or undefined
      if (metadata !== null && metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata))) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'metadata must be an object, null, or undefined',
          statusCode: 400
        });
      }
      
      // Execute pipeline
      const result = await executePipeline(request.body);
      
      // Determine status code based on model failures
      // 206 only for partial success (some fail, some succeed)
      const statusCode = result.metrics.failedModels > 0 && result.metrics.successfulModels > 0 ? 206 : 200;
      
      return reply.code(statusCode).send(result);
      
    } catch (error) {
      // Return 500 for pipeline failures
      return reply.code(500).send({
        traceId: error.traceId || undefined,
        error: error.message,
        details: error.details || undefined,
        statusCode: 500
      });
    }
  });
  
  /**
   * GET /health - Health check endpoint
   * 
   * Returns server status and version information.
   */
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0'
    };
  });
  
  return fastify;
}
