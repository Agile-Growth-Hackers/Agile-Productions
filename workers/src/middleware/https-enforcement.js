/**
 * HTTPS Enforcement Middleware
 * Redirects all HTTP requests to HTTPS
 */
export function httpsEnforcementMiddleware(c, next) {
  const proto = c.req.header('X-Forwarded-Proto') || c.req.header('CF-Visitor');

  // Check if the request is HTTP
  if (proto === 'http' || (proto && proto.includes('"scheme":"http"'))) {
    const url = new URL(c.req.url);
    url.protocol = 'https:';
    return c.redirect(url.toString(), 301);
  }

  return next();
}
