/**
 * WordPress CMS Migration - Logger
 * 
 * Winston-based logger with file and console output.
 * Supports INFO, WARN, and ERROR log levels.
 */

import * as winston from 'winston';
import * as path from 'path';

// Log levels
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Logger configuration
const logDir = path.join(__dirname, '../../../logs');
const logFile = path.join(logDir, 'migration.log');

// Create logger instance
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: logFile,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write to console with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `[${timestamp}] ${level}: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      ),
    }),
  ],
});

// Helper functions for logging
export const log = {
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },

  error: (message: string, error?: Error | any, meta?: any) => {
    if (error instanceof Error) {
      logger.error(message, {
        error: error.message,
        stack: error.stack,
        ...meta,
      });
    } else {
      logger.error(message, { error, ...meta });
    }
  },

  // Migration-specific logging helpers
  migrationStart: (totalPages: number, xmlFile: string) => {
    logger.info(`Migration started: ${totalPages} pages from ${xmlFile}`);
  },

  pageProcessing: (filename: string, template: string) => {
    logger.info(`Processing: ${filename} → ${template}`);
  },

  pageSuccess: (filename: string, template: string, componentCount: number) => {
    logger.info(
      `✅ ${filename} → ${template} (${componentCount} components)`
    );
  },

  pageFailed: (filename: string, error: Error) => {
    logger.error(`❌ Failed to migrate: ${filename}`, error);
  },

  mediaCreated: (filename: string, relativePath: string, id: string) => {
    logger.info(`Created Media Entity: ${filename} → ${relativePath} (ID: ${id})`);
  },

  componentCreated: (blockId: string, order: number) => {
    logger.info(`Created component: ${blockId} (order: ${order})`);
  },

  migrationComplete: (
    successful: number,
    failed: number,
    duration: number
  ) => {
    logger.info(
      `Migration complete: ${successful}/${successful + failed} pages successful, ${failed} failed (Duration: ${duration}ms)`
    );
  },

  validationError: (page: string, component: string | undefined, message: string) => {
    logger.error(`Validation error in ${page}${component ? ` (${component})` : ''}: ${message}`);
  },
};

export default logger;
