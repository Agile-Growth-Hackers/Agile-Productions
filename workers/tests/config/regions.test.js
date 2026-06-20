import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectRegionFromDomain,
  detectRegionFromPath,
  getDefaultRegion,
  getRegionFromRequest,
  clearRegionsCache,
} from '../../src/config/regions.js';

const REGIONS = [
  { code: 'IN', name: 'India', domain: 'agileproductions.in', route: null, is_active: 1, is_default: 1 },
  { code: 'AE', name: 'UAE', domain: 'agileproductions.ae', route: null, is_active: 1, is_default: 0 },
];

const ROUTED_REGIONS = [
  { code: 'IN', name: 'India', domain: 'agileproductions.com', route: '/in', is_active: 1, is_default: 1 },
  { code: 'AE', name: 'UAE', domain: 'agileproductions.com', route: '/ae', is_active: 1, is_default: 0 },
];

// Minimal fake D1 db whose prepare().all() resolves the given regions
function makeDb(regions) {
  return {
    prepare() {
      return {
        async all() {
          return { results: regions };
        },
      };
    },
  };
}

function makeThrowingDb() {
  return {
    prepare() {
      throw new Error('db unavailable');
    },
  };
}

function makeRequest(url, headers = {}) {
  return new Request(url, { headers });
}

describe('detectRegionFromDomain', () => {
  it('matches IN for the .in domain', () => {
    expect(detectRegionFromDomain('https://agileproductions.in', REGIONS)).toBe('IN');
  });

  it('matches AE for the .ae domain', () => {
    expect(detectRegionFromDomain('https://agileproductions.ae/contact', REGIONS)).toBe('AE');
  });

  it('returns null for an unknown origin', () => {
    expect(detectRegionFromDomain('https://example.com', REGIONS)).toBeNull();
  });

  it('returns null for an empty origin', () => {
    expect(detectRegionFromDomain('', REGIONS)).toBeNull();
    expect(detectRegionFromDomain(null, REGIONS)).toBeNull();
  });
});

describe('detectRegionFromPath', () => {
  it('matches by route prefix', () => {
    expect(detectRegionFromPath('/ae/portfolio', ROUTED_REGIONS)).toBe('AE');
    expect(detectRegionFromPath('/in/about', ROUTED_REGIONS)).toBe('IN');
  });

  it('returns null when no region has a route', () => {
    expect(detectRegionFromPath('/anything', REGIONS)).toBeNull();
  });

  it('returns null for an empty pathname', () => {
    expect(detectRegionFromPath('', ROUTED_REGIONS)).toBeNull();
    expect(detectRegionFromPath(null, ROUTED_REGIONS)).toBeNull();
  });
});

describe('getDefaultRegion', () => {
  it('returns the region flagged is_default', () => {
    expect(getDefaultRegion(REGIONS)).toBe('IN');
  });

  it('falls back to the first region when none is default', () => {
    const noDefault = [
      { code: 'AE', is_default: 0 },
      { code: 'IN', is_default: 0 },
    ];
    expect(getDefaultRegion(noDefault)).toBe('AE');
  });

  it("falls back to 'IN' when the regions list is empty", () => {
    expect(getDefaultRegion([])).toBe('IN');
  });
});

describe('getRegionFromRequest', () => {
  beforeEach(() => {
    clearRegionsCache();
  });

  it('resolves region from the request path first', async () => {
    const db = makeDb(ROUTED_REGIONS);
    const request = makeRequest('https://agileproductions.com/ae/work', {
      Referer: 'https://agileproductions.com/in/home',
      Origin: 'https://agileproductions.in',
    });
    expect(await getRegionFromRequest(request, db)).toBe('AE');
  });

  it('resolves region from the Referer path when the request path has no match', async () => {
    const db = makeDb(ROUTED_REGIONS);
    const request = makeRequest('https://agileproductions.com/api/projects', {
      Referer: 'https://agileproductions.com/ae/portfolio',
    });
    expect(await getRegionFromRequest(request, db)).toBe('AE');
  });

  it('resolves region from the Origin domain when paths do not match', async () => {
    const db = makeDb(REGIONS);
    const request = makeRequest('https://agileproductions.ae/api/projects', {
      Origin: 'https://agileproductions.ae',
    });
    expect(await getRegionFromRequest(request, db)).toBe('AE');
  });

  it('falls back to the default region when nothing matches', async () => {
    const db = makeDb(REGIONS);
    const request = makeRequest('https://example.com/api/projects');
    expect(await getRegionFromRequest(request, db)).toBe('IN');
  });

  it("returns 'IN' when the database throws", async () => {
    const db = makeThrowingDb();
    const request = makeRequest('https://agileproductions.ae/ae/work', {
      Origin: 'https://agileproductions.ae',
    });
    expect(await getRegionFromRequest(request, db)).toBe('IN');
  });
});
