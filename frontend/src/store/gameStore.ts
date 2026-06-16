import { create } from 'zustand';
import type { GameDTO } from '@shared/types/api';

interface GameStore {
  game: GameDTO | null;
  setGame: (game: GameDTO) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: null,
  setGame: (game) => set({ game }),
  clearGame: () => set({ game: null }),
}));
