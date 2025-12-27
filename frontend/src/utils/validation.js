/**
 * Frontend input validation utilities
 * Validates user input before sending to API (UX improvement + security)
 */

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email) return { valid: false, error: 'Email is required' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (!password) return { valid: false, error: 'Password is required' };

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 lowercase letter' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~;]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 special character' };
  }

  return { valid: true };
}

/**
 * Validate username
 */
export function validateUsername(username) {
  if (!username) return { valid: false, error: 'Username is required' };

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 50) {
    return { valid: false, error: 'Username must be less than 50 characters' };
  }

  // Allow alphanumeric, underscore, hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file, maxSizeMB = 30) {
  if (!file) return { valid: false, error: 'File is required' };

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
    };
  }

  return { valid: true };
}

/**
 * Validate file type (images only)
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'File is required' };

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'
    };
  }

  return { valid: true };
}

/**
 * Validate alt text
 */
export function validateAltText(altText) {
  if (!altText) return { valid: false, error: 'Alt text is required for accessibility' };

  if (altText.length > 200) {
    return { valid: false, error: 'Alt text must be less than 200 characters' };
  }

  return { valid: true };
}

/**
 * Sanitize text input (basic client-side sanitization)
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';

  // Remove null bytes and control characters
  let sanitized = input.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized.trim();
}
