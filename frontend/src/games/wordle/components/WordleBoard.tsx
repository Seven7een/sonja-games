/**
 * WordleBoard Component
 * Displays 6 rows for all guesses and current input
 */

import { GuessResult, GameStatus } from '../types/wordle.types';
import WordleRow from './WordleRow';

interface WordleBoardProps {
  guesses: GuessResult[];
  currentGuess: string;
  gameStatus: GameStatus;
}

export default function WordleBoard({ guesses, currentGuess, gameStatus }: WordleBoardProps) {
  const maxAttempts = 6;
  const rows = [];
  
  // Add rows for submitted guesses
  for (let i = 0; i < guesses.length; i++) {
    rows.push(
      <WordleRow
        key={i}
        guess={guesses[i].guess}
        result={guesses[i].result}
        isActive={false}
      />
    );
  }
  
  // Add row for current guess (if game is still playing)
  if (gameStatus === 'playing' && guesses.length < maxAttempts) {
    rows.push(
      <WordleRow
        key={guesses.length}
        guess={currentGuess}
        isActive={true}
      />
    );
  }
  
  // Add empty rows to fill up to 6 total
  const emptyRowsCount = maxAttempts - rows.length;
  for (let i = 0; i < emptyRowsCount; i++) {
    rows.push(
      <WordleRow
        key={guesses.length + 1 + i}
        guess=""
        isActive={false}
      />
    );
  }
  
  return (
    <div className="flex flex-col gap-2 p-4">
      {rows}
    </div>
  );
}
