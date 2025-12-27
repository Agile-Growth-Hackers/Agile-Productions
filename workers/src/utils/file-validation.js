// File validation utilities

const FILE_SIZE_LIMITS = {
  PROFILE_PICTURE: 2 * 1024 * 1024,    // 2MB
  CONTENT_IMAGE: 30 * 1024 * 1024,     // 30MB
};

export function validateFileSize(file, type = 'CONTENT_IMAGE') {
  const maxSize = FILE_SIZE_LIMITS[type];

  if (!maxSize) {
    throw new Error(`Unknown file type: ${type}`);
  }

  if (file.size > maxSize) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
    throw new Error(`File too large. Maximum size is ${maxSizeMB}MB. Your file is ${fileSizeMB}MB.`);
  }

  return true;
}

export function getMaxFileSize(type = 'CONTENT_IMAGE') {
  return FILE_SIZE_LIMITS[type];
}
