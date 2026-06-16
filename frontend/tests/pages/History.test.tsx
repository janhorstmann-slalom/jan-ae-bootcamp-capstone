import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import History from '../../src/pages/History';
import type { GameSummaryDTO } from '@shared/types/api';

// Mock the api module
vi.mock('../../src/services/api', () => ({
  listGames: vi.fn(),
}));

import { listGames } from '../../src/services/api';

const mockListGames = listGames as ReturnType<typeof vi.fn>;

function makeGame(id: string, playerNames: string[], winnerIdx: number): GameSummaryDTO {
  const players = playerNames.map((name, i) => ({ id: `p${i}`, name, cumulativeScore: i * 10 }));
  return {
    id,
    status: 'COMPLETED',
    createdAt: '2026-06-09T10:00:00.000Z',
    completedAt: '2026-06-09T11:00:00.000Z',
    players,
    winnerPlayerIds: [players[winnerIdx].id],
  };
}

describe('History page', () => {
  it('renders empty-state message when no completed games exist', async () => {
    mockListGames.mockResolvedValue({ games: [], total: 0, page: 1, limit: 20 });
    render(
      <MemoryRouter>
        <History />
      </MemoryRouter>,
    );
    await screen.findByText(/no games yet/i);
  });

  it('renders a list item for each game with player names and winner', async () => {
    const games = [
      makeGame('g1', ['Alice', 'Bob'], 0),
      makeGame('g2', ['Carol', 'Dave'], 1),
    ];
    mockListGames.mockResolvedValue({ games, total: 2, page: 1, limit: 20 });

    render(
      <MemoryRouter>
        <History />
      </MemoryRouter>,
    );

    // Alice appears in both the players span and the winner span — use getAllByText
    await screen.findAllByText(/alice/i);
    expect(screen.getByText(/alice, bob/i)).toBeInTheDocument();
    expect(screen.getByText(/carol, dave/i)).toBeInTheDocument();
  });

  it('list items include a link to the game detail route', async () => {
    const games = [makeGame('g1', ['Alice', 'Bob'], 0)];
    mockListGames.mockResolvedValue({ games, total: 1, page: 1, limit: 20 });

    render(
      <MemoryRouter>
        <History />
      </MemoryRouter>,
    );

    // Alice appears in both players span and winner span — use findAllByText
    await screen.findAllByText(/alice/i);
    const links = screen.getAllByRole('link');
    const gameLink = links.find((l) => (l as HTMLAnchorElement).href.includes('/history/g1'));
    expect(gameLink).toBeDefined();
  });
});
