/**
 * CrosswordClues Component
 * Displays across and down clues with click-to-select functionality
 */

import { Direction } from '../types/crossword.types';

interface CrosswordCluesProps {
  cluesAcross: Record<string, string>;
  cluesDown: Record<string, string>;
  selectedClue: { direction: Direction; number: number } | null;
  onClueClick: (direction: Direction, number: number) => void;
}

export default function CrosswordClues({
  cluesAcross,
  cluesDown,
  selectedClue,
  onClueClick
}: CrosswordCluesProps) {
  const isClueSelected = (direction: Direction, number: number) => {
    return selectedClue?.direction === direction && selectedClue?.number === number;
  };

  const renderClueList = (clues: Record<string, string>, direction: Direction) => {
    const clueNumbers = Object.keys(clues).map(Number).sort((a, b) => a - b);
    
    return (
      <div className="space-y-2">
        {clueNumbers.map((number) => (
          <div
            key={number}
            onClick={() => onClueClick(direction, number)}
            className={`
              p-2 rounded cursor-pointer transition-colors
              ${isClueSelected(direction, number)
                ? 'bg-yellow-100 border-l-4 border-yellow-500'
                : 'hover:bg-gray-50 border-l-4 border-transparent'
              }
            `}
          >
            <span className="font-semibold text-gray-700">{number}.</span>{' '}
            <span className="text-gray-900">{clues[number]}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Across Clues */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-gray-800 border-b-2 border-gray-300 pb-2">
          Across
        </h3>
        <div className="max-h-96 overflow-y-auto pr-2">
          {renderClueList(cluesAcross, 'across')}
        </div>
      </div>

      {/* Down Clues */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-gray-800 border-b-2 border-gray-300 pb-2">
          Down
        </h3>
        <div className="max-h-96 overflow-y-auto pr-2">
          {renderClueList(cluesDown, 'down')}
        </div>
      </div>
    </div>
  );
}
