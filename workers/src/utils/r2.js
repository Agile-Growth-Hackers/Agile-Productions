export async function uploadToR2(bucket, key, file, contentType) {
  try {
    console.log('uploadToR2 called with key:', key);
    console.log('File type:', file.type, 'File size:', file.size);

    // In Cloudflare Workers, R2 can accept the file directly or as a stream
    console.log('Uploading to R2...');
    await bucket.put(key, file, {
      httpMetadata: {
        contentType: contentType || file.type || 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
    console.log('bucket.put successful');

    // Return CDN URL using custom domain
    const cdnUrl = `https://r2.agileproductions.in/${key}`;
    console.log('Returning CDN URL:', cdnUrl);
    return cdnUrl;
  } catch (error) {
    console.error('uploadToR2 error:', error);
    console.error('Error message:', error.message);
    throw error;
  }
}

export async function deleteFromR2(bucket, key) {
  await bucket.delete(key);
}

export function generateUniqueKey(folder, filename) {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${folder}/${timestamp}-${sanitized}`;
}

export async function getFromR2(bucket, key) {
  const object = await bucket.get(key);
  if (!object) {
    throw new Error('Object not found');
  }
  return object;
}
