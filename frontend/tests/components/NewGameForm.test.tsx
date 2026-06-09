import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewGameForm from '../../src/components/NewGameForm';

describe('NewGameForm', () => {
  it('renders two name inputs by default', () => {
    render(<NewGameForm onSubmit={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
  });

  it('Add Player button appends a new input row', async () => {
    render(<NewGameForm onSubmit={vi.fn()} />);
    const addBtn = screen.getByRole('button', { name: /add player/i });
    await userEvent.click(addBtn);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(3);
  });

  it('Remove button removes a row', async () => {
    render(<NewGameForm onSubmit={vi.fn()} />);
    // Add a third player first
    await userEvent.click(screen.getByRole('button', { name: /add player/i }));
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
    // Remove the first player
    const removeBtns = screen.getAllByRole('button', { name: /remove player/i });
    await userEvent.click(removeBtns[0]);
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('Remove button is disabled when only 2 rows remain', () => {
    render(<NewGameForm onSubmit={vi.fn()} />);
    const removeBtns = screen.getAllByRole('button', { name: /remove player/i });
    for (const btn of removeBtns) {
      expect(btn).toBeDisabled();
    }
  });

  it('shows inline error when names are duplicated on submit', async () => {
    const onSubmit = vi.fn();
    render(<NewGameForm onSubmit={onSubmit} />);
    const inputs = screen.getAllByRole('textbox');
    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], 'Alice');
    await userEvent.clear(inputs[1]);
    await userEvent.type(inputs[1], 'alice');
    await userEvent.click(screen.getByRole('button', { name: /start game/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/unique/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('fires onSubmit callback with trimmed names on valid submission', async () => {
    const onSubmit = vi.fn();
    render(<NewGameForm onSubmit={onSubmit} />);
    const inputs = screen.getAllByRole('textbox');
    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], '  Alice  ');
    await userEvent.clear(inputs[1]);
    await userEvent.type(inputs[1], 'Bob');
    await userEvent.click(screen.getByRole('button', { name: /start game/i }));
    expect(onSubmit).toHaveBeenCalledWith(['Alice', 'Bob']);
  });
});
