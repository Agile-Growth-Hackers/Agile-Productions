import * as Sentry from '@sentry/nextjs';

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  // Error reporting only — tracing disabled to match the client.
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
  });
}
