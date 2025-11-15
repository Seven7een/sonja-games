/**
 * Wordle API Service
 * Functions for all Wordle game endpoints
 */

import api from '../../../core/services/api';
import {
  DailyChallengeInfo,
  GameSession,
  GameSessionCreate,
  GuessSubmission,
  GuessResult,
  WordleStats,
  GameHistoryResponse,
  CanPlayTodayResponse,
} from '../types/wordle.types';

/**
 * Base path for Wordle API endpoints
 */
const WORDLE_BASE_PATH = '/api/wordle';

/**
 * Get today's daily challenge information
 * Returns challenge ID and date without revealing the word
 * 
 * @returns Daily challenge info
 */
export const getDailyChallenge = async (): Promise<DailyChallengeInfo> => {
  return api.get<DailyChallengeInfo>(`${WORDLE_BASE_PATH}/daily`);
};

/**
 * Start a new game session for the authenticated user
 * Creates a session for today's daily challenge by default
 * 
 * @param data - Optional date to play a specific challenge
 * @returns Created game session
 */
export const startGameSession = async (
  data?: GameSessionCreate
): Promise<GameSession> => {
  return api.post<GameSession>(`${WORDLE_BASE_PATH}/session`, data || {});
};

/**
 * Submit a guess for a game session
 * Returns feedback on the guess and updated game state
 * 
 * @param sessionId - Game session ID
 * @param guess - The 5-letter word guess
 * @returns Guess result with feedback
 */
export const submitGuess = async (
  sessionId: string,
  guess: string
): Promise<GuessResult> => {
  const submission: GuessSubmission = { guess };
  return api.post<GuessResult>(
    `${WORDLE_BASE_PATH}/session/${sessionId}/guess`,
    submission
  );
};

/**
 * Get details of a specific game session
 * 
 * @param sessionId - Game session ID
 * @returns Game session details
 */
export const getGameSession = async (sessionId: string): Promise<GameSession> => {
  return api.get<GameSession>(`${WORDLE_BASE_PATH}/session/${sessionId}`);
};

/**
 * Get today's active game session
 * Returns the session if one exists for today
 * 
 * @returns Today's game session or throws 404 if not found
 */
export const getTodaysSession = async (): Promise<GameSession> => {
  return api.get<GameSession>(`${WORDLE_BASE_PATH}/session/today`);
};

/**
 * Check if the user can play today's daily challenge
 * Returns false if user has already completed today's challenge
 * 
 * @returns Can play status
 */
export const canPlayToday = async (): Promise<CanPlayTodayResponse> => {
  return api.get<CanPlayTodayResponse>(`${WORDLE_BASE_PATH}/can-play-today`);
};

/**
 * Get aggregate statistics for the authenticated user
 * Includes total games, wins, losses, streaks, and guess distribution
 * 
 * @returns User statistics
 */
export const getUserStats = async (): Promise<WordleStats> => {
  return api.get<WordleStats>(`${WORDLE_BASE_PATH}/stats`);
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
  return api.get<GameHistoryResponse>(`${WORDLE_BASE_PATH}/history`, {
    params: { page, page_size: pageSize },
  });
};

/**
 * Wordle API service object
 * Provides all Wordle-related API functions
 */
export const wordleApi = {
  getDailyChallenge,
  startGameSession,
  submitGuess,
  getGameSession,
  canPlayToday,
  getUserStats,
  getGameHistory,
};

export default wordleApi;
