/**
 * Error Tracking Utility
 * Centralized error logging and reporting
 *
 * To enable Sentry:
 * 1. Install: npm install @sentry/browser
 * 2. Add SENTRY_DSN to environment variables
 * 3. Uncomment the Sentry code below
 */

// import * as Sentry from '@sentry/browser';

let isInitialized = false;

/**
 * Initialize error tracking
 */
export function initErrorTracking(dsn, environment = 'production') {
  if (isInitialized) return;

  try {
    // Uncomment when Sentry is installed:
    // Sentry.init({
    //   dsn,
    //   environment,
    //   tracesSampleRate: 0.1, // 10% of transactions
    //   beforeSend(event) {
    //     // Don't send errors in development
    //     if (environment === 'development') return null;
    //     return event;
    //   },
    // });

    isInitialized = true;
    console.log('[Error Tracking] Initialized');
  } catch (error) {
    console.error('[Error Tracking] Failed to initialize:', error);
  }
}

/**
 * Log error to tracking service
 */
export function logError(error, context = {}) {
  // Log to console for now
  console.error('[Error]', error, context);

  // Uncomment when Sentry is installed:
  // if (isInitialized) {
  //   Sentry.captureException(error, {
  //     extra: context,
  //   });
  // }
}

/**
 * Log custom message
 */
export function logMessage(message, level = 'info', context = {}) {
  console.log(`[${level.toUpperCase()}]`, message, context);

  // Uncomment when Sentry is installed:
  // if (isInitialized) {
  //   Sentry.captureMessage(message, {
  //     level,
  //     extra: context,
  //   });
  // }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user) {
  // Uncomment when Sentry is installed:
  // if (isInitialized && user) {
  //   Sentry.setUser({
  //     id: user.id,
  //     username: user.username,
  //     email: user.email,
  //   });
  // }
}

/**
 * Clear user context
 */
export function clearUserContext() {
  // Uncomment when Sentry is installed:
  // if (isInitialized) {
  //   Sentry.setUser(null);
  // }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, category = 'custom', data = {}) {
  // Uncomment when Sentry is installed:
  // if (isInitialized) {
  //   Sentry.addBreadcrumb({
  //     message,
  //     category,
  //     data,
  //     level: 'info',
  //   });
  // }
}
