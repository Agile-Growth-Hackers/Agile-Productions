'use client';

/**
 * Sentry Configuration
 * Real-time error tracking and monitoring
 */

import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  // Sentry is initialized via instrumentation-client.js (Next.js instrumentation).
  // This function is kept for backwards compatibility.
}

/**
 * Manually capture error
 */
export function captureError(error, context = {}) {
  if (process.env.NODE_ENV === 'development') {
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
