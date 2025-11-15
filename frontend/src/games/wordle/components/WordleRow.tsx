/**
 * WordleRow Component
 * Displays a row of 5 tiles for a guess
 */

import { LetterResult } from '../types/wordle.types';
import WordleTile from './WordleTile';

interface WordleRowProps {
  guess: string;
  result?: LetterResult[];
  isActive?: boolean;
}

export default function WordleRow({ guess, result, isActive = false }: WordleRowProps) {
  // Pad the guess to 5 letters with empty strings
  const letters = (guess + '     ').slice(0, 5).split('');
  
  return (
    <div className="flex gap-2 justify-center">
      {letters.map((letter, index) => {
        const status = result ? result[index]?.status : null;
        return (
          <WordleTile
            key={index}
            letter={letter}
            status={status}
            isActive={isActive && index === guess.length}
          />
        );
      })}
    </div>
  );
}
