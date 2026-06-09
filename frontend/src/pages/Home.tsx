import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { createGame } from '../services/api';
import NewGameForm from '../components/NewGameForm';
import type { ApiError } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const setGame = useGameStore((s) => s.setGame);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (playerNames: string[]) => {
    setApiError(null);
    setLoading(true);
    try {
      const game = await createGame(playerNames);
      setGame(game);
      navigate(`/game/${game.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setApiError(apiErr.message ?? 'Failed to create game.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page home-page">
      <header className="app-header">
        <h1>Threes Away</h1>
        <nav>
          <Link to="/history">Match History</Link>
        </nav>
      </header>

      <main>
        {apiError && (
          <p className="api-error" role="alert">
            {apiError}
          </p>
        )}
        <NewGameForm onSubmit={handleSubmit} loading={loading} />
      </main>
    </div>
  );
}
