/**
 * Security Headers Middleware
 * Adds essential security headers to all responses
 */
export function securityHeadersMiddleware(c, next) {
  // Execute the route handler first
  const response = next();

  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking attacks
  c.header('X-Frame-Options', 'DENY');

  // Enable XSS protection (legacy browsers)
  c.header('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent DNS prefetching (privacy)
  c.header('X-DNS-Prefetch-Control', 'off');

  // Disable downloading of unrecognized file types
  c.header('X-Download-Options', 'noopen');

  // Strict-Transport-Security (HSTS) - 1 year, include subdomains
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Comprehensive Permissions Policy
  c.header(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
    'magnetometer=(), accelerometer=(), gyroscope=(), ' +
    'picture-in-picture=(), fullscreen=(self)'
  );

  // Enhanced Content Security Policy
  c.header('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://www.googletagmanager.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://pub-*.r2.dev https://agile-productions-api.cool-bonus-e67f.workers.dev https://cloudflareinsights.com; " +
    "media-src 'self' https://pub-*.r2.dev; " +
    "object-src 'none'; " +
    "frame-src 'none'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "upgrade-insecure-requests"
  );

  return response;
}
