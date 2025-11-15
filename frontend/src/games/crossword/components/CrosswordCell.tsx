/**
 * CrosswordCell Component
 * Displays a single cell with letter input, number label, and selection state
 */

import { CellStatus } from '../types/crossword.types';

interface CrosswordCellProps {
  letter: string | null;
  userLetter: string | null;
  number?: number;
  isBlack: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  status: CellStatus;
  onClick: () => void;
}

export default function CrosswordCell({
  userLetter,
  number,
  isBlack,
  isSelected,
  isHighlighted,
  status,
  onClick
}: CrosswordCellProps) {
  // Black cells are non-interactive
  if (isBlack) {
    return (
      <div className="w-12 h-12 bg-gray-900 border border-gray-700" />
    );
  }

  // Determine background color based on state
  const getBackgroundClass = () => {
    if (status === CellStatus.REVEALED) {
      return 'bg-blue-100';
    }
    if (status === CellStatus.CORRECT) {
      return 'bg-green-100';
    }
    if (status === CellStatus.INCORRECT) {
      return 'bg-red-100';
    }
    if (isSelected) {
      return 'bg-yellow-200';
    }
    if (isHighlighted) {
      return 'bg-yellow-50';
    }
    return 'bg-white';
  };

  // Determine border style
  const getBorderClass = () => {
    if (isSelected) {
      return 'border-2 border-yellow-500';
    }
    if (status === CellStatus.CORRECT) {
      return 'border-2 border-green-500';
    }
    if (status === CellStatus.INCORRECT) {
      return 'border-2 border-red-500';
    }
    return 'border border-gray-400';
  };

  return (
    <div
      className={`
        relative w-12 h-12 flex items-center justify-center
        cursor-pointer transition-all duration-150
        ${getBackgroundClass()}
        ${getBorderClass()}
      `}
      onClick={onClick}
    >
      {/* Cell number label */}
      {number && (
        <span className="absolute top-0.5 left-1 text-[10px] font-semibold text-gray-700">
          {number}
        </span>
      )}
      
      {/* User's letter input */}
      <span className="text-xl font-bold uppercase text-gray-900">
        {userLetter || ''}
      </span>
    </div>
  );
}
