import { describe, it, expect, vi } from 'vitest';
import { corsMiddleware } from '../../src/middleware/cors.js';

// Build a minimal fake Hono context.
function makeContext({ origin, method = 'GET', allowedOrigins } = {}) {
  const headers = {};
  const c = {
    req: {
      method,
      header: (key) => (key === 'Origin' ? origin : undefined),
    },
    env: { ALLOWED_ORIGINS: allowedOrigins },
    header: vi.fn((key, value) => {
      headers[key] = value;
    }),
    text: vi.fn((body, status) => ({ body, status })),
    _headers: headers,
  };
  return c;
}

describe('corsMiddleware', () => {
  it('sets ACAO and credentials for an allowed origin', async () => {
    const c = makeContext({
      origin: 'https://agileproductions.in',
      allowedOrigins: 'https://agileproductions.in,https://agileproductions.ae',
    });
    const next = vi.fn(async () => {});

    await corsMiddleware(c, next);

    expect(c._headers['Access-Control-Allow-Origin']).toBe('https://agileproductions.in');
    expect(c._headers['Access-Control-Allow-Credentials']).toBe('true');
    expect(next).toHaveBeenCalled();
  });

  it('does NOT set ACAO for a disallowed origin', async () => {
    const c = makeContext({
      origin: 'https://evil.example.com',
      allowedOrigins: 'https://agileproductions.in',
    });
    const next = vi.fn(async () => {});

    await corsMiddleware(c, next);

    expect(c._headers['Access-Control-Allow-Origin']).toBeUndefined();
    expect(c._headers['Access-Control-Allow-Credentials']).toBeUndefined();
    // Non-origin CORS headers are still set
    expect(c._headers['Access-Control-Allow-Methods']).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('returns 204 for OPTIONS preflight requests without calling next', async () => {
    const c = makeContext({
      origin: 'https://agileproductions.in',
      method: 'OPTIONS',
      allowedOrigins: 'https://agileproductions.in',
    });
    const next = vi.fn(async () => {});

    const result = await corsMiddleware(c, next);

    expect(c.text).toHaveBeenCalledWith('', 204);
    expect(result).toEqual({ body: '', status: 204 });
    expect(next).not.toHaveBeenCalled();
  });

  it('falls back to localhost defaults when ALLOWED_ORIGINS is unset', async () => {
    const c = makeContext({ origin: 'http://localhost:5173' });
    const next = vi.fn(async () => {});

    await corsMiddleware(c, next);

    expect(c._headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
  });
});
