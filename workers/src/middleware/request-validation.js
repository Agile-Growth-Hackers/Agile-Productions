/**
 * Request Validation Middleware
 * Simple schema-based validation without external dependencies
 */

/**
 * Validate request body against schema
 * @param {Object} schema - Validation schema
 * @returns {Function} Middleware function
 */
export function validateRequest(schema) {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      const errors = [];

      // Validate each field in schema
      for (const [field, rules] of Object.entries(schema)) {
        const value = body[field];

        // Required check
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }

        // Skip further validation if not required and not provided
        if (!rules.required && (value === undefined || value === null)) {
          continue;
        }

        // Type check
        if (rules.type) {
          const actualType = typeof value;
          if (actualType !== rules.type) {
            errors.push(`${field} must be of type ${rules.type}`);
          }
        }

        // Min length (strings)
        if (rules.minLength && typeof value === 'string') {
          if (value.length < rules.minLength) {
            errors.push(`${field} must be at least ${rules.minLength} characters`);
          }
        }

        // Max length (strings)
        if (rules.maxLength && typeof value === 'string') {
          if (value.length > rules.maxLength) {
            errors.push(`${field} must not exceed ${rules.maxLength} characters`);
          }
        }

        // Min value (numbers)
        if (rules.min !== undefined && typeof value === 'number') {
          if (value < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }
        }

        // Max value (numbers)
        if (rules.max !== undefined && typeof value === 'number') {
          if (value > rules.max) {
            errors.push(`${field} must not exceed ${rules.max}`);
          }
        }

        // Pattern (regex)
        if (rules.pattern && typeof value === 'string') {
          if (!rules.pattern.test(value)) {
            errors.push(`${field} format is invalid`);
          }
        }

        // Enum (allowed values)
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }

        // Custom validator
        if (rules.validator && typeof rules.validator === 'function') {
          const customError = rules.validator(value);
          if (customError) {
            errors.push(customError);
          }
        }
      }

      if (errors.length > 0) {
        return c.json({ error: errors.join('. ') }, 400);
      }

      // Attach validated body to context
      c.set('validatedBody', body);
      return next();
    } catch (error) {
      return c.json({ error: 'Invalid request body' }, 400);
    }
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  login: {
    username: { required: true, type: 'string', minLength: 3, maxLength: 50 },
    password: { required: true, type: 'string', minLength: 8 },
  },

  createUser: {
    username: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
    },
    email: {
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      required: true,
      type: 'string',
      minLength: 8,
    },
    fullName: {
      required: false,
      type: 'string',
      maxLength: 100,
    },
    isSuperAdmin: {
      required: false,
      type: 'boolean',
    },
  },

  updateProfile: {
    fullName: {
      required: false,
      type: 'string',
      maxLength: 100,
    },
    email: {
      required: false,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },

  changePassword: {
    currentPassword: { required: true, type: 'string' },
    newPassword: { required: true, type: 'string', minLength: 8 },
  },

  reorderItems: {
    order: {
      required: true,
      validator: (value) => {
        if (!Array.isArray(value)) return 'order must be an array';
        if (value.length === 0) return 'order cannot be empty';
        if (!value.every(id => typeof id === 'number')) return 'order must contain only numbers';
        return null;
      },
    },
  },
};
