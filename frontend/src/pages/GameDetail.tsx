import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGameDetail } from '../services/api';
import type { GameDTO } from '@shared/types/api';

export default function GameDetail() {
  const { id: gameId } = useParams<{ id: string }>();
  const [game, setGame] = useState<GameDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    getGameDetail(gameId)
      .then(setGame)
      .catch((err) => setError(err.message ?? 'Failed to load game.'))
      .finally(() => setLoading(false));
  }, [gameId]);

  if (loading) return <div className="page loading-page"><p>Loading…</p></div>;
  if (error) return <div className="page"><p className="api-error">{error}</p></div>;
  if (!game) return null;

  const winners = game.players.filter((p) => game.winnerPlayerIds?.includes(p.id));

  return (
    <div className="page game-detail-page">
      <header className="app-header">
        <h1>Game Detail</h1>
        <nav>
          <Link to="/history">← Back to History</Link>
        </nav>
      </header>

      <main>
        <section className="game-detail-header">
          <p>
            <strong>Date:</strong>{' '}
            {game.completedAt
              ? new Date(game.completedAt).toLocaleString()
              : 'In progress'}
          </p>
          {winners.length > 0 && (
            <p>
              <strong>Winner{winners.length > 1 ? 's' : ''}:</strong>{' '}
              {winners.map((w) => w.name).join(', ')}
            </p>
          )}
        </section>

        <table className="score-detail-table" aria-label="Per-round scores">
          <thead>
            <tr>
              <th>Player</th>
              {game.rounds.map((r) => (
                <th key={r.id}>Round {r.roundNumber}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {game.players.map((player) => {
              const roundScores = game.rounds.map((r) => {
                const turn = r.turns.find((t) => t.playerId === player.id);
                return turn?.score ?? '—';
              });
              return (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  {roundScores.map((score, i) => (
                    <td key={i}>{score}</td>
                  ))}
                  <td>
                    <strong>{player.cumulativeScore}</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </div>
  );
}
