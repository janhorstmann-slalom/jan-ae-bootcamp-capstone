import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validateCreateGame, validateKeepDice } from '../middleware/validate';
import {
  createGame,
  getGame,
  rollDice,
  keepDice,
  endGame,
  listGames,
} from '../services/gameService';

const router = Router();

// ─── POST /api/games ──────────────────────────────────────────────────────────
// T018 — Create a new game
router.post(
  '/',
  validateCreateGame,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { players } = req.body as { players: string[] };
      const game = await createGame(players);
      res.status(201).json(game);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/games ───────────────────────────────────────────────────────────
// T054 — List completed games (match history)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
    const result = await listGames(page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/games/:id ───────────────────────────────────────────────────────
// T014a — Get full game state
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const game = await getGame(req.params.id);
    res.json(game);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/games/:id/roll ─────────────────────────────────────────────────
// T030 — Roll dice
router.post('/:id/roll', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await rollDice(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/games/:id/keep ─────────────────────────────────────────────────
// T032 — Keep dice
router.post(
  '/:id/keep',
  validateKeepDice,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dieIndices } = req.body as { dieIndices: number[] };
      const result = await keepDice(req.params.id, dieIndices);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/games/:id/end ──────────────────────────────────────────────────
// T047 — End game
router.post('/:id/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await endGame(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
