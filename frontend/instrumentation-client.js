import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    integrations: [
      Sentry.browserTracingIntegration({
        enableInp: true,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry] Would send error:', event);
        return null;
      }
      return event;
    },

    ignoreErrors: [
      'NetworkError',
      'Network request failed',
      'ResizeObserver loop limit exceeded',
      'blocked by client',
    ],
  });
}
