import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Scoreboard from '../../src/components/Scoreboard';
import type { PlayerDTO } from '@shared/types/api';

const players: PlayerDTO[] = [
  { id: 'p0', name: 'Alice', originalPosition: 0, cumulativeScore: 0 },
  { id: 'p1', name: 'Bob', originalPosition: 1, cumulativeScore: 15 },
];

describe('Scoreboard', () => {
  it('renders a row for each player', () => {
    render(<Scoreboard players={players} currentTurnPlayerId={null} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows 0 for players with no completed turns', () => {
    const zeroPlayers: PlayerDTO[] = [
      { id: 'p0', name: 'Alice', originalPosition: 0, cumulativeScore: 0 },
      { id: 'p1', name: 'Bob', originalPosition: 1, cumulativeScore: 0 },
    ];
    render(<Scoreboard players={zeroPlayers} currentTurnPlayerId={null} />);
    const scores = screen.getAllByText('0');
    expect(scores.length).toBeGreaterThanOrEqual(2);
  });

  it('displays correct cumulative score after turns', () => {
    render(<Scoreboard players={players} currentTurnPlayerId={null} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('applies active-player highlight class to the current player row', () => {
    const { container } = render(
      <Scoreboard players={players} currentTurnPlayerId="p0" />,
    );
    const activeRow = container.querySelector('.scoreboard__row--active');
    expect(activeRow).toBeInTheDocument();
    expect(activeRow?.textContent).toContain('Alice');
  });

  it('does not apply active class to non-current players', () => {
    const { container } = render(
      <Scoreboard players={players} currentTurnPlayerId="p0" />,
    );
    const rows = container.querySelectorAll('.scoreboard__row--active');
    expect(rows).toHaveLength(1);
  });
});
