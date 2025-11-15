/**
 * Wordle Game Logic Utilities
 * Client-side utilities for game logic and UI state management
 */

import { LetterStatus, LetterResult, KeyboardState, GuessResult } from '../types/wordle.types';

/**
 * Calculate the letter status for each letter in a guess
 * This is used for client-side feedback before API confirmation
 * 
 * @param guess - The guessed word (5 letters)
 * @param target - The target word (5 letters)
 * @returns Array of LetterResult objects with status for each letter
 */
export function calculateLetterStatuses(guess: string, target: string): LetterResult[] {
  const guessUpper = guess.toUpperCase();
  const targetUpper = target.toUpperCase();
  const result: LetterResult[] = [];
  
  // Track which letters in target have been matched
  const targetLetterCounts = new Map<string, number>();
  for (const letter of targetUpper) {
    targetLetterCounts.set(letter, (targetLetterCounts.get(letter) || 0) + 1);
  }
  
  // First pass: Mark correct positions (green)
  const statuses: (LetterStatus | null)[] = new Array(5).fill(null);
  for (let i = 0; i < 5; i++) {
    if (guessUpper[i] === targetUpper[i]) {
      statuses[i] = LetterStatus.CORRECT;
      targetLetterCounts.set(guessUpper[i], targetLetterCounts.get(guessUpper[i])! - 1);
    }
  }
  
  // Second pass: Mark present letters (yellow) and absent letters (gray)
  for (let i = 0; i < 5; i++) {
    if (statuses[i] === LetterStatus.CORRECT) {
      result.push({
        letter: guessUpper[i],
        status: LetterStatus.CORRECT
      });
      continue;
    }
    
    const letter = guessUpper[i];
    const remainingCount = targetLetterCounts.get(letter) || 0;
    
    if (remainingCount > 0) {
      statuses[i] = LetterStatus.PRESENT;
      targetLetterCounts.set(letter, remainingCount - 1);
      result.push({
        letter: letter,
        status: LetterStatus.PRESENT
      });
    } else {
      statuses[i] = LetterStatus.ABSENT;
      result.push({
        letter: letter,
        status: LetterStatus.ABSENT
      });
    }
  }
  
  return result;
}

/**
 * Update keyboard state based on a guess result
 * Keyboard shows the best status for each letter across all guesses
 * Priority: CORRECT > PRESENT > ABSENT
 * 
 * @param currentState - Current keyboard state
 * @param guessResult - Result from a guess submission
 * @returns Updated keyboard state
 */
export function updateKeyboardState(
  currentState: KeyboardState,
  guessResult: LetterResult[]
): KeyboardState {
  const newState = new Map(currentState);
  
  for (const letterResult of guessResult) {
    const letter = letterResult.letter.toUpperCase();
    const currentStatus = newState.get(letter);
    
    // Only update if new status has higher priority
    if (!currentStatus) {
      newState.set(letter, letterResult.status);
    } else if (currentStatus === LetterStatus.ABSENT) {
      // Any status is better than absent
      newState.set(letter, letterResult.status);
    } else if (currentStatus === LetterStatus.PRESENT && letterResult.status === LetterStatus.CORRECT) {
      // Correct is better than present
      newState.set(letter, letterResult.status);
    }
    // If current is CORRECT, don't downgrade
  }
  
  return newState;
}

/**
 * Initialize an empty keyboard state
 * 
 * @returns Empty keyboard state map
 */
export function initializeKeyboardState(): KeyboardState {
  return new Map<string, LetterStatus>();
}

/**
 * Build keyboard state from multiple guess results
 * Useful for reconstructing state from game history
 * 
 * @param guessResults - Array of guess results
 * @returns Keyboard state reflecting all guesses
 */
export function buildKeyboardStateFromGuesses(guessResults: GuessResult[]): KeyboardState {
  let keyboardState = initializeKeyboardState();
  
  for (const guessResult of guessResults) {
    keyboardState = updateKeyboardState(keyboardState, guessResult.result);
  }
  
  return keyboardState;
}

/**
 * Validate that a guess is properly formatted
 * 
 * @param guess - The guess to validate
 * @returns True if valid, false otherwise
 */
export function isValidGuessFormat(guess: string): boolean {
  return /^[a-zA-Z]{5}$/.test(guess);
}

/**
 * Get the color class for a letter status (for Tailwind CSS)
 * 
 * @param status - Letter status
 * @returns Tailwind CSS class string
 */
export function getLetterColorClass(status: LetterStatus | null): string {
  switch (status) {
    case LetterStatus.CORRECT:
      return 'bg-green-600 border-green-600 text-white';
    case LetterStatus.PRESENT:
      return 'bg-yellow-500 border-yellow-500 text-white';
    case LetterStatus.ABSENT:
      return 'bg-gray-500 border-gray-500 text-white';
    default:
      return 'bg-white border-gray-300 text-black';
  }
}

/**
 * Get the keyboard key color class for a letter status
 * 
 * @param status - Letter status
 * @returns Tailwind CSS class string
 */
export function getKeyboardColorClass(status: LetterStatus | null): string {
  switch (status) {
    case LetterStatus.CORRECT:
      return 'bg-green-600 text-white border-green-600';
    case LetterStatus.PRESENT:
      return 'bg-yellow-500 text-white border-yellow-500';
    case LetterStatus.ABSENT:
      return 'bg-gray-400 text-white border-gray-400';
    default:
      return 'bg-gray-200 text-black border-gray-300';
  }
}

/**
 * Format a date string to display format
 * 
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Calculate win percentage
 * 
 * @param wins - Number of wins
 * @param totalGames - Total number of games
 * @returns Win percentage (0-100)
 */
export function calculateWinPercentage(wins: number, totalGames: number): number {
  if (totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 100);
}
