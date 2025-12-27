import { describe, it, expect } from 'vitest';
import { getInvalidFileTypeError } from '../../src/utils/mime-validation.js';

describe('mime-validation', () => {
  describe('getInvalidFileTypeError', () => {
    it('should return error message for invalid file types', () => {
      const error = getInvalidFileTypeError();
      expect(error).toContain('Invalid file type');
      expect(error).toContain('JPEG');
      expect(error).toContain('PNG');
      expect(error).toContain('WebP');
      expect(error).toContain('GIF');
    });
  });

  // Note: validateImageMimeType requires File API which isn't available in Node.js test environment
  // For full testing, use integration tests with actual file uploads
});
