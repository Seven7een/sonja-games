/**
 * Keyboard Component
 * On-screen keyboard with color-coded letter states and key press handling
 */

import { KeyboardState } from '../types/wordle.types';
import { getKeyboardColorClass } from '../utils/wordleLogic';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  letterStates: KeyboardState;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export default function Keyboard({ onKeyPress, letterStates, disabled = false }: KeyboardProps) {
  const handleClick = (key: string) => {
    if (!disabled) {
      onKeyPress(key);
    }
  };

  const renderKey = (key: string) => {
    const status = letterStates.get(key) ?? null;
    const colorClass = getKeyboardColorClass(status);
    const isSpecialKey = key === 'ENTER' || key === 'BACKSPACE';
    const widthClass = isSpecialKey ? 'px-4' : 'w-10';
    
    return (
      <button
        key={key}
        onClick={() => handleClick(key)}
        disabled={disabled}
        className={`
          ${widthClass} h-14 rounded font-semibold text-sm
          border transition-all duration-200
          ${colorClass}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 active:scale-95'}
        `}
      >
        {key === 'BACKSPACE' ? '⌫' : key}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2 p-4 max-w-lg mx-auto">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 justify-center">
          {row.map(renderKey)}
        </div>
      ))}
    </div>
  );
}
