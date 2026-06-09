import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    game: { findUnique: vi.fn(), update: vi.fn() },
    round: { create: vi.fn(), update: vi.fn() },
    turn: { create: vi.fn(), update: vi.fn() },
    dieResult: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { endGame } from '../../src/services/gameService';
import { prisma } from '../../src/lib/prisma';

const mockPrisma = prisma as any;

function makeCompletedRoundGame(scores: number[]) {
  const players = scores.map((_, i) => ({
    id: `p${i}`,
    gameId: 'g1',
    name: `Player${i}`,
    originalPosition: i,
  }));

  const completedAt = new Date();
  const turns = players.map((p, i) => ({
    id: `t${i}`,
    roundId: 'r1',
    playerId: p.id,
    turnOrder: i,
    score: scores[i],
    completedAt,
    rolls: [],
  }));

  return {
    id: 'g1',
    status: 'IN_PROGRESS',
    createdAt: new Date(),
    completedAt: null,
    players,
    rounds: [
      {
        id: 'r1',
        gameId: 'g1',
        roundNumber: 1,
        firstPlayerId: 'p0',
        completedAt,
        turns,
      },
    ],
  };
}

function makeInProgressRoundGame() {
  return {
    id: 'g1',
    status: 'IN_PROGRESS',
    createdAt: new Date(),
    completedAt: null,
    players: [
      { id: 'p0', gameId: 'g1', name: 'Alice', originalPosition: 0 },
      { id: 'p1', gameId: 'g1', name: 'Bob', originalPosition: 1 },
    ],
    rounds: [
      {
        id: 'r1',
        gameId: 'g1',
        roundNumber: 1,
        firstPlayerId: 'p0',
        completedAt: null, // round still in progress
        turns: [
          {
            id: 't1',
            roundId: 'r1',
            playerId: 'p0',
            turnOrder: 0,
            score: null,
            completedAt: null,
            rolls: [],
          },
        ],
      },
    ],
  };
}

describe('gameService.endGame', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ROUND_IN_PROGRESS when called before round is complete', async () => {
    mockPrisma.game.findUnique.mockResolvedValue(makeInProgressRoundGame());
    await expect(endGame('g1')).rejects.toMatchObject({ code: 'ROUND_IN_PROGRESS' });
  });

  it('returns GAME_COMPLETED when called on an already-completed game', async () => {
    const game = makeCompletedRoundGame([10, 20]);
    (game as any).status = 'COMPLETED';
    mockPrisma.game.findUnique.mockResolvedValue(game);
    await expect(endGame('g1')).rejects.toMatchObject({ code: 'GAME_COMPLETED' });
  });

  it('declares winner as player with lowest cumulative score', async () => {
    const game = makeCompletedRoundGame([10, 20]);
    mockPrisma.game.findUnique
      .mockResolvedValueOnce(game)
      .mockResolvedValueOnce({ ...game, status: 'COMPLETED', completedAt: new Date() });
    mockPrisma.game.update.mockResolvedValue({});

    const result = await endGame('g1');
    expect(result.game.winnerPlayerIds).toContain('p0'); // p0 has score 10
    expect(result.game.winnerPlayerIds).not.toContain('p1');
  });

  it('declares co-winners when two players tie for lowest score', async () => {
    const game = makeCompletedRoundGame([10, 10]);
    mockPrisma.game.findUnique
      .mockResolvedValueOnce(game)
      .mockResolvedValueOnce({ ...game, status: 'COMPLETED', completedAt: new Date() });
    mockPrisma.game.update.mockResolvedValue({});

    const result = await endGame('g1');
    expect(result.game.winnerPlayerIds).toHaveLength(2);
    expect(result.game.winnerPlayerIds).toContain('p0');
    expect(result.game.winnerPlayerIds).toContain('p1');
  });
});
