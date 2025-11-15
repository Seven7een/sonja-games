/**
 * Crossword API Service
 * Functions for all Crossword game endpoints
 */

import api from '../../../core/services/api';
import {
  PuzzleInfo,
  GameSession,
  GameSessionCreate,
  GridUpdate,
  CheckAnswersResponse,
  CompleteSessionRequest,
  CrosswordStats,
  GameHistoryResponse,
  CellPosition,
  RevealCellResponse,
  CheckCellRequest,
  CheckCellResponse,
  RevealAllResponse,
} from '../types/crossword.types';

/**
 * Base path for Crossword API endpoints
 */
const CROSSWORD_BASE_PATH = '/api/crossword';

/**
 * Get today's daily crossword puzzle
 * Returns puzzle structure and clues without revealing answers
 * 
 * @returns Daily puzzle info
 */
export const getDailyPuzzle = async (): Promise<PuzzleInfo> => {
  return api.get<PuzzleInfo>(`${CROSSWORD_BASE_PATH}/daily`);
};

/**
 * Start a new crossword game session for the authenticated user
 * Creates a session for today's daily puzzle by default
 * 
 * @param data - Optional date to play a specific puzzle
 * @returns Created game session
 */
export const startGameSession = async (
  data?: GameSessionCreate
): Promise<GameSession> => {
  return api.post<GameSession>(`${CROSSWORD_BASE_PATH}/session`, data || {});
};

/**
 * Update the current grid state for a session
 * Used for auto-saving user progress
 * 
 * @param sessionId - Game session ID
 * @param gridData - Current grid state with user's answers
 * @returns Updated game session
 */
export const updateSession = async (
  sessionId: string,
  gridData: Record<string, any>
): Promise<GameSession> => {
  const update: GridUpdate = { current_grid: gridData };
  return api.post<GameSession>(
    `${CROSSWORD_BASE_PATH}/session/${sessionId}/update`,
    update
  );
};

/**
 * Check the current answers against the correct solution
 * Returns which words are correct without revealing answers
 * 
 * @param sessionId - Game session ID
 * @returns Check results for across and down words
 */
export const checkAnswers = async (
  sessionId: string
): Promise<CheckAnswersResponse> => {
  return api.post<CheckAnswersResponse>(
    `${CROSSWORD_BASE_PATH}/session/${sessionId}/check`,
    {}
  );
};

/**
 * Complete a crossword session
 * Submits the final solution and records completion time
 * 
 * @param sessionId - Game session ID
 * @param completionTimeSeconds - Time taken to complete in seconds
 * @returns Completed game session
 */
export const completeSession = async (
  sessionId: string,
  completionTimeSeconds: number
): Promise<GameSession> => {
  const request: CompleteSessionRequest = { completion_time_seconds: completionTimeSeconds };
  return api.post<GameSession>(
    `${CROSSWORD_BASE_PATH}/session/${sessionId}/complete`,
    request
  );
};

/**
 * Get details of a specific game session
 * 
 * @param sessionId - Game session ID
 * @returns Game session details
 */
export const getGameSession = async (sessionId: string): Promise<GameSession> => {
  return api.get<GameSession>(`${CROSSWORD_BASE_PATH}/session/${sessionId}`);
};

/**
 * Reveal the correct letter for a specific cell (hint)
 * Increments hints_used counter
 * 
 * @param sessionId - Game session ID
 * @param position - Cell position to reveal
 * @returns Revealed letter and position
 */
export const revealCell = async (
  sessionId: string,
  position: CellPosition
): Promise<RevealCellResponse> => {
  return api.post<RevealCellResponse>(
    `${CROSSWORD_BASE_PATH}/session/${sessionId}/reveal-cell`,
    position
  );
};

/**
 * Check if a specific cell letter is correct
 * Provides feedback without revealing the answer
 * 
 * @param sessionId - Game session ID
 * @param request - Cell position and letter to check
 * @returns Whether the letter is correct
 */
export const checkCell = async (
  sessionId: string,
  request: CheckCellRequest
): Promise<CheckCellResponse> => {
  return api.post<CheckCellResponse>(
    `${CROSSWORD_BASE_PATH}/session/${sessionId}/check-cell`,
    request
  );
};

/**
 * Reveal the entire board (all answers)
 * Sets revealed_all flag and increments hints_used
 * 
 * @param sessionId - Game session ID
 * @returns Complete grid with all answers
 */
export const revealAll = async (
  sessionId: string
): Promise<RevealAllResponse> => {
  return api.post<RevealAllResponse>(
    `${CROSSWORD_BASE_PATH}/session/${sessionId}/reveal-all`,
    {}
  );
};

/**
 * Get aggregate statistics for the authenticated user
 * Includes total completed, average time, streaks, and hints usage
 * 
 * @returns User statistics
 */
export const getUserStats = async (): Promise<CrosswordStats> => {
  return api.get<CrosswordStats>(`${CROSSWORD_BASE_PATH}/stats`);
};

/**
 * Get paginated game history for the authenticated user
 * 
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated game history
 */
export const getGameHistory = async (
  page: number = 1,
  pageSize: number = 20
): Promise<GameHistoryResponse> => {
  return api.get<GameHistoryResponse>(`${CROSSWORD_BASE_PATH}/history`, {
    params: { page, page_size: pageSize },
  });
};

/**
 * Crossword API service object
 * Provides all Crossword-related API functions
 */
export const crosswordApi = {
  getDailyPuzzle,
  startGameSession,
  updateSession,
  checkAnswers,
  completeSession,
  getGameSession,
  revealCell,
  checkCell,
  revealAll,
  getUserStats,
  getGameHistory,
};

export default crosswordApi;
