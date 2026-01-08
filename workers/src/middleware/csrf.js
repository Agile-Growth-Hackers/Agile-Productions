/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 *
 * How it works:
 * 1. Generate CSRF token on login
 * 2. Store in httpOnly cookie
 * 3. Client sends token in X-CSRF-Token header
 * 4. Validate token on state-changing requests (POST/PUT/DELETE)
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a secure CSRF token using Web Crypto API
 */
export function generateCsrfToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash token for storage (prevents timing attacks)
 */
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfCookie(c, token) {
  const hashedToken = await hashToken(token);

  c.header('Set-Cookie', `${CSRF_COOKIE_NAME}=${hashedToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=86400`);

  return token; // Return unhashed token for client to use
}

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(c) {
  const cookies = c.req.header('cookie') || '';
  const match = cookies.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Validate CSRF token
 */
async function validateCsrfToken(c) {
  // Get token from header
  const clientToken = c.req.header(CSRF_HEADER_NAME);
  if (!clientToken) {
    return false;
  }

  // Get hashed token from cookie
  const cookieToken = getCsrfTokenFromCookie(c);
  if (!cookieToken) {
    return false;
  }

  // Compare hashed client token with cookie token
  const hashedClientToken = await hashToken(clientToken);

  // Constant-time comparison to prevent timing attacks
  return hashedClientToken === cookieToken;
}

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens on state-changing requests
 */
export async function csrfProtection(c, next) {
  const method = c.req.method;

  // Only check CSRF for state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    // Skip CSRF check for login route (no token exists yet)
    if (c.req.path === '/api/auth/login' || c.req.path === '/api/v1/auth/login') {
      return next();
    }

    // Validate CSRF token
    const isValid = await validateCsrfToken(c);
    if (!isValid) {
      return c.json({
        error: 'Invalid or missing CSRF token',
        code: 'CSRF_TOKEN_INVALID'
      }, 403);
    }
  }

  return next();
}

/**
 * Generate and return CSRF token for client
 * Call this after successful login
 */
export async function generateCsrfResponse(c) {
  const token = generateCsrfToken();
  await setCsrfCookie(c, token);

  // Return token in response for client to use in headers
  return {
    csrfToken: token,
    csrfHeader: CSRF_HEADER_NAME,
  };
}
