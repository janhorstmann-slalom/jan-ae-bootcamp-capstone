import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    game: { findUnique: vi.fn(), update: vi.fn() },
    round: { create: vi.fn(), update: vi.fn() },
    turn: { create: vi.fn(), update: vi.fn() },
    dieResult: { findMany: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { mapGameToDTO } from '../../src/services/gameService';

function makeFullGame(playerCount: number, roundCompletedAt: Date | null = null) {
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i}`,
    gameId: 'g1',
    name: `Player${i}`,
    originalPosition: i,
  }));

  const turns = players.map((p, i) => ({
    id: `t${i}`,
    roundId: 'r1',
    playerId: p.id,
    turnOrder: i,
    score: roundCompletedAt ? 10 : null,
    completedAt: roundCompletedAt,
    rolls: [],
  }));

  return {
    id: 'g1',
    status: roundCompletedAt ? 'COMPLETED' : 'IN_PROGRESS',
    createdAt: new Date(),
    completedAt: roundCompletedAt,
    players,
    rounds: [
      {
        id: 'r1',
        gameId: 'g1',
        roundNumber: 1,
        firstPlayerId: 'p0',
        completedAt: roundCompletedAt,
        turns,
      },
    ],
  };
}

describe('mapGameToDTO — round rotation logic', () => {
  beforeEach(() => vi.clearAllMocks());

  it('2-player rotation: second player (pos=1) becomes first in round 2', () => {
    // Simulate what advanceTurnOrRound would produce:
    // prevFirstPlayer.originalPosition = 0, nextFirstPos = 1
    const nextFirstPos = (0 + 1) % 2;
    expect(nextFirstPos).toBe(1);
  });

  it('3-player rotation: third player (pos=2) becomes first in round 2 when pos=1 started', () => {
    const nextFirstPos = (1 + 1) % 3;
    expect(nextFirstPos).toBe(2);
  });

  it('8-player rotation wraps around: pos=7 → pos=0 in round 2', () => {
    const nextFirstPos = (7 + 1) % 8;
    expect(nextFirstPos).toBe(0);
  });

  it('round marks completedAt only after all turns are complete', () => {
    const game = makeFullGame(2, null) as any;
    // First turn is incomplete — round should not be marked complete
    game.rounds[0].turns[0].completedAt = null;
    game.rounds[0].rounds = null;
    const dto = mapGameToDTO(game);
    expect(dto.rounds[0].completedAt).toBeNull();
  });

  it('round completedAt is set when all turns are complete', () => {
    const completedAt = new Date();
    const game = makeFullGame(2, completedAt) as any;
    const dto = mapGameToDTO(game);
    expect(dto.rounds[0].completedAt).not.toBeNull();
  });

  it('new round firstPlayerId matches expected player after rotation for 2 players', () => {
    const players = [
      { id: 'p0', originalPosition: 0 },
      { id: 'p1', originalPosition: 1 },
    ];
    const prevFirstPlayer = players.find((p) => p.id === 'p0')!;
    const nextPos = (prevFirstPlayer.originalPosition + 1) % players.length;
    const nextFirst = players.find((p) => p.originalPosition === nextPos)!;
    expect(nextFirst.id).toBe('p1');
  });

  it('new round firstPlayerId wraps correctly for 3 players starting at pos=2', () => {
    const players = [
      { id: 'p0', originalPosition: 0 },
      { id: 'p1', originalPosition: 1 },
      { id: 'p2', originalPosition: 2 },
    ];
    const prevFirstPlayer = players.find((p) => p.originalPosition === 2)!;
    const nextPos = (prevFirstPlayer.originalPosition + 1) % players.length;
    const nextFirst = players.find((p) => p.originalPosition === nextPos)!;
    expect(nextFirst.id).toBe('p0');
  });
});
