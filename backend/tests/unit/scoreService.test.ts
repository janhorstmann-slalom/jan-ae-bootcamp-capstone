import { describe, it, expect } from 'vitest';
import { computeScoreFromResults } from '../../src/services/scoreService';

describe('scoreService.computeScoreFromResults', () => {
  it('sums non-3 kept face values correctly', () => {
    const results = [
      { value: 5, kept: true },
      { value: 2, kept: true },
      { value: 4, kept: true },
    ];
    expect(computeScoreFromResults(results)).toBe(11);
  });

  it('treats 3s as zero contribution', () => {
    const results = [
      { value: 3, kept: true },
      { value: 5, kept: true },
    ];
    expect(computeScoreFromResults(results)).toBe(5);
  });

  it('returns 0 when all kept dice are 3s', () => {
    const results = [
      { value: 3, kept: true },
      { value: 3, kept: true },
      { value: 3, kept: true },
      { value: 3, kept: true },
      { value: 3, kept: true },
    ];
    expect(computeScoreFromResults(results)).toBe(0);
  });

  it('ignores non-kept dice', () => {
    const results = [
      { value: 5, kept: true },
      { value: 6, kept: false }, // not kept, should not count
    ];
    expect(computeScoreFromResults(results)).toBe(5);
  });

  it('handles mixed values correctly (1+2+4+5+6=18, minus 3s)', () => {
    const results = [
      { value: 1, kept: true },
      { value: 2, kept: true },
      { value: 3, kept: true },
      { value: 4, kept: true },
      { value: 6, kept: true },
    ];
    expect(computeScoreFromResults(results)).toBe(13);
  });

  it('returns 0 for empty array', () => {
    expect(computeScoreFromResults([])).toBe(0);
  });
});
