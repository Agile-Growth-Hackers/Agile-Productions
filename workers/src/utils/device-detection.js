/**
 * Device Detection Utility
 * Detects if the request is from a mobile device based on User-Agent
 */

/**
 * Check if the request is from a mobile device
 * @param {Request} request - The HTTP request object
 * @returns {boolean} - True if mobile device
 */
export function isMobileDevice(request) {
  const userAgent = request.headers.get('user-agent') || '';

  // Check for mobile indicators in user agent
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
}

/**
 * Get the appropriate CDN URL based on device
 * @param {Object} item - Database item with cdn_url and cdn_url_mobile
 * @param {boolean} isMobile - Whether the request is from mobile
 * @returns {string} - The appropriate CDN URL
 */
export function getDeviceAppropriateUrl(item, isMobile) {
  // If mobile and mobile URL exists, use it
  if (isMobile && item.cdn_url_mobile) {
    return item.cdn_url_mobile;
  }

  // Fallback to desktop URL
  return item.cdn_url;
}

/**
 * Transform database results to use device-appropriate URLs
 * @param {Array} results - Array of database items
 * @param {boolean} isMobile - Whether the request is from mobile
 * @returns {Array} - Transformed results with appropriate cdn_url
 */
export function transformForDevice(results, isMobile) {
  return results.map(item => ({
    ...item,
    cdn_url: getDeviceAppropriateUrl(item, isMobile)
  }));
}
