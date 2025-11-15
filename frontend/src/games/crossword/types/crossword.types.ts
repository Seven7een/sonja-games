/**
 * Crossword Game TypeScript Types
 * These types match the backend API schemas for type safety
 */

/**
 * Position of a cell in the grid
 */
export interface CellPosition {
  row: number;  // 0-4
  col: number;  // 0-4
}

/**
 * A single cell in the crossword grid
 */
export interface Cell {
  letter: string | null;  // null for black cells, letter for answer cells
  number?: number;  // Clue number if this cell starts a word
  isBlack: boolean;  // True if this is a black/blocked cell
}

/**
 * 5x5 grid of cells
 */
export type GridData = Cell[][];

/**
 * A single clue with its number and text
 */
export interface Clue {
  number: number;
  text: string;
}

/**
 * Direction for a word in the crossword
 */
export type Direction = "across" | "down";

/**
 * Information about a crossword puzzle (without answers)
 */
export interface PuzzleInfo {
  puzzle_id: string;
  date: string;
  grid_data: Record<string, any>;  // Grid structure from backend
  clues_across: Record<string, string>;  // {number: clue_text}
  clues_down: Record<string, string>;  // {number: clue_text}
}

/**
 * Full puzzle response including answers (for admin/testing)
 */
export interface PuzzleResponse {
  id: string;
  date: string;
  grid_data: Record<string, any>;
  clues_across: Record<string, string>;
  clues_down: Record<string, string>;
  answers_across: Record<string, string>;
  answers_down: Record<string, string>;
  created_at: string;
}

/**
 * Game session response from the API
 */
export interface GameSession {
  id: string;
  user_id: string;
  daily_puzzle_id: string;
  current_grid: Record<string, any>;  // User's current grid state
  completed: boolean;
  completion_time_seconds: number | null;
  completed_at: string | null;
  revealed_cells: CellPosition[] | null;  // List of cells revealed via hints
  hints_used: number;
  revealed_all: boolean;  // True if user revealed entire board
  created_at: string;
}

/**
 * Request to create a new game session
 */
export interface GameSessionCreate {
  date?: string;  // ISO date string, defaults to today if not provided
}

/**
 * Request to update the current grid state
 */
export interface GridUpdate {
  current_grid: Record<string, any>;
}

/**
 * Response for checking answers
 */
export interface CheckAnswersResponse {
  correct_across: Record<string, boolean>;  // {number: is_correct}
  correct_down: Record<string, boolean>;  // {number: is_correct}
  all_correct: boolean;
}

/**
 * Request to complete a session
 */
export interface CompleteSessionRequest {
  completion_time_seconds: number;
}

/**
 * Aggregate statistics for a user
 */
export interface CrosswordStats {
  total_completed: number;
  average_completion_time_seconds: number | null;
  current_streak: number;
  max_streak: number;
  average_hints_used: number | null;
  puzzles_revealed: number;  // Count of puzzles where reveal_all was used
}

/**
 * Single item in crossword game history
 */
export interface GameHistoryItem {
  id: string;
  date: string;
  completed: boolean;
  completion_time_seconds: number | null;
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
 * Response for revealing a cell
 */
export interface RevealCellResponse {
  letter: string;
  row: number;
  col: number;
}

/**
 * Request to check if a cell is correct
 */
export interface CheckCellRequest {
  row: number;
  col: number;
  letter: string;
}

/**
 * Response for checking a cell
 */
export interface CheckCellResponse {
  is_correct: boolean;
  row: number;
  col: number;
}

/**
 * Response for revealing entire board
 */
export interface RevealAllResponse {
  complete_grid: Record<string, any>;
  answers_across: Record<string, string>;
  answers_down: Record<string, string>;
}

/**
 * Selected word information for UI highlighting
 */
export interface SelectedWord {
  direction: Direction;
  number: number;
  cells: CellPosition[];
}

/**
 * Cell validation status for UI feedback
 */
export enum CellStatus {
  EMPTY = "empty",
  FILLED = "filled",
  CORRECT = "correct",
  INCORRECT = "incorrect",
  REVEALED = "revealed"
}

/**
 * UI state for a cell
 */
export interface CellState extends Cell {
  userLetter: string | null;  // User's input
  status: CellStatus;
  isSelected: boolean;
  isHighlighted: boolean;  // Part of currently selected word
}
