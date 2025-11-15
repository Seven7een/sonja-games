/**
 * Wordle Game TypeScript Types
 * These types match the backend API schemas for type safety
 */

/**
 * Status of a letter in a guess
 */
export enum LetterStatus {
  CORRECT = "correct",  // Green - correct letter in correct position
  PRESENT = "present",  // Yellow - correct letter in wrong position
  ABSENT = "absent"     // Gray - letter not in word
}

/**
 * Result for a single letter in a guess
 */
export interface LetterResult {
  letter: string;
  status: LetterStatus;
}

/**
 * Result of a guess submission from the API
 */
export interface GuessResult {
  guess: string;
  result: LetterResult[];
  is_correct: boolean;
  attempts_used: number;
  game_over: boolean;
  won: boolean | null;
}

/**
 * Request payload to submit a guess
 */
export interface GuessSubmission {
  guess: string;
}

/**
 * Information about the daily challenge (without revealing the word)
 */
export interface DailyChallengeInfo {
  challenge_id: string;
  date: string;
}

/**
 * Game session status
 */
export type GameStatus = "playing" | "won" | "lost";

/**
 * Complete game session data from the API
 */
export interface GameSession {
  id: string;
  user_id: string;
  daily_challenge_id: string;
  guesses: string[];
  guess_results?: LetterResult[][];  // Stored feedback for each guess
  won: boolean;
  attempts_used: number;
  completed_at: string | null;
  created_at: string;
}

/**
 * Request to create a new game session
 */
export interface GameSessionCreate {
  date?: string;  // ISO date string, defaults to today if not provided
}

/**
 * Aggregate statistics for a user
 */
export interface WordleStats {
  total_games: number;
  wins: number;
  losses: number;
  win_percentage: number;
  current_streak: number;
  max_streak: number;
  guess_distribution: number[];  // Index 0 = 1 guess, index 1 = 2 guesses, etc.
}

/**
 * Single item in game history
 */
export interface GameHistoryItem {
  id: string;
  date: string;
  won: boolean;
  attempts_used: number;
  completed_at: string | null;
}

/**
 * Paginated game history response
 */
export interface GameHistoryResponse {
  games: GameHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Keyboard letter state for UI
 * Maps each letter to its status based on all guesses
 */
export type KeyboardState = Map<string, LetterStatus>;

/**
 * Can play today response
 */
export interface CanPlayTodayResponse {
  can_play: boolean;
  message?: string;
}
