/**
 * CrosswordGrid Component
 * Displays 5x5 grid with cell selection, keyboard navigation, and word highlighting
 */

import { useEffect, useRef } from 'react';
import CrosswordCell from './CrosswordCell';
import { CellState, CellPosition, Direction } from '../types/crossword.types';

interface CrosswordGridProps {
  grid: CellState[][];
  selectedCell: CellPosition | null;
  selectedDirection: Direction;
  onCellClick: (row: number, col: number) => void;
  onKeyPress: (key: string) => void;
}

export default function CrosswordGrid({
  grid,
  selectedCell,
  onCellClick,
  onKeyPress
}: CrosswordGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Focus grid on mount and when selection changes
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.focus();
    }
  }, [selectedCell]);

  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent default for navigation keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace'].includes(e.key)) {
      e.preventDefault();
    }

    onKeyPress(e.key);
  };

  return (
    <div
      ref={gridRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
    >
      <div className="grid grid-cols-5 gap-0 border-2 border-gray-800 bg-gray-800">
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <CrosswordCell
              key={`${rowIndex}-${colIndex}`}
              letter={cell.letter}
              userLetter={cell.userLetter}
              number={cell.number}
              isBlack={cell.isBlack}
              isSelected={cell.isSelected}
              isHighlighted={cell.isHighlighted}
              status={cell.status}
              onClick={() => onCellClick(rowIndex, colIndex)}
            />
          ))
        ))}
      </div>
    </div>
  );
}
