/**
 * Error Tracking Utility
 * Centralized error logging and reporting
 * Sentry is now enabled for production error monitoring
 */

import * as Sentry from '@sentry/node';

let isInitialized = false;

/**
 * Initialize error tracking
 */
export function initErrorTracking(dsn, environment = 'production') {
  if (isInitialized) return;

  try {
    if (dsn) {
      Sentry.init({
        dsn,
        environment,
        tracesSampleRate: 0.1, // 10% of transactions
        beforeSend(event) {
          // Don't send errors in development
          if (environment === 'development') return null;
          return event;
        },
      });
      isInitialized = true;
      console.log('[Error Tracking] Sentry initialized');
    } else {
      console.log('[Error Tracking] No DSN provided, using console only');
    }
  } catch (error) {
    console.error('[Error Tracking] Failed to initialize:', error);
  }
}

/**
 * Log error to tracking service
 */
export function logError(error, context = {}) {
  // Log to console
  console.error('[Error]', error, context);

  // Send to Sentry if initialized
  if (isInitialized) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Log custom message
 */
export function logMessage(message, level = 'info', context = {}) {
  console.log(`[${level.toUpperCase()}]`, message, context);

  // Send to Sentry if initialized
  if (isInitialized) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user) {
  if (isInitialized && user) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  }
}

/**
 * Clear user context
 */
export function clearUserContext() {
  if (isInitialized) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, category = 'custom', data = {}) {
  if (isInitialized) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}
