/**
 * Sentry Initialization Middleware
 * Initializes Sentry error tracking with environment config
 */

import { initErrorTracking } from '../utils/error-tracking.js';

let sentryInitialized = false;

export function sentryInitMiddleware(c, next) {
  // Initialize Sentry once with environment variables
  if (!sentryInitialized && c.env.SENTRY_DSN) {
    initErrorTracking(c.env.SENTRY_DSN, c.env.ENVIRONMENT || 'production');
    sentryInitialized = true;
  }

  return next();
}
