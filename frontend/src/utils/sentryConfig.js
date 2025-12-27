/**
 * Sentry Configuration
 * Real-time error tracking and monitoring
 */

import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Only initialize if DSN is configured
  if (!dsn) {
    console.log('[Sentry] No DSN configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration({
        // Track route changes
        enableInp: true,
      }),
      Sentry.replayIntegration({
        // Session replay for debugging
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance traces sample rate (10% of transactions)
    tracesSampleRate: 0.1,

    // Session Replay sample rates
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter out errors in development
    beforeSend(event, hint) {
      // Don't send errors in development
      if (import.meta.env.DEV) {
        console.log('[Sentry] Would send error:', event);
        return null;
      }
      return event;
    },

    // Ignore common browser errors
    ignoreErrors: [
      // Network errors
      'NetworkError',
      'Network request failed',
      // Browser extensions
      'ResizeObserver loop limit exceeded',
      // Ad blockers
      'blocked by client',
    ],
  });

  console.log('[Sentry] Error tracking initialized');
}

/**
 * Manually capture error
 */
export function captureError(error, context = {}) {
  if (import.meta.env.DEV) {
    console.error('[Sentry] Error:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, category = 'custom', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
