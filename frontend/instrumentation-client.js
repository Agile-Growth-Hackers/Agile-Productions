// Lazy-loaded Sentry (error reporting only).
//
// The @sentry/nextjs SDK is ~120 KB and, when statically imported and init'd at
// module load here, lands in the client entry and executes during hydration —
// the single biggest contributor to mobile Total Blocking Time. Tree-shaking
// does NOT drop the unused tracing code from this SDK, so trimming the config
// alone doesn't help.
//
// Instead we DYNAMICALLY import the SDK on idle, which webpack splits into a
// separate async chunk loaded after the page is interactive. Error capture is
// retained (tracing dropped); the only trade-off is a brief window at the very
// start of load where an error wouldn't be captured — acceptable for a stable
// marketing page in exchange for the TBT win.

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && typeof window !== 'undefined') {
  const startSentry = () => {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.init({
          dsn,
          environment: process.env.NODE_ENV,
          // No tracing — error reporting only.
          beforeSend(event) {
            if (process.env.NODE_ENV === 'development') {
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
      })
      .catch(() => {
        /* Sentry failed to load — non-critical, ignore. */
      });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startSentry, { timeout: 4000 });
  } else {
    window.setTimeout(startSentry, 2000);
  }
}
