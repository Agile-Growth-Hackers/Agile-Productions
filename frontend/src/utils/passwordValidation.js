/**
 * Validates password requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 special character
 */
export function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least 1 lowercase letter');
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~;]/.test(password)) {
    errors.push('Password must contain at least 1 special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get password requirements text for display
 */
export function getPasswordRequirements() {
  return 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 special character';
}
