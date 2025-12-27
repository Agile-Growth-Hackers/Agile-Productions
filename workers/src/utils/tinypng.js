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

    // Get original dimensions from TinyPNG response
    const originalWidth = uploadResult?.output?.width;
    const originalHeight = uploadResult?.output?.height;

    // Step 2: Apply resize if needed, then download
    let finalResponse;

    if (options.percentage && originalWidth && originalHeight) {
      // Calculate dimensions based on percentage
      const targetWidth = Math.round(originalWidth * options.percentage);
      const targetHeight = Math.round(originalHeight * options.percentage);

      // Apply resize operation to the compressed image
      const resizeResponse = await fetch(compressedUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${apiKey}`),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resize: {
            method: options.method || 'cover',
            width: targetWidth,
            height: targetHeight,
          },
        }),
      });

      if (!resizeResponse.ok) {
        const errorText = await resizeResponse.text();
        console.error('TinyPNG resize error:', errorText);
        throw new Error(`TinyPNG resize failed: ${resizeResponse.statusText}`);
      }

      // The resize response body IS the resized image
      finalResponse = resizeResponse;
    } else if (options.width || options.height) {
      // Apply resize operation with fixed dimensions (legacy)
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
        const errorText = await resizeResponse.text();
        console.error('TinyPNG resize error:', errorText);
        throw new Error(`TinyPNG resize failed: ${resizeResponse.statusText}`);
      }

      // The resize response body IS the resized image
      finalResponse = resizeResponse;
    } else {
      // No resize needed, just download compressed image
      finalResponse = await fetch(compressedUrl);
    }

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
 * @returns {Object} - {percentage, method}
 */
export function getMobileDimensions(category) {
  const dimensions = {
    slider: { percentage: 0.80, method: 'cover' },   // 80% of original
    gallery: { percentage: 0.70, method: 'cover' },  // 70% of original
    logos: { percentage: 0.60, method: 'fit' },      // 60% of original
  };

  return dimensions[category] || { percentage: 0.80, method: 'cover' };
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
