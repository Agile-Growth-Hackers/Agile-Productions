/**
 * MIME Type Validation - Lightweight, no performance impact
 * Validates file types based on magic bytes (file signatures)
 */

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
  'image/gif': [0x47, 0x49, 0x46],
};

/**
 * Validate image file type by checking magic bytes
 * @param {File} file - File to validate
 * @returns {Promise<boolean>} - True if valid image
 */
export async function validateImageMimeType(file) {
  try {
    // Check declared MIME type first (fast check)
    if (!file.type || !file.type.startsWith('image/')) {
      return false;
    }

    // Read first 12 bytes to check magic bytes
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check against known image signatures
    for (const [mimeType, signature] of Object.entries(ALLOWED_IMAGE_TYPES)) {
      if (signature.every((byte, index) => bytes[index] === byte)) {
        return true;
      }
    }

    // WebP additional check (WEBP signature at bytes 8-11)
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('MIME validation error:', error);
    return false;
  }
}

/**
 * Get human-readable error message for invalid file type
 */
export function getInvalidFileTypeError() {
  return 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.';
}
