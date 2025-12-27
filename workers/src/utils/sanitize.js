/**
 * Input sanitization utilities to prevent XSS attacks
 * Simple but effective sanitization without external dependencies
 */

/**
 * Sanitize text input by removing potentially dangerous characters
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export function sanitizeText(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // HTML encode dangerous characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length to prevent DOS
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized;
}

/**
 * Sanitize filename - remove path traversal attempts and dangerous characters
 * @param {string} filename - Filename to sanitize
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');

  // Remove control characters and dangerous chars
  sanitized = sanitized.replace(/[\x00-\x1F\x7F<>:"|?*]/g, '');

  // Trim whitespace and dots
  sanitized = sanitized.trim().replace(/^\.+/, '');

  // If empty after sanitization, provide default
  if (!sanitized) {
    return 'unnamed';
  }

  // Limit length
  if (sanitized.length > 200) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 190);
    sanitized = `${name}.${ext}`;
  }

  return sanitized;
}

/**
 * Validate and sanitize alt text for images
 * @param {string} altText - Alt text to sanitize
 * @returns {string} - Sanitized alt text
 */
export function sanitizeAltText(altText) {
  return sanitizeText(altText);
}
