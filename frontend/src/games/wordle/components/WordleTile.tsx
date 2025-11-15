/**
 * WordleTile Component
 * Displays a single letter tile with color-coded background based on status
 */

import { LetterStatus } from '../types/wordle.types';
import { getLetterColorClass } from '../utils/wordleLogic';

interface WordleTileProps {
  letter: string;
  status: LetterStatus | null;
  isActive?: boolean;
}

export default function WordleTile({ letter, status, isActive = false }: WordleTileProps) {
  const colorClass = getLetterColorClass(status);
  const activeClass = isActive && !status ? 'border-gray-500 border-2' : '';
  
  return (
    <div
      className={`
        w-14 h-14 flex items-center justify-center
        text-2xl font-bold uppercase
        border-2 rounded
        transition-all duration-200
        ${colorClass}
        ${activeClass}
      `}
    >
      {letter}
    </div>
  );
}
