import type { PlayerDTO } from '@shared/types/api';

interface Props {
  players: PlayerDTO[];
  currentTurnPlayerId: string | null;
}

export default function Scoreboard({ players, currentTurnPlayerId }: Props) {
  return (
    <table className="scoreboard" aria-label="Scoreboard">
      <thead>
        <tr>
          <th>Player</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => (
          <tr
            key={player.id}
            className={player.id === currentTurnPlayerId ? 'scoreboard__row--active' : ''}
            aria-current={player.id === currentTurnPlayerId ? 'true' : undefined}
          >
            <td className="scoreboard__name">
              {player.id === currentTurnPlayerId && (
                <span className="scoreboard__indicator" aria-hidden="true">▶ </span>
              )}
              {player.name}
            </td>
            <td className="scoreboard__score">{player.cumulativeScore}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
