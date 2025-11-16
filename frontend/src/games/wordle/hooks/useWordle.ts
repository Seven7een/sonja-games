/**
 * Wordle Game State Management Hook
 * Manages all game state including guesses, keyboard state, and game flow
 */

import { useState, useEffect, useCallback } from 'react';
import {
  GameStatus,
  GuessResult,
  KeyboardState,
  LetterResult,
} from '../types/wordle.types';
import {
  startGameSession,
  submitGuess,
  canPlayToday,
  getTodaysSession,
} from '../services/wordleApi';
import {
  initializeKeyboardState,
  updateKeyboardState,
  isValidGuessFormat,
} from '../utils/wordleLogic';

/**
 * Game state interface
 */
interface WordleGameState {
  // Session info
  sessionId: string | null;
  challengeId: string | null;
  
  // Game state
  currentGuess: string;
  guesses: string[];
  guessResults: LetterResult[][];
  gameStatus: GameStatus;
  keyboardState: KeyboardState;
  answer: string | null;  // The correct answer (only available when game is over)
  
  // UI state
  isLoading: boolean;
  error: string | null;
  canPlay: boolean;
  message: string | null;
  
  // Game info
  attemptsUsed: number;
  maxAttempts: number;
}

/**
 * Hook return type
 */
export interface UseWordleReturn extends WordleGameState {
  // Actions
  handleKeyPress: (key: string) => void;
  initializeGame: () => Promise<void>;
  resetGame: () => void;
}

/**
 * Maximum number of guesses allowed
 */
const MAX_ATTEMPTS = 6;

/**
 * Custom hook for Wordle game state management
 * Handles game initialization, guess submission, and keyboard input
 */
export const useWordle = (): UseWordleReturn => {
  // Game state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [guessResults, setGuessResults] = useState<LetterResult[][]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [keyboardState, setKeyboardState] = useState<KeyboardState>(
    initializeKeyboardState()
  );
  const [answer, setAnswer] = useState<string | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState<number>(0);

  /**
   * Initialize the game
   * Tries to load today's existing session, or starts a new one
   */
  const initializeGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, try to get today's existing session
      try {
        const session = await getTodaysSession();
        
        // Load the existing session
        setSessionId(session.id);
        setChallengeId(session.daily_challenge_id);
        setGuesses(session.guesses);
        setAttemptsUsed(session.attempts_used);
        
        // Load guess results from the session
        setGuessResults(session.guess_results || []);
        
        // Reconstruct keyboard state from guess results
        let kbState = initializeKeyboardState();
        if (session.guess_results) {
          for (const result of session.guess_results) {
            kbState = updateKeyboardState(kbState, result);
          }
        }
        setKeyboardState(kbState);
        
        // Set game status and answer if completed
        if (session.won) {
          setGameStatus('won');
          setMessage('Congratulations! You won!');
          if (session.answer) {
            setAnswer(session.answer);
          }
        } else if (session.completed_at) {
          setGameStatus('lost');
          setMessage('Game over! Better luck next time.');
          if (session.answer) {
            setAnswer(session.answer);
          }
        } else {
          setGameStatus('playing');
        }
        
        setCanPlay(true);
        setIsLoading(false);
        return;
      } catch (err: any) {
        // No existing session (404), continue to create new one
        if (err.code !== 'NETWORK_ERROR') {
          console.log('No existing session found, will create new one');
        } else {
          throw err; // Re-throw network errors
        }
      }
      
      // Check if user can play today's challenge
      const canPlayResponse = await canPlayToday();
      
      if (!canPlayResponse.can_play) {
        setCanPlay(false);
        setMessage(canPlayResponse.message || 'You have already completed today\'s challenge!');
        setIsLoading(false);
        return;
      }
      
      // Start new game session
      const session = await startGameSession();
      setSessionId(session.id);
      setChallengeId(session.daily_challenge_id);
      setCanPlay(true);
      setMessage(null);
      
      // Reset game state
      setCurrentGuess('');
      setGuesses([]);
      setGuessResults([]);
      setGameStatus('playing');
      setKeyboardState(initializeKeyboardState());
      setAttemptsUsed(0);
      
    } catch (err: any) {
      console.error('Failed to initialize game:', err);
      setError(err.detail || err.message || 'Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Submit the current guess
   * Validates input, calls API, and updates game state
   */
  const submitCurrentGuess = useCallback(async () => {
    if (!sessionId) {
      setError('No active game session');
      return;
    }
    
    if (gameStatus !== 'playing') {
      return;
    }
    
    // Validate guess format
    if (!isValidGuessFormat(currentGuess)) {
      setError('Guess must be exactly 5 letters');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Submit guess to API
      const result: GuessResult = await submitGuess(sessionId, currentGuess);
      
      // Update game state with result
      setGuesses(prev => [...prev, result.guess]);
      setGuessResults(prev => [...prev, result.result]);
      setAttemptsUsed(result.attempts_used);
      
      // Update keyboard state
      setKeyboardState(prev => updateKeyboardState(prev, result.result));
      
      // Clear current guess
      setCurrentGuess('');
      
      // Check if game is over
      if (result.game_over) {
        if (result.answer) {
          setAnswer(result.answer);
        }
        
        if (result.won) {
          setGameStatus('won');
          setMessage('Congratulations! You won!');
        } else {
          setGameStatus('lost');
          setMessage('Game over! Better luck next time.');
        }
      }
      
    } catch (err: any) {
      console.error('Failed to submit guess:', err);
      
      // The API interceptor returns ApiError with detail property
      setError(err.detail || err.message || 'Failed to submit guess. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentGuess, gameStatus]);

  /**
   * Handle keyboard input
   * Processes both physical keyboard and on-screen keyboard
   */
  const handleKeyPress = useCallback((key: string) => {
    // Ignore input if game is not in playing state
    if (gameStatus !== 'playing' || isLoading) {
      return;
    }
    
    // Clear any previous errors
    if (error) {
      setError(null);
    }
    
    const upperKey = key.toUpperCase();
    
    // Handle Enter key - submit guess
    if (upperKey === 'ENTER') {
      if (currentGuess.length === 5) {
        submitCurrentGuess();
      } else {
        setError('Guess must be exactly 5 letters');
      }
      return;
    }
    
    // Handle Backspace/Delete key - remove last letter
    if (upperKey === 'BACKSPACE' || upperKey === 'DELETE' || upperKey === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
      return;
    }
    
    // Handle letter keys - add to current guess
    if (/^[A-Z]$/.test(upperKey) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + upperKey);
    }
  }, [currentGuess, gameStatus, isLoading, error, submitCurrentGuess]);

  /**
   * Handle physical keyboard events
   */
  useEffect(() => {
    const handlePhysicalKeyboard = (event: KeyboardEvent) => {
      // Prevent default behavior for game keys
      if (
        event.key === 'Enter' ||
        event.key === 'Backspace' ||
        /^[a-zA-Z]$/.test(event.key)
      ) {
        event.preventDefault();
        handleKeyPress(event.key);
      }
    };
    
    // Only attach listener if game is active
    if (gameStatus === 'playing' && sessionId) {
      window.addEventListener('keydown', handlePhysicalKeyboard);
      
      return () => {
        window.removeEventListener('keydown', handlePhysicalKeyboard);
      };
    }
  }, [gameStatus, sessionId, handleKeyPress]);

  /**
   * Reset game state
   */
  const resetGame = useCallback(() => {
    setSessionId(null);
    setChallengeId(null);
    setCurrentGuess('');
    setGuesses([]);
    setGuessResults([]);
    setGameStatus('playing');
    setKeyboardState(initializeKeyboardState());
    setIsLoading(false);
    setError(null);
    setCanPlay(true);
    setMessage(null);
    setAttemptsUsed(0);
  }, []);

  return {
    // Session info
    sessionId,
    challengeId,
    
    // Game state
    currentGuess,
    guesses,
    guessResults,
    gameStatus,
    keyboardState,
    answer,
    
    // UI state
    isLoading,
    error,
    canPlay,
    message,
    
    // Game info
    attemptsUsed,
    maxAttempts: MAX_ATTEMPTS,
    
    // Actions
    handleKeyPress,
    initializeGame,
    resetGame,
  };
};

export default useWordle;
