import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listGames } from '../services/api';
import type { GameSummaryDTO } from '@shared/types/api';

export default function History() {
  const [games, setGames] = useState<GameSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listGames()
      .then((data) => setGames(data.games))
      .catch((err) => setError(err.message ?? 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page history-page">
      <header className="app-header">
        <h1>Match History</h1>
        <nav>
          <Link to="/">New Game</Link>
        </nav>
      </header>

      <main>
        {loading && <p>Loading…</p>}
        {error && <p className="api-error" role="alert">{error}</p>}

        {!loading && !error && games.length === 0 && (
          <p className="empty-state">No games yet. Start playing!</p>
        )}

        {!loading && games.length > 0 && (
          <ul className="game-list" aria-label="Games">
            {games.map((g) => {
              const isCompleted = g.status === 'COMPLETED';
              const winnerNames = isCompleted
                ? g.players
                    .filter((p) => g.winnerPlayerIds?.includes(p.id))
                    .map((p) => p.name)
                    .join(', ')
                : null;
              const playerNames = g.players.map((p) => p.name).join(', ');
              const date = new Date(g.createdAt).toLocaleDateString();

              return (
                <li key={g.id} className="game-list__item">
                  <Link to={isCompleted ? `/history/${g.id}` : '#'} className="game-list__link">
                    <span className="game-list__date">{date}</span>
                    <span className="game-list__players">{playerNames}</span>
                    {isCompleted
                      ? <span className="game-list__winner">Winner: {winnerNames}</span>
                      : <span className="game-list__status">In Progress</span>
                    }
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
