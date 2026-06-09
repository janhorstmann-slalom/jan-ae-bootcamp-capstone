import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Validates that req.body.players is a valid string array (used for POST /games).
 */
export function validateCreateGame(req: Request, _res: Response, next: NextFunction): void {
  const { players } = req.body as { players?: unknown };
  if (!Array.isArray(players)) {
    return next(new AppError(400, 'INVALID_PLAYER_COUNT', 'players must be an array of names.'));
  }
  for (const name of players) {
    if (typeof name !== 'string') {
      return next(new AppError(400, 'EMPTY_PLAYER_NAME', 'Each player name must be a string.'));
    }
    if (name.trim().length === 0) {
      return next(new AppError(400, 'EMPTY_PLAYER_NAME', 'Player names cannot be empty.'));
    }
    if (name.trim().length > 50) {
      return next(
        new AppError(400, 'EMPTY_PLAYER_NAME', 'Player name must be 50 characters or fewer.'),
      );
    }
  }
  next();
}

/**
 * Validates that req.body.dieIndices is a non-empty array of numbers 0–4 (used for POST /games/:id/keep).
 */
export function validateKeepDice(req: Request, _res: Response, next: NextFunction): void {
  const { dieIndices } = req.body as { dieIndices?: unknown };
  if (!Array.isArray(dieIndices) || dieIndices.length === 0) {
    return next(
      new AppError(400, 'NO_DICE_SELECTED', 'dieIndices must be a non-empty array of numbers.'),
    );
  }
  for (const idx of dieIndices) {
    if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx > 4) {
      return next(
        new AppError(400, 'INVALID_DIE_INDEX', `Die index ${idx} is out of range (must be 0–4).`),
      );
    }
  }
  next();
}
