import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getWorkersAnalytics,
  getTodayRange,
  getCurrentMonthRange,
} from '../../src/utils/analytics.js';

const ACCOUNT_ID = 'acct123';
const API_TOKEN = 'token123';
const SCRIPT = 'agile-productions-api';
const START = new Date('2026-06-20T00:00:00Z');
const END = new Date('2026-06-20T23:59:59Z');

function graphqlResponse(items) {
  return {
    ok: true,
    async json() {
      return {
        data: {
          viewer: {
            accounts: [{ workersInvocationsAdaptive: items }],
          },
        },
      };
    },
    async text() {
      return '';
    },
  };
}

describe('getWorkersAnalytics', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sums requests and errors across all data points with success:true', async () => {
    global.fetch.mockResolvedValue(
      graphqlResponse([
        { sum: { requests: 100, errors: 2 } },
        { sum: { requests: 50, errors: 3 } },
      ])
    );

    const result = await getWorkersAnalytics(ACCOUNT_ID, API_TOKEN, SCRIPT, START, END);

    expect(result).toEqual({ requests: 150, errors: 5, success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/graphql',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns zeros with success:true when there are no data points', async () => {
    global.fetch.mockResolvedValue(graphqlResponse([]));

    const result = await getWorkersAnalytics(ACCOUNT_ID, API_TOKEN, SCRIPT, START, END);

    expect(result).toEqual({ requests: 0, errors: 0, success: true });
  });

  it('returns success:false when fetch throws', async () => {
    global.fetch.mockRejectedValue(new Error('network down'));

    const result = await getWorkersAnalytics(ACCOUNT_ID, API_TOKEN, SCRIPT, START, END);

    expect(result.success).toBe(false);
    expect(result.requests).toBe(0);
    expect(result.errors).toBe(0);
    expect(result.error).toBe('network down');
  });

  it('returns success:false when the response is not ok', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      async text() {
        return 'Forbidden';
      },
      async json() {
        return {};
      },
    });

    const result = await getWorkersAnalytics(ACCOUNT_ID, API_TOKEN, SCRIPT, START, END);

    expect(result.success).toBe(false);
    expect(result.requests).toBe(0);
  });

  it('returns success:false when the GraphQL payload contains errors', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      async json() {
        return { errors: [{ message: 'bad query' }] };
      },
      async text() {
        return '';
      },
    });

    const result = await getWorkersAnalytics(ACCOUNT_ID, API_TOKEN, SCRIPT, START, END);

    expect(result.success).toBe(false);
  });
});

describe('date range helpers', () => {
  it('getTodayRange returns start before end on the same day', () => {
    const { start, end } = getTodayRange();
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(start.getTime()).toBeLessThan(end.getTime());
    expect(start.getDate()).toBe(end.getDate());
  });

  it('getCurrentMonthRange returns start on day 1 and end after start', () => {
    const { start, end } = getCurrentMonthRange();
    expect(start.getDate()).toBe(1);
    expect(start.getTime()).toBeLessThan(end.getTime());
  });
});
