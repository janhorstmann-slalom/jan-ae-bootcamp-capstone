import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    game: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    player: {
      create: vi.fn(),
    },
    round: {
      create: vi.fn(),
      update: vi.fn(),
    },
    turn: {
      create: vi.fn(),
    },
    dieResult: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { createGame } from '../../src/services/gameService';
import { prisma } from '../../src/lib/prisma';

const mockPrisma = prisma as unknown as {
  game: { create: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  player: { create: ReturnType<typeof vi.fn> };
  round: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  turn: { create: ReturnType<typeof vi.fn> };
  dieResult: { findMany: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};

const makeFullGame = (playerCount: number) => {
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i}`,
    gameId: 'g1',
    name: `Player${i}`,
    originalPosition: i,
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
        completedAt: null,
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
};

describe('gameService.createGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a 2-player game successfully', async () => {
    const txFn = vi.fn(async (fn: (tx: unknown) => Promise<string>) => {
      const tx = {
        game: { create: vi.fn().mockResolvedValue({ id: 'g1' }) },
        player: { create: vi.fn().mockResolvedValueOnce({ id: 'p0', originalPosition: 0 }).mockResolvedValueOnce({ id: 'p1', originalPosition: 1 }) },
        round: { create: vi.fn().mockResolvedValue({ id: 'r1' }) },
        turn: { create: vi.fn().mockResolvedValue({ id: 't1' }) },
      };
      return fn(tx);
    });
    mockPrisma.$transaction.mockImplementation(txFn);
    mockPrisma.game.findUnique.mockResolvedValue(makeFullGame(2));

    const result = await createGame(['Alice', 'Bob']);

    expect(result.players).toHaveLength(2);
    expect(result.status).toBe('IN_PROGRESS');
    expect(result.rounds).toHaveLength(1);
    expect(result.rounds[0].turns).toHaveLength(1);
    expect(result.currentRoundNumber).toBe(1);
    expect(result.currentTurnPlayerId).toBe('p0');
  });

  it('creates an 8-player game successfully', async () => {
    const txFn = vi.fn(async (fn: (tx: unknown) => Promise<string>) => {
      const tx = {
        game: { create: vi.fn().mockResolvedValue({ id: 'g1' }) },
        player: { create: vi.fn().mockImplementation(({ data }: { data: { originalPosition: number } }) => Promise.resolve({ id: `p${data.originalPosition}`, ...data })) },
        round: { create: vi.fn().mockResolvedValue({ id: 'r1' }) },
        turn: { create: vi.fn().mockResolvedValue({ id: 't1' }) },
      };
      return fn(tx);
    });
    mockPrisma.$transaction.mockImplementation(txFn);
    mockPrisma.game.findUnique.mockResolvedValue(makeFullGame(8));

    const result = await createGame(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    expect(result.players).toHaveLength(8);
  });

  it('rejects fewer than 2 players', async () => {
    await expect(createGame(['Alice'])).rejects.toMatchObject({
      code: 'INVALID_PLAYER_COUNT',
    });
  });

  it('rejects more than 8 players', async () => {
    await expect(
      createGame(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']),
    ).rejects.toMatchObject({ code: 'INVALID_PLAYER_COUNT' });
  });

  it('rejects duplicate names (case-insensitive)', async () => {
    await expect(createGame(['Alice', 'alice'])).rejects.toMatchObject({
      code: 'DUPLICATE_PLAYER_NAME',
    });
  });

  it('rejects empty player names', async () => {
    await expect(createGame(['Alice', ''])).rejects.toMatchObject({
      code: 'EMPTY_PLAYER_NAME',
    });
  });

  it('rejects whitespace-only player names', async () => {
    await expect(createGame(['Alice', '   '])).rejects.toMatchObject({
      code: 'EMPTY_PLAYER_NAME',
    });
  });

  it('trims names before uniqueness check', async () => {
    await expect(createGame([' Alice ', 'Alice'])).rejects.toMatchObject({
      code: 'DUPLICATE_PLAYER_NAME',
    });
  });
});
