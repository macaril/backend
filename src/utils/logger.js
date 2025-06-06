'use strict';

// Simple logger for the application
// For production, consider using a more robust logging library like winston

/**
 * Log an error message
 * @param {string} message - Error message
 * @param {Error|Object} [error] - Error object or additional metadata
 */
function error(message, error = {}) {
  const meta = error instanceof Error 
    ? { message: error.message, stack: error.stack } 
    : error;
  
  console.error(`[ERROR] ${message}`, meta);
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 * @param {Object} [meta] - Additional metadata
 */
function warn(message, meta = {}) {
  console.warn(`[WARN] ${message}`, Object.keys(meta).length > 0 ? meta : '');
}

/**
 * Log an info message
 * @param {string} message - Info message
 * @param {Object} [meta] - Additional metadata
 */
function info(message, meta = {}) {
  console.log(`[INFO] ${message}`, Object.keys(meta).length > 0 ? meta : '');
}

/**
 * Log a debug message
 * @param {string} message - Debug message
 * @param {Object} [meta] - Additional metadata
 */
function debug(message, meta = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] ${message}`, Object.keys(meta).length > 0 ? meta : '');
  }
}

module.exports = {
  error,
  warn,
  info,
  debug
};