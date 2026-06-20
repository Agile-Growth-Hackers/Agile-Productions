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
      // Session Replay (rrweb) removed: it shipped a ~121 KB chunk and ran
      // DOM-recording on the main thread, hurting mobile TBT. Error tracking
      // and performance tracing below are unaffected.
    ],

    tracesSampleRate: 0.1,

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
