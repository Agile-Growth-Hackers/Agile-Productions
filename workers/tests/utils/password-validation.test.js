import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '../../src/utils/password-validation.js';

describe('validatePasswordStrength', () => {
  it('should reject passwords shorter than 8 characters', () => {
    const result = validatePasswordStrength('Pass1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject passwords without uppercase letters', () => {
    const result = validatePasswordStrength('password1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least 1 uppercase letter');
  });

  it('should reject passwords without lowercase letters', () => {
    const result = validatePasswordStrength('PASSWORD1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least 1 lowercase letter');
  });

  it('should reject passwords without special characters', () => {
    const result = validatePasswordStrength('Password1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least 1 special character');
  });

  it('should accept valid passwords', () => {
    const result = validatePasswordStrength('Password1!');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept various special characters', () => {
    const validPasswords = [
      'Password1!',
      'Password1@',
      'Password1#',
      'Password1$',
      'Password1%',
      'Password1^',
      'Password1&',
      'Password1*',
    ];

    validPasswords.forEach(password => {
      const result = validatePasswordStrength(password);
      expect(result.isValid).toBe(true);
    });
  });

  it('should handle null or undefined input', () => {
    expect(validatePasswordStrength(null).isValid).toBe(false);
    expect(validatePasswordStrength(undefined).isValid).toBe(false);
    expect(validatePasswordStrength('').isValid).toBe(false);
  });

  it('should return multiple errors for weak passwords', () => {
    const result = validatePasswordStrength('weak');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
