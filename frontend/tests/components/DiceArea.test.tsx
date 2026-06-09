import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiceArea from '../../src/components/DiceArea';
import Die from '../../src/components/Die';
import type { RollDTO } from '@shared/types/api';

function makeRoll(dice: Array<{ dieIndex: number; value: number; kept: boolean }>): RollDTO {
  return { id: 'r1', rollNumber: 1, dice };
}

describe('Die', () => {
  it('renders the face value', () => {
    render(
      <Die dieIndex={0} value={5} kept={false} autoKept={false} rolling={false} selected={false} onClick={vi.fn()} />,
    );
    expect(screen.getByLabelText(/die 1: 5/i)).toBeInTheDocument();
  });

  it('applies kept-three CSS class when value is 3 and kept', () => {
    render(
      <Die dieIndex={0} value={3} kept={true} autoKept={true} rolling={false} selected={false} onClick={vi.fn()} />,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('die--kept-three');
  });

  it('applies kept CSS class for kept non-3 die', () => {
    render(
      <Die dieIndex={0} value={5} kept={true} autoKept={false} rolling={false} selected={false} onClick={vi.fn()} />,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('die--kept');
  });

  it('applies available CSS class when not kept', () => {
    render(
      <Die dieIndex={0} value={5} kept={false} autoKept={false} rolling={false} selected={false} onClick={vi.fn()} />,
    );
    expect(screen.getByRole('button')).toHaveClass('die--available');
  });

  it('is not clickable (disabled) when kept', () => {
    render(
      <Die dieIndex={0} value={5} kept={true} autoKept={false} rolling={false} selected={false} onClick={vi.fn()} />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick with dieIndex when available and clicked', async () => {
    const onClick = vi.fn();
    render(
      <Die dieIndex={2} value={5} kept={false} autoKept={false} rolling={false} selected={false} onClick={onClick} />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(2);
  });
});

describe('DiceArea', () => {
  const defaultProps = {
    currentRoll: null,
    previouslyKeptDice: new Map<number, number>(),
    onRoll: vi.fn(),
    rolling: false,
    turnCompleted: false,
  };

  it('Roll button is disabled and shows prompt when PENDING_KEEP and nothing selected', () => {
    render(
      <DiceArea
        {...defaultProps}
        currentRoll={makeRoll([
          { dieIndex: 0, value: 5, kept: false },
          { dieIndex: 1, value: 2, kept: false },
          { dieIndex: 2, value: 4, kept: false },
          { dieIndex: 3, value: 1, kept: false },
          { dieIndex: 4, value: 6, kept: false },
        ])}
      />,
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('Roll button is enabled when no pending keep (all dice kept)', () => {
    render(
      <DiceArea
        {...defaultProps}
        currentRoll={makeRoll([
          { dieIndex: 0, value: 5, kept: true },
          { dieIndex: 1, value: 2, kept: true },
          { dieIndex: 2, value: 4, kept: true },
          { dieIndex: 3, value: 1, kept: true },
          { dieIndex: 4, value: 6, kept: true },
        ])}
      />,
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).not.toBeDisabled();
  });
});
