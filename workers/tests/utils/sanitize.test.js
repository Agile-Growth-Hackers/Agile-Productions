import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeFilename, sanitizeAltText } from '../../src/utils/sanitize.js';

describe('sanitizeText', () => {
  it('should remove HTML tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    const result = sanitizeText(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should handle null bytes', () => {
    const input = 'Hello\x00World';
    const result = sanitizeText(input);
    expect(result).toBe('HelloWorld');
  });

  it('should limit length to 500 characters', () => {
    const input = 'a'.repeat(600);
    const result = sanitizeText(input);
    expect(result.length).toBe(500);
  });

  it('should encode dangerous characters', () => {
    const input = '"><script>alert(1)</script>';
    const result = sanitizeText(input);
    expect(result).toContain('&quot;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&lt;');
  });

  it('should handle empty input', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('should remove path traversal attempts', () => {
    const input = '../../../etc/passwd';
    const result = sanitizeFilename(input);
    expect(result).not.toContain('..');
    expect(result).not.toContain('/');
  });

  it('should remove dangerous characters', () => {
    const input = 'file<>:"|?*.txt';
    const result = sanitizeFilename(input);
    expect(result).not.toMatch(/[<>:"|?*]/);
  });

  it('should handle Windows paths', () => {
    const input = 'C:\\Windows\\System32\\file.txt';
    const result = sanitizeFilename(input);
    expect(result).not.toContain('\\');
    expect(result).toBe('CWindowsSystem32file.txt');
  });

  it('should provide default for empty input', () => {
    expect(sanitizeFilename('')).toBe('unnamed');
    expect(sanitizeFilename(null)).toBe('unnamed');
  });

  it('should limit filename length', () => {
    const input = 'a'.repeat(250) + '.txt';
    const result = sanitizeFilename(input);
    expect(result.length).toBeLessThanOrEqual(200);
  });
});

describe('sanitizeAltText', () => {
  it('should sanitize alt text same as regular text', () => {
    const input = '<img src=x onerror=alert(1)>';
    const result = sanitizeAltText(input);
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });
});
