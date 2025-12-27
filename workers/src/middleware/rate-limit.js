// Rate limiting middleware to prevent API abuse
// In-memory store: Map<key, {count: number, resetTime: timestamp}>
const requestCounts = new Map();

// Rate limit configurations
const RATE_LIMITS = {
  PUBLIC: {
    max: 60,        // 60 requests
    window: 60000,  // per minute (60 seconds)
  },
  ADMIN: {
    max: 300,       // 300 requests
    window: 60000,  // per minute
  },
};

function getClientIP(c) {
  return c.req.header('CF-Connecting-IP') ||
         c.req.header('X-Forwarded-For')?.split(',')[0] ||
         'unknown';
}

function getRateLimitKey(c, type) {
  const ip = getClientIP(c);

  if (type === 'ADMIN') {
    // For admin routes, use user ID from JWT if available
    const user = c.get('user');
    return user ? `admin:${user.userId}` : `admin:${ip}`;
  }

  // For public routes, use IP + route path
  const path = c.req.path;
  return `public:${ip}:${path}`;
}

function checkRateLimit(key, limit) {
  const now = Date.now();
  const record = requestCounts.get(key);

  // Reset if window has passed
  if (!record || now > record.resetTime) {
    requestCounts.set(key, {
      count: 1,
      resetTime: now + limit.window
    });
    return { allowed: true, remaining: limit.max - 1 };
  }

  // Increment count
  record.count++;

  const remaining = Math.max(0, limit.max - record.count);
  const allowed = record.count <= limit.max;

  return { allowed, remaining, resetTime: record.resetTime };
}

function cleanupOldEntries() {
  const now = Date.now();

  // Only cleanup if map gets large (memory management)
  if (requestCounts.size > 10000) {
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key);
      }
    }
  }
}

// Middleware factory for different rate limit types
export function rateLimitMiddleware(type = 'PUBLIC') {
  return async (c, next) => {
    const limit = RATE_LIMITS[type];
    if (!limit) {
      throw new Error(`Invalid rate limit type: ${type}`);
    }

    const key = getRateLimitKey(c, type);
    const result = checkRateLimit(key, limit);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', limit.max.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());

    if (result.resetTime) {
      c.header('X-RateLimit-Reset', Math.floor(result.resetTime / 1000).toString());
    }

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      return c.json({
        error: 'Too many requests. Please try again later.',
        retryAfter: retryAfter
      }, 429);
    }

    // Periodic cleanup
    if (Math.random() < 0.01) { // 1% chance per request
      cleanupOldEntries();
    }

    return next();
  };
}

// Convenience exports
export const publicRateLimit = rateLimitMiddleware('PUBLIC');
export const adminRateLimit = rateLimitMiddleware('ADMIN');
