/**
 * CrosswordGame Page
 * Main game page integrating CrosswordGrid, CrosswordClues, CrosswordTimer, and CrosswordCompletionModal
 * Handles game initialization, loading states, error handling, and hint/reveal functionality
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { useCrossword } from '../hooks/useCrossword';
import CrosswordGrid from '../components/CrosswordGrid';
import CrosswordClues from '../components/CrosswordClues';
import { CrosswordTimer } from '../components/CrosswordTimer';
import CrosswordCompletionModal from '../components/CrosswordCompletionModal';
import { CellState, CrosswordStats } from '../types/crossword.types';
import crosswordApi from '../services/crosswordApi';

export default function CrosswordGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, hasToken } = useAuth();
  
  const {
    // Puzzle and session data
    puzzle,
    session,
    
    // Grid state
    grid,
    userGrid,
    
    // Selection state
    selectedCell,
    selectedDirection,
    selectedWord,
    
    // Timer state
    elapsedSeconds,
    isTimerRunning,
    
    // Hint tracking
    hintsUsed,
    revealedAll,
    
    // UI state
    isLoading,
    error,
    isCompleted,
    showCompletionModal,
    
    // Actions
    initializeGame,
    handleCellClick,
    handleKeyDown,
    revealLetter,
    checkLetter,
    revealBoard,
    completeGame,
    getCellStatus,
    isCellHighlighted,
  } = useCrossword();

  // Local state
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showRevealConfirmation, setShowRevealConfirmation] = useState(false);
  const [stats, setStats] = useState<CrosswordStats | undefined>(undefined);
  const [generationError, setGenerationError] = useState(false);

  /**
   * Initialize game on component mount
   */
  useEffect(() => {
    if (isAuthenticated && !authLoading && hasToken && !hasInitialized && !session) {
      initializeGame().catch((err) => {
        // Check if this is a puzzle generation failure
        if (err.message && err.message.includes('puzzle')) {
          setGenerationError(true);
        }
      });
      setHasInitialized(true);
    }
  }, [isAuthenticated, authLoading, hasToken, hasInitialized, session, initializeGame]);

  /**
   * Fetch stats when game is completed
   */
  useEffect(() => {
    if (isCompleted && showCompletionModal) {
      crosswordApi.getUserStats()
        .then(setStats)
        .catch(err => console.error('Failed to fetch stats:', err));
    }
  }, [isCompleted, showCompletionModal]);

  /**
   * Handle reveal board confirmation
   */
  const handleRevealBoardClick = () => {
    setShowRevealConfirmation(true);
  };

  const handleConfirmRevealBoard = async () => {
    setShowRevealConfirmation(false);
    await revealBoard();
  };

  const handleCancelRevealBoard = () => {
    setShowRevealConfirmation(false);
  };

  /**
   * Handle viewing full statistics
   */
  const handleViewStats = () => {
    navigate('/crossword/stats');
  };

  /**
   * Handle closing completion modal
   */
  const handleCloseModal = () => {
    navigate('/');
  };

  /**
   * Handle clue click
   */
  const handleClueClick = (_direction: 'across' | 'down', number: number) => {
    // Find the first cell of this word
    if (!grid) return;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = grid[row][col];
        if (cell.number === number) {
          handleCellClick(row, col);
          return;
        }
      }
    }
  };

  /**
   * Transform grid data for CrosswordGrid component
   */
  const transformedGrid: CellState[][] | null = grid && userGrid ? grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      const userCell = userGrid[rowIndex][colIndex];
      const status = getCellStatus(rowIndex, colIndex);
      const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
      const isHighlighted = isCellHighlighted(rowIndex, colIndex);
      
      return {
        ...cell,
        userLetter: userCell.letter,
        status,
        isSelected,
        isHighlighted,
      };
    })
  ) : null;

  /**
   * Render loading state
   */
  if (authLoading || !hasToken || (isLoading && !grid)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading puzzle...</p>
        </div>
      </div>
    );
  }

  /**
   * Render puzzle generation error
   */
  if (generationError || (error && error.includes('puzzle'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Puzzle Unavailable
          </h2>
          <p className="text-gray-600 mb-6">
            Today's puzzle couldn't be generated. We're working to fix this ASAP! Please check back later.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error && !generationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Something Went Wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render main game interface
   */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mini Crossword
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {puzzle?.date ? new Date(puzzle.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Daily Puzzle'}
              </p>
            </div>
            
            {/* Timer and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <CrosswordTimer 
                isRunning={isTimerRunning} 
                initialSeconds={elapsedSeconds}
              />
              
              {/* Hint/Reveal Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={revealLetter}
                  disabled={isCompleted || !selectedCell || revealedAll}
                  className="px-3 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Reveal the selected letter"
                >
                  💡 Reveal Letter
                </button>
                
                <button
                  onClick={checkLetter}
                  disabled={isCompleted || !selectedCell || !userGrid?.[selectedCell.row]?.[selectedCell.col]?.letter || revealedAll}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Check if the selected letter is correct"
                >
                  ✓ Check Letter
                </button>
                
                <button
                  onClick={handleRevealBoardClick}
                  disabled={isCompleted || revealedAll}
                  className="px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Reveal the entire board"
                >
                  📖 Reveal Board
                </button>
              </div>
            </div>
          </div>
          
          {/* Hints Used Indicator */}
          {hintsUsed > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              Hints used: {hintsUsed}
              {revealedAll && <span className="ml-2 text-orange-600 font-semibold">(Full board revealed)</span>}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Grid Section */}
          <div className="flex flex-col items-center">
            <div className="mb-4">
              {transformedGrid && (
                <CrosswordGrid
                  grid={transformedGrid}
                  selectedCell={selectedCell}
                  selectedDirection={selectedDirection}
                  onCellClick={handleCellClick}
                  onKeyPress={(key) => {
                    const event = { key } as React.KeyboardEvent;
                    handleKeyDown(event);
                  }}
                />
              )}
            </div>
            
            {/* Complete Button */}
            {!isCompleted && (
              <button
                onClick={completeGame}
                disabled={isCompleted}
                className="px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Submit Puzzle
              </button>
            )}
          </div>

          {/* Clues Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {puzzle && (
              <CrosswordClues
                cluesAcross={puzzle.clues_across}
                cluesDown={puzzle.clues_down}
                selectedClue={selectedWord ? { direction: selectedWord.direction, number: selectedWord.number } : null}
                onClueClick={handleClueClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* Reveal Board Confirmation Dialog */}
      {showRevealConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Reveal Entire Board?</h3>
            <p className="text-gray-600 mb-6">
              This will reveal all answers and count as using a hint. You can still submit the puzzle, but it will be marked as revealed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmRevealBoard}
                className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Yes, Reveal All
              </button>
              <button
                onClick={handleCancelRevealBoard}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      <CrosswordCompletionModal
        isOpen={showCompletionModal}
        completionTimeSeconds={elapsedSeconds}
        hintsUsed={hintsUsed}
        revealedAll={revealedAll}
        stats={stats}
        onClose={handleCloseModal}
        onViewStats={handleViewStats}
      />
    </div>
  );
}
