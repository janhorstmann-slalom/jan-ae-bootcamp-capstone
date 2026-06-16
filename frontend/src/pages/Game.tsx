import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getGame, rollDice, keepDice, listGames } from '../services/api';
import DiceArea from '../components/DiceArea';
import Scoreboard from '../components/Scoreboard';
import type { RollDTO, TurnDTO, GameSummaryDTO } from '@shared/types/api';
import type { ApiError } from '../services/api';

export default function Game() {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { game, setGame } = useGameStore();

  const [rolling, setRolling] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [turnScoreBanner, setTurnScoreBanner] = useState<number | null>(null);
  const [matchLog, setMatchLog] = useState<GameSummaryDTO[]>([]);

  const refreshMatchLog = useCallback(() => {
    listGames(1, 10).then((data) => setMatchLog(data.games)).catch(() => {});
  }, []);

  useEffect(() => {
    refreshMatchLog();
  }, [refreshMatchLog]);

  // Rehydrate on browser refresh
  useEffect(() => {
    if (!gameId) return;
    if (!game || game.id !== gameId) {
      getGame(gameId).then(setGame).catch(console.error);
    }
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRoll = useCallback(
    async (dieIndicesToKeep: number[]) => {
      if (!gameId) return;
      setApiError(null);
      setTurnScoreBanner(null);
      setRolling(true);
      try {
        // If there are dice to keep first, keep them; if that completes the turn, stop.
        if (dieIndicesToKeep.length > 0) {
          const keepResult = await keepDice(gameId, dieIndicesToKeep);
          setGame(keepResult.game);
          if (keepResult.turnCompleted) {
            setTurnScoreBanner(keepResult.turnScore);
            return;
          }
        }
        // Roll the remaining dice
        const rollResult = await rollDice(gameId);
        setGame(rollResult.game);
        if (rollResult.turnCompleted) {
          const score =
            rollResult.game.rounds
              .flatMap((r) => r.turns)
              .find(
                (t) =>
                  t.completedAt !== null &&
                  t.score !== null &&
                  t.playerId === game?.currentTurnPlayerId,
              )?.score ?? null;
          setTurnScoreBanner(score);
        }
      } catch (err) {
        setApiError((err as ApiError).message);
      } finally {
        setRolling(false);
      }
    },
    [gameId, game, setGame],
  );

  if (!game) {
    return <div className="page loading-page"><p>Loading game…</p></div>;
  }

  if (game.status === "COMPLETED") {
    refreshMatchLog();
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

  const previouslyKeptDice = new Map<number, number>();
  if (currentTurn) {
    for (const roll of currentTurn.rolls) {
      for (const dr of roll.dice) {
        if (dr.kept) previouslyKeptDice.set(dr.dieIndex, dr.value);
      }
    }
    if (currentRoll) {
      for (const dr of currentRoll.dice) {
        if (!dr.kept) previouslyKeptDice.delete(dr.dieIndex);
      }
    }
  }

  return (
    <div className="page game-page">
      <header className="app-header">
        <h1>Threes Away</h1>
        <span className="round-indicator">Round {game.currentRoundNumber}</span>
      </header>

      <main className="game-main">
        <section className="active-player">
          <h2>{currentPlayer ? `${currentPlayer.name}'s Turn` : "Waiting…"}</h2>
          <button
            type="button"
            className="restart-btn"
            onClick={() => navigate("/")}
          >
            Restart Game
          </button>
        </section>

        {turnScoreBanner !== null && (
          <div className="turn-score-banner" role="status" aria-live="polite">
            Turn score: <strong>{turnScoreBanner}</strong>
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
            previouslyKeptDice={previouslyKeptDice}
            onRoll={handleRoll}
            rolling={rolling}
            turnCompleted={currentTurn.completedAt !== null}
          />
        )}

        <aside className="scoreboard-aside">
          <Scoreboard
            players={game.players}
            currentTurnPlayerId={game.currentTurnPlayerId}
          />
        </aside>

        {matchLog.length > 0 && (
          <section className="match-log">
            <h3 className="match-log__title">Match Log</h3>
            <ul className="match-log__list">
              {matchLog.map((g) => {
                const isCompleted = g.status === "COMPLETED";
                const playerNames = g.players.map((p) => p.name).join(" vs ");
                const winnerNames = isCompleted
                  ? g.players
                      .filter((p) => g.winnerPlayerIds?.includes(p.id))
                      .map((p) => p.name)
                      .join(", ")
                  : null;
                const date = new Date(g.createdAt).toLocaleDateString();
                const isCurrent = g.id === gameId;
                return (
                  <li
                    key={g.id}
                    className={`match-log__entry${isCurrent ? " match-log__entry--current" : ""}`}
                  >
                    <span className="match-log__date">{date}</span>
                    <span className="match-log__players">{playerNames}</span>
                    {isCompleted ? (
                      <span className="match-log__winner">🏆 {winnerNames}</span>
                    ) : (
                      <span className="match-log__status">
                        {isCurrent ? "Now playing" : "Abandoned"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
