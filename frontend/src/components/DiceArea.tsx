import { useState } from 'react';
import type { RollDTO } from '@shared/types/api';
import Die from './Die';

interface Props {
  currentRoll: RollDTO | null;
  /** dieIndices that are already kept from previous rolls in this turn */
  previouslyKeptIndices: Set<number>;
  onRoll: () => void;
  onKeep: (dieIndices: number[]) => void;
  rolling: boolean;
  keeping: boolean;
  turnCompleted: boolean;
}

export default function DiceArea({
  currentRoll,
  previouslyKeptIndices,
  onRoll,
  onKeep,
  rolling,
  keeping,
  turnCompleted,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const hasPendingKeep =
    currentRoll !== null && currentRoll.dice.some((d) => !d.kept);

  const toggleSelect = (dieIndex: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dieIndex)) next.delete(dieIndex);
      else next.add(dieIndex);
      return next;
    });
  };

  const handleKeep = () => {
    if (selected.size === 0) return;
    onKeep(Array.from(selected));
    setSelected(new Set());
  };

  const handleRoll = () => {
    setSelected(new Set());
    onRoll();
  };

  // Build the 5-die display state
  const diceState: Array<{
    dieIndex: number;
    value: number;
    kept: boolean;
    autoKept: boolean;
  }> = Array.from({ length: 5 }, (_, i) => {
    // Check if previously kept
    if (previouslyKeptIndices.has(i)) {
      // Find the die's value from the current roll context (won't be in currentRoll.dice)
      return { dieIndex: i, value: 0, kept: true, autoKept: false };
    }
    // Find in current roll
    const dr = currentRoll?.dice.find((d) => d.dieIndex === i);
    if (!dr) {
      return { dieIndex: i, value: 0, kept: false, autoKept: false };
    }
    return { dieIndex: i, value: dr.value, kept: dr.kept, autoKept: dr.value === 3 };
  });

  const availableDiceCount = diceState.filter((d) => !d.kept && d.value !== 0).length;

  return (
    <div className="dice-area">
      <div className="dice-row" role="group" aria-label="Dice">
        {diceState.map((d) => (
          <Die
            key={d.dieIndex}
            dieIndex={d.dieIndex}
            value={d.value}
            kept={d.kept}
            autoKept={d.autoKept}
            selected={selected.has(d.dieIndex)}
            onClick={toggleSelect}
          />
        ))}
      </div>

      <div className="dice-actions">
        <button
          type="button"
          className="roll-btn"
          onClick={handleRoll}
          disabled={hasPendingKeep || rolling || keeping || turnCompleted || currentRoll === null && false}
          aria-label="Roll Dice"
        >
          {rolling ? 'Rolling…' : 'Roll Dice'}
        </button>

        <button
          type="button"
          className="keep-btn"
          onClick={handleKeep}
          disabled={selected.size === 0 || keeping || rolling || availableDiceCount === 0}
          aria-label="Keep Selected"
        >
          {keeping ? 'Keeping…' : 'Keep Selected'}
        </button>
      </div>
    </div>
  );
}
