import { describe, it, expect } from 'vitest';
import { sumWorkerAnalytics } from '../../src/routes/usage.js';

describe('sumWorkerAnalytics', () => {
  it('sums requests and errors across multiple workers', () => {
    const result = sumWorkerAnalytics([
      { requests: 100, errors: 1, success: true },
      { requests: 250, errors: 4, success: true },
    ]);
    expect(result).toEqual({ requests: 350, errors: 5 });
  });

  it('ignores entries with success:false', () => {
    const result = sumWorkerAnalytics([
      { requests: 100, errors: 1, success: true },
      { requests: 999, errors: 99, success: false },
    ]);
    expect(result).toEqual({ requests: 100, errors: 1 });
  });

  it('returns zeros for an empty list', () => {
    expect(sumWorkerAnalytics([])).toEqual({ requests: 0, errors: 0 });
  });

  it('handles undefined input gracefully', () => {
    expect(sumWorkerAnalytics(undefined)).toEqual({ requests: 0, errors: 0 });
  });

  it('treats missing requests/errors fields as zero', () => {
    const result = sumWorkerAnalytics([
      { success: true },
      { requests: 10, success: true },
    ]);
    expect(result).toEqual({ requests: 10, errors: 0 });
  });
});
