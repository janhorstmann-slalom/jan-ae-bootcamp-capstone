interface Props {
  dieIndex: number;
  value: number;
  kept: boolean;
  autoKept: boolean; // true when value === 3 (immutably kept)
  selected: boolean;
  onClick: (dieIndex: number) => void;
}

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function Die({ dieIndex, value, kept, autoKept, selected, onClick }: Props) {
  const handleClick = () => {
    if (!kept) {
      onClick(dieIndex);
    }
  };

  let className = 'die';
  if (autoKept) className += ' die--auto-kept';
  else if (kept) className += ' die--kept';
  else if (selected) className += ' die--selected';
  else className += ' die--available';

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={kept}
      aria-label={`Die ${dieIndex + 1}: ${value}${kept ? ' (kept)' : ''}`}
      aria-pressed={selected}
    >
      <span className="die-face">{DIE_FACES[value - 1]}</span>
      <span className="die-value">{value}</span>
    </button>
  );
}
