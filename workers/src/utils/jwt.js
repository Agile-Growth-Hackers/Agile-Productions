import { SignJWT, jwtVerify } from 'jose';

const JWT_EXPIRATION = '24h';

export async function createJWT(payload, secret) {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secretKey);

  return token;
}

/**
 * Verify JWT with support for secret rotation
 * @param {string} token - JWT token to verify
 * @param {string} currentSecret - Current JWT secret
 * @param {string|null} previousSecret - Previous JWT secret (for rotation)
 * @returns {Promise<object>} Decoded payload
 */
export async function verifyJWT(token, currentSecret, previousSecret = null) {
  const encoder = new TextEncoder();

  // Try current secret first
  try {
    const secretKey = encoder.encode(currentSecret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    // If current secret fails and we have a previous secret, try that
    if (previousSecret) {
      try {
        const oldSecretKey = encoder.encode(previousSecret);
        const { payload } = await jwtVerify(token, oldSecretKey);

        // Token is valid but signed with old secret
        // Mark it for re-signing (caller can handle this)
        return {
          ...payload,
          _rotationNeeded: true,
        };
      } catch (oldSecretError) {
        // Token invalid with both secrets
        throw new Error('Invalid token');
      }
    }

    // No previous secret or token invalid
    throw new Error('Invalid token');
  }
}
