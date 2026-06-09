interface Props {
  dieIndex: number;
  value: number;
  kept: boolean;
  autoKept: boolean; // true when value === 3 (orange border hint — player must still keep manually)
  selected: boolean;
  rolling: boolean;  // true when this die is currently being rolled (shows spinner)
  onClick: (dieIndex: number) => void;
}

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function Die({ dieIndex, value, kept, autoKept, selected, rolling, onClick }: Props) {
  const handleClick = () => {
    if (!kept) {
      onClick(dieIndex);
    }
  };

  let className = 'die';
  if (rolling) {
    className += ' die--rolling';
  } else if (kept) {
    className += autoKept ? ' die--kept die--kept-three' : ' die--kept';
  } else if (autoKept) {
    className += selected ? ' die--three die--three-selected' : ' die--three';
  } else if (selected) {
    className += ' die--selected';
  } else {
    className += ' die--available';
  }

  const isUnrolled = value === 0;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={kept || isUnrolled || rolling}
      aria-label={isUnrolled ? `Die ${dieIndex + 1}: not yet rolled` : `Die ${dieIndex + 1}: ${value}${kept ? ' (kept)' : ''}`}
      aria-pressed={selected}
    >
      {rolling ? (
        <span className="die-spinner" aria-hidden="true" />
      ) : (
        <>
          <span className="die-face">{isUnrolled ? '?' : DIE_FACES[value - 1]}</span>
          <span className="die-value">{isUnrolled ? '?' : value}</span>
        </>
      )}
    </button>
  );
}
