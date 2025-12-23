// WebP conversion utilities
// Note: Actual conversion happens client-side using canvas
// This file provides server-side validation

export function isWebP(filename) {
  return filename.toLowerCase().endsWith('.webp');
}

export function validateImageType(contentType) {
  const validTypes = ['image/webp', 'image/jpeg', 'image/png', 'image/jpg'];
  return validTypes.includes(contentType);
}

export function ensureWebPExtension(filename) {
  if (isWebP(filename)) {
    return filename;
  }

  // Replace extension with .webp
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return `${nameWithoutExt}.webp`;
}

export async function getImageDimensions(file) {
  // For now, return null - dimensions can be extracted client-side
  // In production, could use image processing libraries
  return {
    width: null,
    height: null,
    size: file.size
  };
}
