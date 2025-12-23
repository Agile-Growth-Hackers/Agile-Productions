export function corsMiddleware(c, next) {
  const origin = c.req.header('Origin');
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }

  return next();
}
