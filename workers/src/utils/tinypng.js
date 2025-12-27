/**
 * TinyPNG Integration for Image Compression and Resizing
 * Docs: https://tinypng.com/developers/reference
 */

/**
 * Compress and optionally resize image using TinyPNG API
 * @param {ArrayBuffer} imageBuffer - Original image buffer
 * @param {string} apiKey - TinyPNG API key
 * @param {Object} options - Compression options
 * @param {number} options.width - Target width (optional)
 * @param {number} options.height - Target height (optional)
 * @param {string} options.method - Resize method: 'fit', 'cover', 'scale' (default: 'cover')
 * @returns {Promise<ArrayBuffer>} Compressed/resized image buffer
 */
export async function compressImage(imageBuffer, apiKey, options = {}) {
  try {
    // Step 1: Upload image to TinyPNG
    const uploadResponse = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`api:${apiKey}`),
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`TinyPNG upload failed: ${error.message || uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    const compressedUrl = uploadResponse.headers.get('Location');

    if (!compressedUrl) {
      throw new Error('TinyPNG did not return a compressed image URL');
    }

    // Step 2: Download compressed image (with optional resize)
    let downloadUrl = compressedUrl;

    // If resize dimensions provided, apply resizing
    if (options.width || options.height) {
      const resizeResponse = await fetch(compressedUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${apiKey}`),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resize: {
            method: options.method || 'cover',
            width: options.width,
            height: options.height,
          },
        }),
      });

      if (!resizeResponse.ok) {
        throw new Error(`TinyPNG resize failed: ${resizeResponse.statusText}`);
      }

      downloadUrl = resizeResponse.headers.get('Location') || compressedUrl;
    }

    // Step 3: Download final image
    const finalResponse = await fetch(downloadUrl);

    if (!finalResponse.ok) {
      throw new Error(`Failed to download compressed image: ${finalResponse.statusText}`);
    }

    return await finalResponse.arrayBuffer();
  } catch (error) {
    console.error('TinyPNG compression error:', error);
    throw error;
  }
}

/**
 * Get optimal mobile dimensions based on category
 * @param {string} category - Image category (slider, gallery, logos)
 * @returns {Object} - {width, height, method}
 */
export function getMobileDimensions(category) {
  const dimensions = {
    slider: { width: 800, height: 600, method: 'cover' },
    gallery: { width: 600, height: 450, method: 'cover' },
    logos: { width: 300, height: 200, method: 'fit' }, // 'fit' preserves logos better
  };

  return dimensions[category] || { width: 800, height: 600, method: 'cover' };
}

/**
 * Check if image category should have mobile optimization
 * @param {string} category - Image category
 * @returns {boolean}
 */
export function shouldOptimizeForMobile(category) {
  const optimizableCategories = ['slider', 'gallery', 'logos'];
  return optimizableCategories.includes(category);
}
