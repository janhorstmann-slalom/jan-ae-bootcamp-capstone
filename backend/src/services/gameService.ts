import type {
  Game,
  Player,
  Round,
  Turn,
  Roll,
  DieResult,
  Prisma,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { rollDiceValues } from './diceService';
import { computeScoreFromResults } from './scoreService';
import type {
  GameDTO,
  GameSummaryDTO,
  PlayerDTO,
  RoundDTO,
  TurnDTO,
  RollDTO,
  DieResultDTO,
  RollResponseDTO,
  KeepResponseDTO,
} from '@shared/types/api';

// ─── Internal Types ──────────────────────────────────────────────────────────

type DieResultRow = DieResult;
type RollWithDice = Roll & { dieResults: DieResultRow[] };
type TurnWithRolls = Turn & { rolls: RollWithDice[] };
type RoundWithTurns = Round & { turns: TurnWithRolls[] };
type FullGame = Game & { players: Player[]; rounds: RoundWithTurns[] };

type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// ─── Load Full Game ───────────────────────────────────────────────────────────

async function loadFullGame(gameId: string): Promise<FullGame> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: { orderBy: { originalPosition: 'asc' } },
      rounds: {
        orderBy: { roundNumber: 'asc' },
        include: {
          turns: {
            orderBy: { turnOrder: 'asc' },
            include: {
              rolls: {
                orderBy: { rollNumber: 'asc' },
                include: {
                  dieResults: { orderBy: { dieIndex: 'asc' } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!game) {
    throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found.');
  }
  return game;
}

// ─── DTO Mapper ───────────────────────────────────────────────────────────────

export function mapGameToDTO(game: FullGame): GameDTO {
  // Compute cumulative scores per player
  const cumulativeScores = new Map<string, number>();
  for (const player of game.players) {
    cumulativeScores.set(player.id, 0);
  }
  for (const round of game.rounds) {
    for (const turn of round.turns) {
      if (turn.completedAt !== null && turn.score !== null) {
        cumulativeScores.set(
          turn.playerId,
          (cumulativeScores.get(turn.playerId) ?? 0) + turn.score,
        );
      }
    }
  }

  // Current round = most recent round that has not yet completed
  const currentRound = game.rounds.find((r) => r.completedAt === null) ?? null;
  // Current turn = the incomplete turn within the current round
  const currentTurn = currentRound?.turns.find((t) => t.completedAt === null) ?? null;

  // Winner(s) — only populated when game is COMPLETED
  let winnerPlayerIds: string[] | null = null;
  if (game.status === 'COMPLETED') {
    const scores = Array.from(cumulativeScores.entries());
    const minScore = Math.min(...scores.map(([, s]) => s));
    winnerPlayerIds = scores.filter(([, s]) => s === minScore).map(([id]) => id);
  }

  const players: PlayerDTO[] = game.players.map((p) => ({
    id: p.id,
    name: p.name,
    originalPosition: p.originalPosition,
    cumulativeScore: cumulativeScores.get(p.id) ?? 0,
  }));

  const rounds: RoundDTO[] = game.rounds.map((r) => ({
    id: r.id,
    roundNumber: r.roundNumber,
    firstPlayerId: r.firstPlayerId,
    completedAt: r.completedAt?.toISOString() ?? null,
    turns: r.turns.map(
      (t): TurnDTO => ({
        id: t.id,
        playerId: t.playerId,
        turnOrder: t.turnOrder,
        score: t.score,
        completedAt: t.completedAt?.toISOString() ?? null,
        rolls: t.rolls.map(
          (roll): RollDTO => ({
            id: roll.id,
            rollNumber: roll.rollNumber,
            dice: roll.dieResults.map(
              (dr): DieResultDTO => ({
                dieIndex: dr.dieIndex,
                value: dr.value,
                kept: dr.kept,
              }),
            ),
          }),
        ),
      }),
    ),
  }));

  return {
    id: game.id,
    status: game.status as 'IN_PROGRESS' | 'COMPLETED',
    createdAt: game.createdAt.toISOString(),
    completedAt: game.completedAt?.toISOString() ?? null,
    players,
    rounds,
    currentRoundNumber: currentRound?.roundNumber ?? null,
    currentTurnPlayerId: currentTurn?.playerId ?? null,
    winnerPlayerIds,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the set of dieIndices that are already kept across all rolls of a turn. */
function getKeptDiceIndices(turn: TurnWithRolls): Set<number> {
  const kept = new Set<number>();
  for (const roll of turn.rolls) {
    for (const dr of roll.dieResults) {
      if (dr.kept) kept.add(dr.dieIndex);
    }
  }
  return kept;
}

/**
 * After a turn is completed, either create the next turn in the current round
 * or complete the round and start the next round.
 */
async function advanceTurnOrRound(
  tx: TransactionClient,
  game: FullGame,
  currentRound: RoundWithTurns,
  currentTurn: TurnWithRolls,
): Promise<void> {
  const playerCount = game.players.length;

  if (currentTurn.turnOrder === playerCount - 1) {
    // Last turn in the round — complete the round
    await tx.round.update({
      where: { id: currentRound.id },
      data: { completedAt: new Date() },
    });

    // Compute the next round's first player using rotation rule
    const prevFirstPlayer = game.players.find((p) => p.id === currentRound.firstPlayerId)!;
    const nextFirstPos = (prevFirstPlayer.originalPosition + 1) % playerCount;
    const nextFirstPlayer = game.players.find((p) => p.originalPosition === nextFirstPos)!;

    // Create the next round
    const nextRound = await tx.round.create({
      data: {
        gameId: game.id,
        roundNumber: currentRound.roundNumber + 1,
        firstPlayerId: nextFirstPlayer.id,
      },
    });

    // Create the first turn of the next round
    await tx.turn.create({
      data: {
        roundId: nextRound.id,
        playerId: nextFirstPlayer.id,
        turnOrder: 0,
      },
    });
  } else {
    // More players remain in this round — create their turn
    const nextTurnOrder = currentTurn.turnOrder + 1;
    const firstPlayerPos = game.players.find((p) => p.id === currentRound.firstPlayerId)!
      .originalPosition;
    const nextPlayerPos = (firstPlayerPos + nextTurnOrder) % playerCount;
    const nextPlayer = game.players.find((p) => p.originalPosition === nextPlayerPos)!;

    await tx.turn.create({
      data: {
        roundId: currentRound.id,
        playerId: nextPlayer.id,
        turnOrder: nextTurnOrder,
      },
    });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getGame(gameId: string): Promise<GameDTO> {
  const game = await loadFullGame(gameId);
  return mapGameToDTO(game);
}

export async function createGame(playerNames: string[]): Promise<GameDTO> {
  // Validate player count
  if (playerNames.length < 2 || playerNames.length > 8) {
    throw new AppError(
      400,
      'INVALID_PLAYER_COUNT',
      'Player count must be between 2 and 8.',
    );
  }

  const trimmed = playerNames.map((n) => n.trim());

  // Validate individual names
  for (const name of trimmed) {
    if (!name) {
      throw new AppError(400, 'EMPTY_PLAYER_NAME', 'Player names cannot be empty.');
    }
    if (name.length > 50) {
      throw new AppError(
        400,
        'EMPTY_PLAYER_NAME',
        'Player name must be 50 characters or fewer.',
      );
    }
  }

  // Validate uniqueness (case-insensitive)
  const lower = trimmed.map((n) => n.toLowerCase());
  if (new Set(lower).size !== lower.length) {
    throw new AppError(400, 'DUPLICATE_PLAYER_NAME', 'Player names must be unique.');
  }

  // Create game, players, round 1, and first turn atomically
  const gameId = await prisma.$transaction(async (tx) => {
    const game = await tx.game.create({ data: {} });

    const players: Player[] = [];
    for (let i = 0; i < trimmed.length; i++) {
      const player = await tx.player.create({
        data: { gameId: game.id, name: trimmed[i], originalPosition: i },
      });
      players.push(player);
    }

    const round = await tx.round.create({
      data: {
        gameId: game.id,
        roundNumber: 1,
        firstPlayerId: players[0].id,
      },
    });

    await tx.turn.create({
      data: {
        roundId: round.id,
        playerId: players[0].id,
        turnOrder: 0,
      },
    });

    return game.id;
  });

  return getGame(gameId);
}

export async function rollDice(gameId: string): Promise<RollResponseDTO> {
  const game = await loadFullGame(gameId);

  if (game.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'GAME_COMPLETED', 'This game has already been completed.');
  }

  const currentRound = game.rounds.find((r) => r.completedAt === null);
  if (!currentRound) {
    throw new AppError(409, 'GAME_COMPLETED', 'All rounds are complete.');
  }

  const currentTurn = currentRound.turns.find((t) => t.completedAt === null);
  if (!currentTurn) {
    throw new AppError(409, 'GAME_COMPLETED', 'All turns in current round are complete.');
  }

  // Check for pending-keep: latest roll has un-kept dice
  const latestRoll = currentTurn.rolls[currentTurn.rolls.length - 1] ?? null;
  if (latestRoll && latestRoll.dieResults.some((dr) => !dr.kept)) {
    throw new AppError(
      409,
      'PENDING_KEEP',
      'You must keep at least one die before rolling again.',
    );
  }

  // Determine which dice to roll
  const keptIndices = getKeptDiceIndices(currentTurn);
  const diceToRoll = [0, 1, 2, 3, 4].filter((i) => !keptIndices.has(i));
  const values = rollDiceValues(diceToRoll.length);
  const rollNumber = currentTurn.rolls.length + 1;

  // Persist roll and die results, then maybe complete the turn
  const { newRollId, dieResultRows, turnCompleted } = await prisma.$transaction(async (tx) => {
    const newRoll = await tx.roll.create({
      data: { turnId: currentTurn.id, rollNumber },
    });

    const dieResultRows: DieResultRow[] = [];
    for (let i = 0; i < diceToRoll.length; i++) {
      const dr = await tx.dieResult.create({
        data: {
          rollId: newRoll.id,
          dieIndex: diceToRoll[i],
          value: values[i],
          kept: values[i] === 3, // auto-keep 3s
        },
      });
      dieResultRows.push(dr);
    }

    // Check if all 5 dice are now kept
    const newKeptIndices = new Set(keptIndices);
    for (const dr of dieResultRows) {
      if (dr.kept) newKeptIndices.add(dr.dieIndex);
    }
    const allKept = newKeptIndices.size === 5;

    if (allKept) {
      // Compute turn score and complete the turn
      const allDiceForScore = [
        ...currentTurn.rolls.flatMap((r) => r.dieResults),
        ...dieResultRows,
      ];
      const turnScore = computeScoreFromResults(allDiceForScore);

      await tx.turn.update({
        where: { id: currentTurn.id },
        data: { score: turnScore, completedAt: new Date() },
      });

      await advanceTurnOrRound(tx, game, currentRound, currentTurn);
    }

    return { newRollId: newRoll.id, dieResultRows, turnCompleted: allKept };
  });

  const updatedGame = await getGame(gameId);

  return {
    roll: {
      id: newRollId,
      rollNumber,
      dice: dieResultRows.map((dr) => ({
        dieIndex: dr.dieIndex,
        value: dr.value,
        kept: dr.kept,
      })),
    },
    turnCompleted,
    game: updatedGame,
  };
}

export async function keepDice(
  gameId: string,
  dieIndices: number[],
): Promise<KeepResponseDTO> {
  if (!dieIndices || dieIndices.length === 0) {
    throw new AppError(400, 'NO_DICE_SELECTED', 'You must select at least one die to keep.');
  }

  const game = await loadFullGame(gameId);

  if (game.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'GAME_COMPLETED', 'This game has already been completed.');
  }

  const currentRound = game.rounds.find((r) => r.completedAt === null);
  if (!currentRound) {
    throw new AppError(409, 'GAME_COMPLETED', 'All rounds are complete.');
  }

  const currentTurn = currentRound.turns.find((t) => t.completedAt === null);
  if (!currentTurn) {
    throw new AppError(409, 'NO_ACTIVE_ROLL', 'No active turn found.');
  }

  const latestRoll = currentTurn.rolls[currentTurn.rolls.length - 1];
  if (!latestRoll) {
    throw new AppError(409, 'NO_ACTIVE_ROLL', 'No roll in progress. Roll the dice first.');
  }

  // Validate dieIndices
  for (const idx of dieIndices) {
    if (idx < 0 || idx > 4) {
      throw new AppError(400, 'INVALID_DIE_INDEX', `Die index ${idx} is out of range (0–4).`);
    }
    const dr = latestRoll.dieResults.find((d) => d.dieIndex === idx);
    if (!dr) {
      throw new AppError(
        400,
        'INVALID_DIE_INDEX',
        `Die ${idx} was not part of the most recent roll.`,
      );
    }
    if (dr.kept) {
      throw new AppError(400, 'INVALID_DIE_INDEX', `Die ${idx} is already kept.`);
    }
  }

  // IDs of DieResult records to update
  const idsToKeep = dieIndices.map((idx) => latestRoll.dieResults.find((d) => d.dieIndex === idx)!.id);

  const { keptDiceResults, turnCompleted, turnScore } = await prisma.$transaction(async (tx) => {
    // Mark selected dice as kept
    await tx.dieResult.updateMany({
      where: { id: { in: idsToKeep } },
      data: { kept: true },
    });

    // Count total unique kept indices across all rolls in this turn
    const allKeptResults = await tx.dieResult.findMany({
      where: {
        kept: true,
        roll: { turnId: currentTurn.id },
      },
    });
    const uniqueKeptIndices = new Set(allKeptResults.map((dr) => dr.dieIndex));
    const allKept = uniqueKeptIndices.size === 5;

    let turnScore: number | null = null;

    if (allKept) {
      // Compute score: sum of kept values where value !== 3
      turnScore = allKeptResults.reduce(
        (sum, dr) => sum + (dr.value === 3 ? 0 : dr.value),
        0,
      );

      await tx.turn.update({
        where: { id: currentTurn.id },
        data: { score: turnScore, completedAt: new Date() },
      });

      await advanceTurnOrRound(tx, game, currentRound, currentTurn);
    }

    // Retrieve updated dice for the latest roll
    const keptDiceResults = await tx.dieResult.findMany({
      where: { rollId: latestRoll.id, dieIndex: { in: dieIndices } },
      orderBy: { dieIndex: 'asc' },
    });

    return { keptDiceResults, turnCompleted: allKept, turnScore };
  });

  const updatedGame = await getGame(gameId);

  return {
    keptDice: keptDiceResults.map((dr) => ({
      dieIndex: dr.dieIndex,
      value: dr.value,
      kept: dr.kept,
    })),
    turnCompleted,
    turnScore,
    game: updatedGame,
  };
}

export async function endGame(gameId: string): Promise<{ game: GameDTO }> {
  const game = await loadFullGame(gameId);

  if (game.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'GAME_COMPLETED', 'This game has already been completed.');
  }

  // Cannot end mid-round
  const currentRound = game.rounds.find((r) => r.completedAt === null);
  if (currentRound) {
    throw new AppError(
      409,
      'ROUND_IN_PROGRESS',
      'Cannot end the game while a round is in progress.',
    );
  }

  await prisma.game.update({
    where: { id: gameId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  const updatedGame = await getGame(gameId);
  return { game: updatedGame };
}

export async function listGames(
  page = 1,
  limit = 20,
): Promise<{ games: GameSummaryDTO[]; total: number; page: number; limit: number }> {
  const skip = (page - 1) * limit;

  const [total, games] = await Promise.all([
    prisma.game.count({ where: { status: 'COMPLETED' } }),
    prisma.game.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      skip,
      take: limit,
      include: {
        players: {
          orderBy: { originalPosition: 'asc' },
        },
        rounds: {
          include: {
            turns: {
              where: { completedAt: { not: null } },
              select: { playerId: true, score: true, completedAt: true },
            },
          },
        },
      },
    }),
  ]);

  const summaries: GameSummaryDTO[] = games.map((g) => {
    // Compute cumulative scores
    const cumulative = new Map<string, number>();
    for (const p of g.players) cumulative.set(p.id, 0);
    for (const r of g.rounds) {
      for (const t of r.turns) {
        if (t.score !== null) {
          cumulative.set(t.playerId, (cumulative.get(t.playerId) ?? 0) + t.score);
        }
      }
    }

    const scores = Array.from(cumulative.entries());
    const minScore = scores.length > 0 ? Math.min(...scores.map(([, s]) => s)) : 0;
    const winnerPlayerIds = scores.filter(([, s]) => s === minScore).map(([id]) => id);

    return {
      id: g.id,
      status: g.status as 'IN_PROGRESS' | 'COMPLETED',
      createdAt: g.createdAt.toISOString(),
      completedAt: g.completedAt?.toISOString() ?? null,
      players: g.players.map((p) => ({
        id: p.id,
        name: p.name,
        cumulativeScore: cumulative.get(p.id) ?? 0,
      })),
      winnerPlayerIds,
    };
  });

  return { games: summaries, total, page, limit };
}
