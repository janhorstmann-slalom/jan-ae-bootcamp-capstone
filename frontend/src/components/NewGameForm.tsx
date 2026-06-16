import { useState } from 'react';

interface Props {
  onSubmit: (playerNames: string[]) => void;
  loading?: boolean;
}

export default function NewGameForm({ onSubmit, loading = false }: Props) {
  const [names, setNames] = useState<string[]>(['', '']);
  const [error, setError] = useState<string | null>(null);

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
    setError(null);
  };

  const addPlayer = () => {
    if (names.length < 8) {
      setNames((prev) => [...prev, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (names.length > 2) {
      setNames((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = names.map((n) => n.trim());

    if (trimmed.some((n) => !n)) {
      setError('All player names must be non-empty.');
      return;
    }

    const lower = trimmed.map((n) => n.toLowerCase());
    if (new Set(lower).size !== lower.length) {
      setError('Player names must be unique (case-insensitive).');
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <form className="new-game-form" onSubmit={handleSubmit} aria-label="New Game Form">
      <h2>New Game</h2>

      {names.map((name, i) => (
        <div key={i} className="player-row">
          <label htmlFor={`player-name-${i}`} className="sr-only">
            Player {i + 1} name
          </label>
          <input
            id={`player-name-${i}`}
            type="text"
            value={name}
            onChange={(e) => updateName(i, e.target.value)}
            placeholder={`Player ${i + 1} name`}
            maxLength={50}
            aria-label={`Player ${i + 1} name`}
          />
          <button
            type="button"
            className="remove-btn"
            onClick={() => removePlayer(i)}
            disabled={names.length <= 2}
            aria-label={`Remove player ${i + 1}`}
          >
            Remove
          </button>
        </div>
      ))}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="add-player-btn"
          onClick={addPlayer}
          disabled={names.length >= 8}
        >
          Add Player
        </button>

        <button type="submit" className="start-btn" disabled={loading}>
          {loading ? 'Starting…' : 'Start Game'}
        </button>
      </div>
    </form>
  );
}
