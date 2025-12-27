/**
 * Request Size Limit Middleware
 * Prevents DOS attacks via large request bodies
 */

const DEFAULT_SIZE_LIMIT = 32 * 1024 * 1024; // 32MB (larger than our 30MB file limit for safety)
const JSON_SIZE_LIMIT = 1 * 1024 * 1024; // 1MB for JSON requests

export function requestSizeLimitMiddleware(c, next) {
  const contentLength = c.req.header('content-length');

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const contentType = c.req.header('content-type') || '';

    // Different limits for different content types
    if (contentType.includes('application/json')) {
      if (size > JSON_SIZE_LIMIT) {
        return c.json({
          error: 'Request body too large. Maximum size for JSON requests is 1MB.'
        }, 413);
      }
    } else {
      // For multipart (file uploads) and others
      if (size > DEFAULT_SIZE_LIMIT) {
        return c.json({
          error: 'Request body too large. Maximum size is 32MB.'
        }, 413);
      }
    }
  }

  return next();
}
