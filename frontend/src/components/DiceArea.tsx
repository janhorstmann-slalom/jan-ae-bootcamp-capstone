import { useState, useEffect } from 'react';
import type { RollDTO } from '@shared/types/api';
import Die from './Die';

interface Props {
  currentRoll: RollDTO | null;
  /** Map of dieIndex → face value for dice kept in previous rolls of this turn */
  previouslyKeptDice: Map<number, number>;
  /** Called with selected die indices to keep (empty array = first roll, no keep needed) */
  onRoll: (dieIndicesToKeep: number[]) => void;
  rolling: boolean;
  turnCompleted: boolean;
}

export default function DiceArea({
  currentRoll,
  previouslyKeptDice,
  onRoll,
  rolling,
  turnCompleted,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // Holds the indices mid-flight (after click, before API resolves) so those dice
  // remain visually selected instead of showing a spinner.
  const [pendingKeepIndices, setPendingKeepIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!rolling) setPendingKeepIndices(new Set());
  }, [rolling]);

  // Pending keep = rolled but no die kept yet. Requires ≥1 selection before rolling again.
  const hasPendingKeep =
    currentRoll !== null &&
    !currentRoll.dice.some((d) => d.kept);

  // Show inline prompt when pending keep but nothing selected (suppress during API call)
  const showSelectPrompt = hasPendingKeep && selected.size === 0 && !rolling;

  const toggleSelect = (dieIndex: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dieIndex)) next.delete(dieIndex);
      else next.add(dieIndex);
      return next;
    });
  };

  const handleRoll = () => {
    const indices = Array.from(selected);
    setPendingKeepIndices(new Set(indices));
    setSelected(new Set());
    onRoll(indices);
  };

  // Build the 5-die display state
  const diceState: Array<{
    dieIndex: number;
    value: number;
    kept: boolean;
    autoKept: boolean;
  }> = Array.from({ length: 5 }, (_, i) => {
    // Dice kept in previous rolls of this turn
    if (previouslyKeptDice.has(i)) {
      const val = previouslyKeptDice.get(i)!;
      return { dieIndex: i, value: val, kept: true, autoKept: val === 3 };
    }
    // Find in current roll
    const dr = currentRoll?.dice.find((d) => d.dieIndex === i);
    if (!dr) {
      return { dieIndex: i, value: 0, kept: false, autoKept: false };
    }
    return { dieIndex: i, value: dr.value, kept: dr.kept, autoKept: dr.value === 3 };
  });

  const availableDiceCount = diceState.filter((d) => !d.kept && d.value !== 0).length;
  const allAvailableSelected =
    availableDiceCount > 0 && selected.size >= availableDiceCount;

  // Running score: sum of already-kept + currently-selected non-3 values
  const runningScore = diceState.reduce((sum, d) => {
    if (d.value === 0 || d.value === 3) return sum;
    if (d.kept || selected.has(d.dieIndex)) return sum + d.value;
    return sum;
  }, 0);

  return (
    <div className="dice-area">
      <div className="running-score" aria-live="polite">
        Turn score: <strong>{runningScore}</strong>
      </div>
      <div className="dice-row" role="group" aria-label="Dice">
        {diceState.map((d) => (
          <Die
            key={d.dieIndex}
            dieIndex={d.dieIndex}
            value={d.value}
            kept={d.kept}
            autoKept={d.autoKept}
            selected={selected.has(d.dieIndex) || pendingKeepIndices.has(d.dieIndex)}
            rolling={rolling && !d.kept && !pendingKeepIndices.has(d.dieIndex)}
            onClick={toggleSelect}
          />
        ))}
      </div>

      <div className="dice-actions">
        {showSelectPrompt && (
          <p className="select-prompt" role="alert">Select at least 1 die to keep before rolling again.</p>
        )}
        <button
          type="button"
          className="roll-btn"
          onClick={handleRoll}
          disabled={showSelectPrompt || rolling || turnCompleted}
          aria-label={allAvailableSelected ? 'End Turn' : 'Roll Dice'}
        >
          {rolling ? 'Rolling…' : allAvailableSelected ? 'End Turn' : 'Roll Dice'}
        </button>
      </div>
    </div>
  );
}
