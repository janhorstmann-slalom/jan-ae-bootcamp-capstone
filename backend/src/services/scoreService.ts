import { prisma } from '../lib/prisma';

/**
 * Computes turn score from an in-memory list of die results.
 * Score = sum of kept die values, but 3s contribute 0.
 */
export function computeScoreFromResults(
  results: Array<{ value: number; kept: boolean }>,
): number {
  return results
    .filter((dr) => dr.kept)
    .reduce((sum, dr) => sum + (dr.value === 3 ? 0 : dr.value), 0);
}

/**
 * Queries the database and computes the score for a completed turn.
 * Score = sum of values of all kept DieResults where value !== 3.
 * Since each dieIndex appears with kept=true exactly once per turn (in the roll where it was kept),
 * this yields the correct sum without double-counting.
 */
export async function computeTurnScore(turnId: string): Promise<number> {
  const dieResults = await prisma.dieResult.findMany({
    where: {
      kept: true,
      roll: { turnId },
    },
  });
  return computeScoreFromResults(dieResults);
}
