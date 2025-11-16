/**
 * useCrossword Hook
 * Manages all crossword game state and logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CellPosition,
  Direction,
  GridData,
  GameSession,
  PuzzleInfo,
  SelectedWord,
  CellStatus,
  CheckAnswersResponse,
  RevealAllResponse,
} from '../types/crossword.types';
import {
  parseGridData,
  serializeGridData,
  createEmptyUserGrid,
  isValidLetter,
  normalizeLetter,
  navigateToNextCell,
  navigateToPreviousCell,
  navigateWithArrowKey,
  getSelectedWord,
  toggleDirection,
  positionsEqual,
  isPositionInList,
  isBlackCell,
} from '../utils/crosswordLogic';
import crosswordApi from '../services/crosswordApi';

/**
 * Hook state interface
 */
interface UseCrosswordState {
  // Puzzle and session data
  puzzle: PuzzleInfo | null;
  session: GameSession | null;
  
  // Grid state
  grid: GridData | null;
  userGrid: GridData | null;
  
  // Selection state
  selectedCell: CellPosition | null;
  selectedDirection: Direction;
  selectedWord: SelectedWord | null;
  
  // Timer state
  elapsedSeconds: number;
  isTimerRunning: boolean;
  
  // Hint tracking
  revealedCells: CellPosition[];
  hintsUsed: number;
  revealedAll: boolean;
  
  // Cell validation state (for check letter feedback)
  cellValidation: Map<string, boolean>; // key: "row,col", value: isCorrect
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isCompleted: boolean;
  showCompletionModal: boolean;
}

/**
 * Hook return interface
 */
interface UseCrosswordReturn extends UseCrosswordState {
  // Game initialization
  initializeGame: () => Promise<void>;
  
  // Cell interaction
  handleCellClick: (row: number, col: number) => void;
  handleCellInput: (row: number, col: number, letter: string) => void;
  
  // Keyboard navigation
  handleKeyDown: (event: React.KeyboardEvent) => void;
  
  // Game actions
  checkAnswers: () => Promise<void>;
  revealLetter: () => Promise<void>;
  checkLetter: () => Promise<void>;
  revealBoard: () => Promise<void>;
  completeGame: () => Promise<void>;
  
  // Utility functions
  getCellStatus: (row: number, col: number) => CellStatus;
  isCellHighlighted: (row: number, col: number) => boolean;
  clearCellValidation: () => void;
}

/**
 * Debounce utility
 */
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * Main crossword game hook
 */
export function useCrossword(): UseCrosswordReturn {
  // State initialization
  const [state, setState] = useState<UseCrosswordState>({
    puzzle: null,
    session: null,
    grid: null,
    userGrid: null,
    selectedCell: null,
    selectedDirection: 'across',
    selectedWord: null,
    elapsedSeconds: 0,
    isTimerRunning: false,
    revealedCells: [],
    hintsUsed: 0,
    revealedAll: false,
    cellValidation: new Map(),
    isLoading: true,
    error: null,
    isCompleted: false,
    showCompletionModal: false,
  });
  
  // Timer effect
  useEffect(() => {
    if (!state.isTimerRunning) return;
    
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state.isTimerRunning]);
  
  // Auto-save with debouncing
  const saveGridState = useCallback(async (sessionId: string, userGrid: GridData) => {
    try {
      const serialized = serializeGridData(userGrid);
      await crosswordApi.updateSession(sessionId, serialized);
    } catch (error) {
      console.error('Failed to save grid state:', error);
    }
  }, []);
  
  const debouncedSave = useDebounce(saveGridState, 2000);
  
  // Auto-save when user grid changes
  useEffect(() => {
    if (state.session && state.userGrid && !state.isCompleted) {
      debouncedSave(state.session.id, state.userGrid);
    }
  }, [state.userGrid, state.session, state.isCompleted, debouncedSave]);
  
  /**
   * Initialize game - fetch puzzle and start session
   */
  const initializeGame = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Fetch daily puzzle
      const puzzleData = await crosswordApi.getDailyPuzzle();
      const grid = parseGridData(puzzleData.grid_data);
      
      // Start new session
      const sessionData = await crosswordApi.startGameSession();
      
      // Initialize user grid
      let userGrid: GridData;
      if (sessionData.current_grid && Object.keys(sessionData.current_grid).length > 0) {
        // Resume existing session
        userGrid = parseGridData(sessionData.current_grid);
      } else {
        // New session - create empty grid
        userGrid = createEmptyUserGrid(grid);
      }
      
      // Find first available cell
      let firstCell: CellPosition | null = null;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (!isBlackCell(grid[row][col])) {
            firstCell = { row, col };
            break;
          }
        }
        if (firstCell) break;
      }
      
      setState(prev => ({
        ...prev,
        puzzle: puzzleData,
        session: sessionData,
        grid,
        userGrid,
        selectedCell: firstCell,
        selectedWord: firstCell ? getSelectedWord(grid, firstCell, 'across') : null,
        revealedCells: sessionData.revealed_cells || [],
        hintsUsed: sessionData.hints_used || 0,
        revealedAll: sessionData.revealed_all || false,
        isCompleted: sessionData.completed,
        isTimerRunning: !sessionData.completed,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to initialize game',
        isLoading: false,
      }));
    }
  }, []);
  
  /**
   * Handle cell click
   */
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!state.grid || state.isCompleted) return;
    
    const cell = state.grid[row][col];
    if (isBlackCell(cell)) return;
    
    const clickedPos = { row, col };
    
    setState(prev => {
      // If clicking the same cell, toggle direction
      const newDirection = positionsEqual(prev.selectedCell, clickedPos)
        ? toggleDirection(prev.selectedDirection)
        : prev.selectedDirection;
      
      const newWord = getSelectedWord(state.grid!, clickedPos, newDirection);
      
      return {
        ...prev,
        selectedCell: clickedPos,
        selectedDirection: newDirection,
        selectedWord: newWord,
      };
    });
  }, [state.grid, state.isCompleted]);
  
  /**
   * Handle cell input
   */
  const handleCellInput = useCallback((row: number, col: number, letter: string) => {
    if (!state.grid || !state.userGrid || state.isCompleted) return;
    
    // Validate letter
    if (!isValidLetter(letter)) return;
    
    const normalizedLetter = normalizeLetter(letter);
    
    setState(prev => {
      // Update user grid
      const newUserGrid = prev.userGrid!.map((r, rIdx) =>
        r.map((c, cIdx) => {
          if (rIdx === row && cIdx === col) {
            return { ...c, letter: normalizedLetter };
          }
          return c;
        })
      );
      
      // Auto-advance to next cell
      const currentPos = { row, col };
      const nextPos = navigateToNextCell(state.grid!, currentPos, prev.selectedDirection);
      
      return {
        ...prev,
        userGrid: newUserGrid,
        selectedCell: nextPos || currentPos,
        selectedWord: nextPos
          ? getSelectedWord(state.grid!, nextPos, prev.selectedDirection)
          : prev.selectedWord,
        cellValidation: new Map(), // Clear validation feedback
      };
    });
  }, [state.grid, state.userGrid, state.isCompleted]);
  
  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!state.grid || !state.selectedCell || state.isCompleted) return;
    
    const { key } = event;
    
    // Arrow key navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault();
      const newPos = navigateWithArrowKey(state.grid, state.selectedCell, key);
      
      if (newPos) {
        setState(prev => ({
          ...prev,
          selectedCell: newPos,
          selectedWord: getSelectedWord(state.grid!, newPos, prev.selectedDirection),
        }));
      }
      return;
    }
    
    // Tab key - move to next word
    if (key === 'Tab') {
      event.preventDefault();
      const nextPos = navigateToNextCell(state.grid, state.selectedCell, state.selectedDirection);
      
      if (nextPos) {
        setState(prev => ({
          ...prev,
          selectedCell: nextPos,
          selectedWord: getSelectedWord(state.grid!, nextPos, prev.selectedDirection),
        }));
      }
      return;
    }
    
    // Backspace - clear current cell and move back
    if (key === 'Backspace') {
      event.preventDefault();
      
      setState(prev => {
        const { row, col } = state.selectedCell!;
        const currentCell = prev.userGrid![row][col];
        
        // If current cell is empty, move to previous cell
        if (!currentCell.letter || currentCell.letter === '') {
          const prevPos = navigateToPreviousCell(state.grid!, state.selectedCell!, prev.selectedDirection);
          
          if (prevPos) {
            // Clear previous cell
            const newUserGrid = prev.userGrid!.map((r, rIdx) =>
              r.map((c, cIdx) => {
                if (rIdx === prevPos.row && cIdx === prevPos.col) {
                  return { ...c, letter: '' };
                }
                return c;
              })
            );
            
            return {
              ...prev,
              userGrid: newUserGrid,
              selectedCell: prevPos,
              selectedWord: getSelectedWord(state.grid!, prevPos, prev.selectedDirection),
              cellValidation: new Map(),
            };
          }
        } else {
          // Clear current cell
          const newUserGrid = prev.userGrid!.map((r, rIdx) =>
            r.map((c, cIdx) => {
              if (rIdx === row && cIdx === col) {
                return { ...c, letter: '' };
              }
              return c;
            })
          );
          
          return {
            ...prev,
            userGrid: newUserGrid,
            cellValidation: new Map(),
          };
        }
        
        return prev;
      });
      return;
    }
    
    // Letter input
    if (isValidLetter(key)) {
      event.preventDefault();
      handleCellInput(state.selectedCell.row, state.selectedCell.col, key);
    }
  }, [state.grid, state.selectedCell, state.isCompleted, handleCellInput]);
  
  /**
   * Check answers
   */
  const checkAnswers = useCallback(async () => {
    if (!state.session || state.isCompleted) return;
    
    try {
      const result: CheckAnswersResponse = await crosswordApi.checkAnswers(state.session.id);
      
      // Show feedback (could be used to highlight correct/incorrect words)
      console.log('Check results:', result);
      
      // If all correct, show completion option
      if (result.all_correct) {
        setState(prev => ({
          ...prev,
          showCompletionModal: true,
        }));
      }
    } catch (error: any) {
      console.error('Failed to check answers:', error);
    }
  }, [state.session, state.isCompleted]);
  
  /**
   * Reveal letter (hint)
   */
  const revealLetter = useCallback(async () => {
    if (!state.session || !state.selectedCell || state.isCompleted || !state.userGrid) return;
    
    // Check if selected cell is a black cell
    const { row, col } = state.selectedCell;
    const selectedCellData = state.userGrid[row]?.[col];
    if (selectedCellData?.isBlack) {
      console.warn('Cannot reveal black cell');
      return;
    }
    
    try {
      const result = await crosswordApi.revealCell(state.session.id, state.selectedCell);
      
      setState(prev => {
        // Update user grid with revealed letter
        const newUserGrid = prev.userGrid!.map((r, rIdx) =>
          r.map((c, cIdx) => {
            if (rIdx === result.row && cIdx === result.col) {
              return { ...c, letter: result.letter };
            }
            return c;
          })
        );
        
        // Add to revealed cells
        const newRevealedCells = [...prev.revealedCells, { row: result.row, col: result.col }];
        
        return {
          ...prev,
          userGrid: newUserGrid,
          revealedCells: newRevealedCells,
          hintsUsed: prev.hintsUsed + 1,
          cellValidation: new Map(),
        };
      });
    } catch (error: any) {
      console.error('Failed to reveal letter:', error);
    }
  }, [state.session, state.selectedCell, state.isCompleted, state.userGrid]);
  
  /**
   * Check letter (validate selected cell)
   */
  const checkLetter = useCallback(async () => {
    if (!state.session || !state.selectedCell || !state.userGrid || state.isCompleted) return;
    
    const { row, col } = state.selectedCell;
    const userLetter = state.userGrid[row][col].letter;
    
    if (!userLetter || userLetter === '') return;
    
    try {
      const result = await crosswordApi.checkCell(state.session.id, {
        row,
        col,
        letter: userLetter,
      });
      
      setState(prev => {
        const newValidation = new Map(prev.cellValidation);
        newValidation.set(`${row},${col}`, result.is_correct);
        
        return {
          ...prev,
          cellValidation: newValidation,
        };
      });
      
      // Clear validation feedback after 2 seconds
      setTimeout(() => {
        setState(prev => {
          const newValidation = new Map(prev.cellValidation);
          newValidation.delete(`${row},${col}`);
          return {
            ...prev,
            cellValidation: newValidation,
          };
        });
      }, 2000);
    } catch (error: any) {
      console.error('Failed to check letter:', error);
    }
  }, [state.session, state.selectedCell, state.userGrid, state.isCompleted]);
  
  /**
   * Reveal board (show all answers)
   */
  const revealBoard = useCallback(async () => {
    if (!state.session || state.isCompleted) return;
    
    try {
      const result: RevealAllResponse = await crosswordApi.revealAll(state.session.id);
      
      // Parse the complete grid
      const completeGrid = parseGridData(result.complete_grid);
      
      setState(prev => ({
        ...prev,
        userGrid: completeGrid,
        revealedAll: true,
        hintsUsed: prev.hintsUsed + 1,
        cellValidation: new Map(),
      }));
    } catch (error: any) {
      console.error('Failed to reveal board:', error);
    }
  }, [state.session, state.isCompleted]);
  
  /**
   * Complete game
   */
  const completeGame = useCallback(async () => {
    if (!state.session || state.isCompleted) return;
    
    try {
      await crosswordApi.completeSession(state.session.id, state.elapsedSeconds);
      
      setState(prev => ({
        ...prev,
        isCompleted: true,
        isTimerRunning: false,
        showCompletionModal: true,
      }));
    } catch (error: any) {
      console.error('Failed to complete game:', error);
    }
  }, [state.session, state.isCompleted, state.elapsedSeconds]);
  
  /**
   * Get cell status for styling
   */
  const getCellStatus = useCallback((row: number, col: number): CellStatus => {
    const key = `${row},${col}`;
    
    // Check if cell is revealed
    if (isPositionInList({ row, col }, state.revealedCells)) {
      return CellStatus.REVEALED;
    }
    
    // Check validation state
    if (state.cellValidation.has(key)) {
      return state.cellValidation.get(key) ? CellStatus.CORRECT : CellStatus.INCORRECT;
    }
    
    // Check if cell has user input
    if (state.userGrid && state.userGrid[row][col].letter) {
      return CellStatus.FILLED;
    }
    
    return CellStatus.EMPTY;
  }, [state.revealedCells, state.cellValidation, state.userGrid]);
  
  /**
   * Check if cell is highlighted (part of selected word)
   */
  const isCellHighlighted = useCallback((row: number, col: number): boolean => {
    if (!state.selectedWord) return false;
    return isPositionInList({ row, col }, state.selectedWord.cells);
  }, [state.selectedWord]);
  
  /**
   * Clear cell validation feedback
   */
  const clearCellValidation = useCallback(() => {
    setState(prev => ({
      ...prev,
      cellValidation: new Map(),
    }));
  }, []);
  
  return {
    ...state,
    initializeGame,
    handleCellClick,
    handleCellInput,
    handleKeyDown,
    checkAnswers,
    revealLetter,
    checkLetter,
    revealBoard,
    completeGame,
    getCellStatus,
    isCellHighlighted,
    clearCellValidation,
  };
}

export default useCrossword;
