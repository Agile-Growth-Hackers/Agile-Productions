/**
 * Region configuration for multi-region content support
 * Supports both multi-domain and single-domain with routes
 */
export const REGIONS = {
  'IN': {
    name: 'India',
    domain: 'agileproductions.in',
    route: '/en-in',
    default: true
  },
  'AE': {
    name: 'UAE',
    domain: 'agileproductions.ae',
    route: '/en-ae',
    default: false
  }
};

export const REGION_CODES = Object.keys(REGIONS);
export const DEFAULT_REGION = 'IN';

/**
 * Detect region from request origin (multi-domain mode)
 * @param {string} origin - Request Origin header
 * @returns {string} Region code (IN, AE, etc.)
 */
export function detectRegionFromDomain(origin) {
  if (!origin) return DEFAULT_REGION;

  for (const [code, config] of Object.entries(REGIONS)) {
    if (origin.includes(config.domain)) {
      return code;
    }
  }

  return DEFAULT_REGION;
}

/**
 * Detect region from request path (future single-domain mode)
 * @param {string} pathname - Request pathname
 * @returns {string|null} Region code or null if not found
 */
export function detectRegionFromPath(pathname) {
  if (!pathname) return null;

  for (const [code, config] of Object.entries(REGIONS)) {
    if (pathname.startsWith(config.route)) {
      return code;
    }
  }

  return null;
}

/**
 * Get region from request (tries path first, then domain)
 * @param {Request} request - Request object
 * @returns {string} Region code
 */
export function getRegionFromRequest(request) {
  const pathname = new URL(request.url).pathname;
  const pathRegion = detectRegionFromPath(pathname);

  if (pathRegion) {
    return pathRegion;
  }

  const origin = request.headers.get('Origin') || request.headers.get('Referer');
  return detectRegionFromDomain(origin);
}

/**
 * Validate region code
 * @param {string} regionCode
 * @returns {boolean}
 */
export function isValidRegion(regionCode) {
  return REGION_CODES.includes(regionCode);
}
