import type {
  GameDTO,
  GameSummaryDTO,
  RollResponseDTO,
  KeepResponseDTO,
  ListGamesResponseDTO,
} from '@shared/types/api';

const BASE_URL = '/api';

export interface ApiError {
  error: string;
  message: string;
  status: number;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = (await res.json()) as T | { error: string; message: string };

  if (!res.ok) {
    const errData = data as { error: string; message: string };
    const err: ApiError = {
      error: errData.error ?? 'UNKNOWN_ERROR',
      message: errData.message ?? 'An unexpected error occurred.',
      status: res.status,
    };
    throw err;
  }

  return data as T;
}

// ─── Game endpoints ───────────────────────────────────────────────────────────

export async function createGame(playerNames: string[]): Promise<GameDTO> {
  return apiFetch<GameDTO>('/games', {
    method: 'POST',
    body: JSON.stringify({ players: playerNames }),
  });
}

export async function getGame(gameId: string): Promise<GameDTO> {
  return apiFetch<GameDTO>(`/games/${gameId}`);
}

export async function rollDice(gameId: string): Promise<RollResponseDTO> {
  return apiFetch<RollResponseDTO>(`/games/${gameId}/roll`, { method: 'POST' });
}

export async function keepDice(gameId: string, dieIndices: number[]): Promise<KeepResponseDTO> {
  return apiFetch<KeepResponseDTO>(`/games/${gameId}/keep`, {
    method: 'POST',
    body: JSON.stringify({ dieIndices }),
  });
}

export async function endGame(gameId: string): Promise<{ game: GameDTO }> {
  return apiFetch<{ game: GameDTO }>(`/games/${gameId}/end`, { method: 'POST' });
}

export async function listGames(page = 1, limit = 20): Promise<ListGamesResponseDTO> {
  return apiFetch<ListGamesResponseDTO>(`/games?page=${page}&limit=${limit}`);
}

export async function getGameDetail(gameId: string): Promise<GameDTO> {
  return apiFetch<GameDTO>(`/games/${gameId}`);
}
