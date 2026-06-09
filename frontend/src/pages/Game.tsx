import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getGame, rollDice, keepDice, endGame } from '../services/api';
import DiceArea from '../components/DiceArea';
import Scoreboard from '../components/Scoreboard';
import type { RollDTO, TurnDTO } from '@shared/types/api';
import type { ApiError } from '../services/api';

export default function Game() {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { game, setGame } = useGameStore();

  const [rolling, setRolling] = useState(false);
  const [keeping, setKeeping] = useState(false);
  const [ending, setEnding] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [roundBanner, setRoundBanner] = useState<string | null>(null);
  const [turnScoreBanner, setTurnScoreBanner] = useState<number | null>(null);

  // T052: Rehydrate on browser refresh
  useEffect(() => {
    if (!gameId) return;
    if (!game || game.id !== gameId) {
      getGame(gameId).then(setGame).catch(console.error);
    }
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRoll = useCallback(async () => {
    if (!gameId) return;
    setApiError(null);
    setTurnScoreBanner(null);
    setRolling(true);
    try {
      const result = await rollDice(gameId);
      setGame(result.game);
      if (result.turnCompleted) {
        const score = result.game.rounds
          .flatMap((r) => r.turns)
          .find((t) => t.completedAt !== null && t.score !== null && t.playerId === game?.currentTurnPlayerId)?.score ?? null;
        setTurnScoreBanner(score);
      }
    } catch (err) {
      setApiError((err as ApiError).message);
    } finally {
      setRolling(false);
    }
  }, [gameId, game, setGame]);

  const handleKeep = useCallback(
    async (dieIndices: number[]) => {
      if (!gameId) return;
      setApiError(null);
      setKeeping(true);
      try {
        const result = await keepDice(gameId, dieIndices);
        setGame(result.game);

        if (result.turnCompleted) {
          setTurnScoreBanner(result.turnScore);

          // Check if a new round started
          const prevRound = game?.currentRoundNumber ?? 1;
          const newRound = result.game.currentRoundNumber;
          if (newRound !== null && newRound > prevRound) {
            setRoundBanner(`Round ${prevRound} complete — Round ${newRound} starting!`);
            setTimeout(() => setRoundBanner(null), 3000);
          }
        }
      } catch (err) {
        setApiError((err as ApiError).message);
      } finally {
        setKeeping(false);
      }
    },
    [gameId, game, setGame],
  );

  const handleEndGame = useCallback(async () => {
    if (!gameId) return;
    setApiError(null);
    setEnding(true);
    try {
      const result = await endGame(gameId);
      setGame(result.game);
      navigate(`/game/${gameId}/result`);
    } catch (err) {
      setApiError((err as ApiError).message);
    } finally {
      setEnding(false);
    }
  }, [gameId, navigate, setGame]);

  if (!game) {
    return <div className="page loading-page"><p>Loading game…</p></div>;
  }

  if (game.status === 'COMPLETED') {
    navigate(`/game/${game.id}/result`);
    return null;
  }

  const currentPlayer = game.players.find((p) => p.id === game.currentTurnPlayerId);
  const currentRound = game.rounds.find((r) => r.roundNumber === game.currentRoundNumber);
  const currentTurn: TurnDTO | undefined = currentRound?.turns.find(
    (t) => t.completedAt === null,
  );
  const currentRoll: RollDTO | null =
    currentTurn && currentTurn.rolls.length > 0
      ? currentTurn.rolls[currentTurn.rolls.length - 1]
      : null;

  // Which dieIndices are kept from previous rolls in this turn
  const previouslyKeptIndices = new Set<number>();
  if (currentTurn) {
    for (const roll of currentTurn.rolls) {
      for (const dr of roll.dice) {
        if (dr.kept) previouslyKeptIndices.add(dr.dieIndex);
      }
    }
    // Remove indices in the current roll (those aren't "previously" kept)
    if (currentRoll) {
      for (const dr of currentRoll.dice) {
        if (!dr.kept) previouslyKeptIndices.delete(dr.dieIndex);
      }
    }
  }

  const isRoundComplete =
    game.currentTurnPlayerId === null && game.status === 'IN_PROGRESS';

  return (
    <div className="page game-page">
      <header className="app-header">
        <h1>Threes Away</h1>
        <span className="round-indicator">Round {game.currentRoundNumber}</span>
      </header>

      <main className="game-main">
        <section className="active-player">
          <h2>{currentPlayer ? `${currentPlayer.name}'s Turn` : 'Waiting…'}</h2>
        </section>

        {roundBanner && (
          <div className="round-banner" role="status" aria-live="polite">
            {roundBanner}
          </div>
        )}

        {turnScoreBanner !== null && (
          <div className="turn-score-banner" role="status" aria-live="polite">
            Turn score: {turnScoreBanner}
          </div>
        )}

        {apiError && (
          <p className="api-error" role="alert">
            {apiError}
          </p>
        )}

        {currentTurn && (
          <DiceArea
            currentRoll={currentRoll}
            previouslyKeptIndices={previouslyKeptIndices}
            onRoll={handleRoll}
            onKeep={handleKeep}
            rolling={rolling}
            keeping={keeping}
            turnCompleted={currentTurn.completedAt !== null}
          />
        )}

        <aside className="scoreboard-aside">
          <Scoreboard
            players={game.players}
            currentTurnPlayerId={game.currentTurnPlayerId}
          />
        </aside>

        {isRoundComplete && (
          <div className="end-game-area">
            <button
              type="button"
              className="end-game-btn"
              onClick={handleEndGame}
              disabled={ending}
            >
              {ending ? 'Ending…' : 'End Game'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
