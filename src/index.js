/**
 * Application Entry Point
 * 
 * Requirements: 10.1, 10.2, 10.5
 * 
 * @module index
 */

import 'dotenv/config';
import { createConnection } from 'node:net';
import { logger } from './utils/logger.js';
import { createServer } from './server.js';

/**
 * Validate required environment variables
 * 
 * @throws {Error} If required API keys are missing
 */
function validateEnvironment() {
  const required = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Start the application server
 */
async function start() {
  try {
    // Validate environment
    validateEnvironment();
    
    // Create server
    const server = createServer();
    
    // Get port from environment or use default
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    // Port guard
    await new Promise((resolve) => {
      const probe = createConnection({ port, host: 'localhost' });
      probe.once('connect', () => {
        probe.destroy();
        process.stderr.write(`[trust360] Port ${port} already in use — kill it with: kill $(lsof -ti:${port})\n`);
        process.exit(1);
      });
      probe.once('error', () => {
        probe.destroy();
        resolve();
      });
    });

    // Start listening
    await server.listen({ port, host });
    
    logger.info({ 
      action: 'server_start',
      port,
      host,
      environment: process.env.NODE_ENV || 'development'
    });
    
    // Graceful shutdown handler
    const shutdown = async (signal) => {
      logger.info({ action: 'server_shutdown', signal });
      await server.close();
      process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    logger.error({ 
      action: 'server_start_failed',
      error: error.message 
    });
    process.exit(1);
  }
}

// Start the application
start();
