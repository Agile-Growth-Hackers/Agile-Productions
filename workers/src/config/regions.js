/**
 * Region configuration for multi-region content support
 * Now database-driven instead of hardcoded
 * Supports both multi-domain and single-domain with routes
 */

// Cache for regions data (refreshed every 5 minutes)
let regionsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch regions from database with caching
 * @param {D1Database} db - D1 database instance
 * @returns {Promise<Array>} Array of region objects
 */
export async function getRegionsFromDB(db) {
  // Return cache if valid
  if (regionsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return regionsCache;
  }

  // Fetch from database
  const { results } = await db.prepare(
    'SELECT code, name, domain, route, is_active, is_default FROM regions WHERE is_active = 1 ORDER BY is_default DESC, name ASC'
  ).all();

  // Update cache
  regionsCache = results;
  cacheTimestamp = Date.now();

  return results;
}

/**
 * Clear regions cache (call after region updates)
 */
export function clearRegionsCache() {
  regionsCache = null;
  cacheTimestamp = 0;
}

/**
 * Get default region code
 * @param {Array} regions - Array of region objects
 * @returns {string} Default region code
 */
export function getDefaultRegion(regions) {
  const defaultRegion = regions.find(r => r.is_default === 1);
  return defaultRegion ? defaultRegion.code : (regions[0]?.code || 'IN');
}

/**
 * Detect region from request origin (multi-domain mode)
 * @param {string} origin - Request Origin header
 * @param {Array} regions - Array of region objects from DB
 * @returns {string|null} Region code or null if not found
 */
export function detectRegionFromDomain(origin, regions) {
  if (!origin) return null;

  for (const region of regions) {
    if (region.domain && origin.includes(region.domain)) {
      return region.code;
    }
  }

  return null;
}

/**
 * Detect region from request path (single-domain mode)
 * @param {string} pathname - Request pathname
 * @param {Array} regions - Array of region objects from DB
 * @returns {string|null} Region code or null if not found
 */
export function detectRegionFromPath(pathname, regions) {
  if (!pathname) return null;

  // Sort by route length (longest first) to match most specific routes first
  const regionsWithRoutes = regions
    .filter(r => r.route)
    .sort((a, b) => b.route.length - a.route.length);

  for (const region of regionsWithRoutes) {
    if (pathname.startsWith(region.route)) {
      return region.code;
    }
  }

  return null;
}

/**
 * Get region from request (tries path first, then domain, then default)
 * @param {Request} request - Request object
 * @param {D1Database} db - D1 database instance
 * @returns {Promise<string>} Region code
 */
export async function getRegionFromRequest(request, db) {
  try {
    const regions = await getRegionsFromDB(db);
    const pathname = new URL(request.url).pathname;

    // Try path-based detection first (for direct page loads)
    const pathRegion = detectRegionFromPath(pathname, regions);
    if (pathRegion) {
      return pathRegion;
    }

    // Try to detect from Referer header (for API calls from regional routes)
    const referer = request.headers.get('Referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererPath = refererUrl.pathname;
        const refererPathRegion = detectRegionFromPath(refererPath, regions);
        if (refererPathRegion) {
          return refererPathRegion;
        }
      } catch (e) {
        // Invalid referer URL, continue to domain detection
      }
    }

    // Try domain-based detection
    const origin = request.headers.get('Origin') || request.headers.get('Referer') || request.headers.get('Host');
    const domainRegion = detectRegionFromDomain(origin, regions);
    if (domainRegion) {
      return domainRegion;
    }

    // Return default region
    return getDefaultRegion(regions);
  } catch (error) {
    console.error('Error detecting region:', error);
    return 'IN'; // Hardcoded fallback in case of DB error
  }
}

/**
 * Validate region code
 * @param {string} regionCode - Region code to validate
 * @param {D1Database} db - D1 database instance
 * @returns {Promise<boolean>}
 */
export async function isValidRegion(regionCode, db) {
  try {
    const regions = await getRegionsFromDB(db);
    return regions.some(r => r.code === regionCode);
  } catch (error) {
    console.error('Error validating region:', error);
    return false;
  }
}
