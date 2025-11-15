/**
 * WordleGame Page
 * Main game page integrating WordleBoard, Keyboard, and GameOverModal
 * Handles game initialization, loading states, and error handling
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { useWordle } from '../hooks/useWordle';
import WordleBoard from '../components/WordleBoard';
import Keyboard from '../components/Keyboard';
import GameOverModal from '../components/GameOverModal';
import { getUserStats } from '../services/wordleApi';
import { WordleStats, GuessResult } from '../types/wordle.types';

export default function WordleGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, hasToken } = useAuth();
  const {
    // Session info
    sessionId,
    
    // Game state
    currentGuess,
    guesses,
    guessResults,
    gameStatus,
    keyboardState,
    
    // UI state
    isLoading,
    error,
    canPlay,
    message,
    
    // Game info
    attemptsUsed,
    
    // Actions
    handleKeyPress,
    initializeGame,
  } = useWordle();

  /**
   * Transform guesses and guessResults into GuessResult[] format for WordleBoard
   */
  const formattedGuesses = useMemo<GuessResult[]>(() => {
    return guesses.map((guess, index) => ({
      guess,
      result: guessResults[index] || [],
      is_correct: false, // Not used by WordleBoard
      attempts_used: index + 1,
      game_over: false, // Not used by WordleBoard
      won: null, // Not used by WordleBoard
    }));
  }, [guesses, guessResults]);

  // Modal state
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [stats, setStats] = useState<WordleStats | undefined>(undefined);
  const [answerWord, setAnswerWord] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState(false);

  /**
   * Initialize game on component mount, but only after auth and token are ready
   * Only run once by checking hasInitialized and sessionId
   */
  useEffect(() => {
    if (isAuthenticated && !authLoading && hasToken && !hasInitialized && !sessionId) {
      initializeGame();
      setHasInitialized(true);
    }
  }, [isAuthenticated, authLoading, hasToken, hasInitialized, sessionId, initializeGame]);

  /**
   * Show game over modal when game ends
   */
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      // For won games, the answer is the last guess
      // For lost games, we'll need to get it from the API or show a placeholder
      if (gameStatus === 'won' && guesses.length > 0) {
        setAnswerWord(guesses[guesses.length - 1]);
      }
      
      // Fetch stats before showing modal
      getUserStats()
        .then(setStats)
        .catch(err => console.error('Failed to fetch stats:', err))
        .finally(() => setShowGameOverModal(true));
    }
  }, [gameStatus, guesses]);

  /**
   * Handle viewing full statistics
   */
  const handleViewStats = () => {
    navigate('/wordle/stats');
  };

  /**
   * Handle closing game over modal
   */
  const handleCloseModal = () => {
    setShowGameOverModal(false);
  };

  /**
   * Render loading state
   */
  if (authLoading || !hasToken || (isLoading && guesses.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  /**
   * Render "already played" message
   */
  if (!canPlay && message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Challenge Complete!
          </h2>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleViewStats}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              View Your Statistics
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Come back tomorrow for a new challenge!
          </p>
        </div>
      </div>
    );
  }

  /**
   * Render main game interface
   */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Wordle
          </h1>
          <p className="text-center text-sm text-gray-600 mt-1">
            Guess the word in 6 tries
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-lg mx-auto w-full px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Game board */}
      <div className="flex-1 flex flex-col justify-center items-center py-4">
        <WordleBoard
          guesses={formattedGuesses}
          currentGuess={currentGuess}
          gameStatus={gameStatus}
        />
      </div>

      {/* Keyboard */}
      <div className="pb-4">
        <Keyboard
          onKeyPress={handleKeyPress}
          letterStates={keyboardState}
          disabled={gameStatus !== 'playing' || isLoading}
        />
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={showGameOverModal}
        won={gameStatus === 'won'}
        answer={answerWord}
        attemptsUsed={attemptsUsed}
        stats={stats}
        onClose={handleCloseModal}
        onViewStats={handleViewStats}
      />
    </div>
  );
}
