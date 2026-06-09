// Shared DTO types used by both backend and frontend.
// Both consumers import via the @shared/types/api path alias.

export type GameStatus = "IN_PROGRESS" | "COMPLETED";

export interface DieResultDTO {
  dieIndex: number;   // 0–4; stable identifier across re-rolls
  value: number;      // 1–6
  kept: boolean;      // true if kept this roll or auto-kept (value === 3)
}

export interface RollDTO {
  id: string;
  rollNumber: number; // 1..5
  dice: DieResultDTO[];
}

export interface TurnDTO {
  id: string;
  playerId: string;
  turnOrder: number;          // 0-indexed within the round
  score: number | null;
  completedAt: string | null; // ISO 8601
  rolls: RollDTO[];
}

export interface RoundDTO {
  id: string;
  roundNumber: number;
  firstPlayerId: string;
  completedAt: string | null;
  turns: TurnDTO[];
}

export interface PlayerDTO {
  id: string;
  name: string;
  originalPosition: number;
  cumulativeScore: number; // computed; sum of completed turn scores
}

export interface GameDTO {
  id: string;
  status: GameStatus;
  createdAt: string;          // ISO 8601
  completedAt: string | null;
  players: PlayerDTO[];
  rounds: RoundDTO[];
  // Derived convenience fields (populated by backend)
  currentRoundNumber: number | null;
  currentTurnPlayerId: string | null; // null if game completed or between rounds
  winnerPlayerIds: string[] | null;   // null until game COMPLETED
}

export interface GameSummaryDTO {
  id: string;
  status: GameStatus;
  createdAt: string;
  completedAt: string | null;
  players: Array<{ id: string; name: string; cumulativeScore: number }>;
  winnerPlayerIds: string[] | null;
}

// ---- Request types ----

export interface CreateGameRequest {
  players: string[];
}

export interface KeepDiceRequest {
  dieIndices: number[];
}

// ---- Response types ----

export interface RollResponseDTO {
  roll: RollDTO;
  turnCompleted: boolean;
  game: GameDTO;
}

export interface KeepResponseDTO {
  keptDice: DieResultDTO[];
  turnCompleted: boolean;
  turnScore: number | null;
  game: GameDTO;
}

export interface ListGamesResponseDTO {
  games: GameSummaryDTO[];
  total: number;
  page: number;
  limit: number;
}
