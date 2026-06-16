import { describe, it, expect } from 'vitest';
import { rollDiceValues } from '../../src/services/diceService';

describe('diceService.rollDiceValues', () => {
  it('returns exactly the requested count of values', () => {
    expect(rollDiceValues(5)).toHaveLength(5);
    expect(rollDiceValues(1)).toHaveLength(1);
    expect(rollDiceValues(3)).toHaveLength(3);
  });

  it('returns an empty array when count is 0', () => {
    expect(rollDiceValues(0)).toHaveLength(0);
  });

  it('all values are in the range [1, 6]', () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const values = rollDiceValues(5);
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(6);
      }
    }
  });

  it('produces varied results across multiple calls (statistical)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(JSON.stringify(rollDiceValues(5)));
    }
    // With 6^5 = 7776 possible outcomes, getting ≥2 distinct results in 20 rolls is virtually certain
    expect(results.size).toBeGreaterThan(1);
  });
});
