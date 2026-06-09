import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getGame, createGame } from '../services/api';
import Scoreboard from '../components/Scoreboard';

export default function GameResult() {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { game, setGame, clearGame } = useGameStore();

  useEffect(() => {
    if (!gameId) return;
    if (!game || game.id !== gameId) {
      getGame(gameId).then(setGame).catch(console.error);
    }
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game) {
    return <div className="page loading-page"><p>Loading result…</p></div>;
  }

  if (game.status !== 'COMPLETED') {
    navigate(`/game/${game.id}`);
    return null;
  }

  const [rematching, setRematching] = useState(false);

  const winners = game.players.filter((p) => game.winnerPlayerIds?.includes(p.id));

  const handleNewGame = () => {
    clearGame();
    navigate('/');
  };

  const handleRematch = async () => {
    setRematching(true);
    try {
      // Same players, same order
      const playerNames = game.players
        .slice()
        .sort((a, b) => (a.originalPosition ?? 0) - (b.originalPosition ?? 0))
        .map((p) => p.name);
      const newGame = await createGame(playerNames);
      setGame(newGame);
      navigate(`/game/${newGame.id}`);
    } catch {
      setRematching(false);
    }
  };

  return (
    <div className="page result-page">
      <header className="app-header">
        <h1>Threes Away — Game Over!</h1>
      </header>

      <main className="result-main">
        <section className="winner-section">
          {winners.length === 1 ? (
            <h2>🏆 {winners[0].name} wins!</h2>
          ) : (
            <h2>🏆 It's a tie! {winners.map((w) => w.name).join(', ')} win!</h2>
          )}
        </section>

        <section className="final-scores">
          <h3>Final Scores</h3>
          <Scoreboard players={game.players} currentTurnPlayerId={null} />
        </section>

        <section className="round-breakdown">
          <h3>Round Breakdown</h3>
          <table className="round-table">
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
        </section>

        <div className="result-actions">
          <button type="button" className="rematch-btn" onClick={handleRematch} disabled={rematching}>
            {rematching ? 'Starting…' : '🔁 Rematch'}
          </button>
          <button type="button" className="new-game-btn" onClick={handleNewGame}>
            New Game
          </button>
          <Link to="/history" className="history-link">
            Match History
          </Link>
        </div>
      </main>
    </div>
  );
}
