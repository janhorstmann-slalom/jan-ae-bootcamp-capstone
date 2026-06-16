import { randomInt } from 'crypto';

/**
 * Returns an array of `count` cryptographically-fair random integers in the range [1, 6].
 */
export function rollDiceValues(count: number): number[] {
  return Array.from({ length: count }, () => randomInt(1, 7));
}
