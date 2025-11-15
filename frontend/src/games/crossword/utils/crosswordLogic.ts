/**
 * Crossword Game Logic Utilities
 * Client-side utilities for grid navigation, word highlighting, and cell validation
 */

import {
  Cell,
  CellPosition,
  CellStatus,
  Direction,
  GridData,
  SelectedWord,
} from '../types/crossword.types';

/**
 * Check if a position is within the grid bounds
 * 
 * @param row - Row index
 * @param col - Column index
 * @returns True if position is valid (0-4 for both row and col)
 */
export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 5 && col >= 0 && col < 5;
}

/**
 * Check if a cell is black (blocked)
 * 
 * @param cell - Cell to check
 * @returns True if cell is black/blocked
 */
export function isBlackCell(cell: Cell | null): boolean {
  return cell?.isBlack === true;
}

/**
 * Get the next cell position in a given direction
 * 
 * @param position - Current position
 * @param direction - Direction to move
 * @returns Next position or null if out of bounds
 */
export function getNextPosition(
  position: CellPosition,
  direction: Direction
): CellPosition | null {
  const { row, col } = position;
  
  if (direction === 'across') {
    const nextCol = col + 1;
    return isValidPosition(row, nextCol) ? { row, col: nextCol } : null;
  } else {
    const nextRow = row + 1;
    return isValidPosition(nextRow, col) ? { row: nextRow, col } : null;
  }
}

/**
 * Get the previous cell position in a given direction
 * 
 * @param position - Current position
 * @param direction - Direction to move
 * @returns Previous position or null if out of bounds
 */
export function getPreviousPosition(
  position: CellPosition,
  direction: Direction
): CellPosition | null {
  const { row, col } = position;
  
  if (direction === 'across') {
    const prevCol = col - 1;
    return isValidPosition(row, prevCol) ? { row, col: prevCol } : null;
  } else {
    const prevRow = row - 1;
    return isValidPosition(prevRow, col) ? { row: prevRow, col } : null;
  }
}

/**
 * Navigate to the next available cell (skipping black cells)
 * 
 * @param grid - The crossword grid
 * @param position - Current position
 * @param direction - Direction to move
 * @returns Next available position or null if none found
 */
export function navigateToNextCell(
  grid: GridData,
  position: CellPosition,
  direction: Direction
): CellPosition | null {
  let nextPos = getNextPosition(position, direction);
  
  while (nextPos && isBlackCell(grid[nextPos.row][nextPos.col])) {
    nextPos = getNextPosition(nextPos, direction);
  }
  
  return nextPos;
}

/**
 * Navigate to the previous available cell (skipping black cells)
 * 
 * @param grid - The crossword grid
 * @param position - Current position
 * @param direction - Direction to move
 * @returns Previous available position or null if none found
 */
export function navigateToPreviousCell(
  grid: GridData,
  position: CellPosition,
  direction: Direction
): CellPosition | null {
  let prevPos = getPreviousPosition(position, direction);
  
  while (prevPos && isBlackCell(grid[prevPos.row][prevPos.col])) {
    prevPos = getPreviousPosition(prevPos, direction);
  }
  
  return prevPos;
}

/**
 * Get all cells that are part of a word starting at a given position
 * 
 * @param grid - The crossword grid
 * @param startPosition - Starting position of the word
 * @param direction - Direction of the word
 * @returns Array of cell positions in the word
 */
export function getWordCells(
  grid: GridData,
  startPosition: CellPosition,
  direction: Direction
): CellPosition[] {
  const cells: CellPosition[] = [startPosition];
  let currentPos = startPosition;
  
  while (true) {
    const nextPos = navigateToNextCell(grid, currentPos, direction);
    if (!nextPos) break;
    cells.push(nextPos);
    currentPos = nextPos;
  }
  
  return cells;
}

/**
 * Find the start position of a word containing the given cell
 * 
 * @param grid - The crossword grid
 * @param position - Position within the word
 * @param direction - Direction of the word
 * @returns Start position of the word
 */
export function findWordStart(
  grid: GridData,
  position: CellPosition,
  direction: Direction
): CellPosition {
  let startPos = position;
  
  while (true) {
    const prevPos = navigateToPreviousCell(grid, startPos, direction);
    if (!prevPos) break;
    startPos = prevPos;
  }
  
  return startPos;
}

/**
 * Get the word number for a cell in a given direction
 * Looks backwards to find the cell with the number
 * 
 * @param grid - The crossword grid
 * @param position - Position within the word
 * @param direction - Direction of the word
 * @returns Word number or null if not found
 */
export function getWordNumber(
  grid: GridData,
  position: CellPosition,
  direction: Direction
): number | null {
  const startPos = findWordStart(grid, position, direction);
  const cell = grid[startPos.row][startPos.col];
  return cell?.number ?? null;
}

/**
 * Get information about the selected word
 * 
 * @param grid - The crossword grid
 * @param position - Selected cell position
 * @param direction - Direction of the word
 * @returns Selected word information
 */
export function getSelectedWord(
  grid: GridData,
  position: CellPosition,
  direction: Direction
): SelectedWord | null {
  const startPos = findWordStart(grid, position, direction);
  const wordNumber = getWordNumber(grid, position, direction);
  
  if (wordNumber === null) return null;
  
  const cells = getWordCells(grid, startPos, direction);
  
  return {
    direction,
    number: wordNumber,
    cells,
  };
}

/**
 * Toggle direction (across <-> down)
 * 
 * @param direction - Current direction
 * @returns Opposite direction
 */
export function toggleDirection(direction: Direction): Direction {
  return direction === 'across' ? 'down' : 'across';
}

/**
 * Navigate using arrow keys
 * 
 * @param grid - The crossword grid
 * @param position - Current position
 * @param key - Arrow key pressed ('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight')
 * @returns New position or null if can't move
 */
export function navigateWithArrowKey(
  grid: GridData,
  position: CellPosition,
  key: string
): CellPosition | null {
  const { row, col } = position;
  let newPos: CellPosition | null = null;
  
  switch (key) {
    case 'ArrowUp':
      newPos = { row: row - 1, col };
      break;
    case 'ArrowDown':
      newPos = { row: row + 1, col };
      break;
    case 'ArrowLeft':
      newPos = { row, col: col - 1 };
      break;
    case 'ArrowRight':
      newPos = { row, col: col + 1 };
      break;
  }
  
  if (!newPos || !isValidPosition(newPos.row, newPos.col)) {
    return null;
  }
  
  // Skip black cells
  if (isBlackCell(grid[newPos.row][newPos.col])) {
    return navigateWithArrowKey(grid, newPos, key);
  }
  
  return newPos;
}

/**
 * Check if a letter is valid (single alphabetic character)
 * 
 * @param letter - Letter to validate
 * @returns True if valid
 */
export function isValidLetter(letter: string): boolean {
  return /^[a-zA-Z]$/.test(letter);
}

/**
 * Normalize a letter to uppercase
 * 
 * @param letter - Letter to normalize
 * @returns Uppercase letter
 */
export function normalizeLetter(letter: string): string {
  return letter.toUpperCase();
}

/**
 * Check if two positions are equal
 * 
 * @param pos1 - First position
 * @param pos2 - Second position
 * @returns True if positions are equal
 */
export function positionsEqual(
  pos1: CellPosition | null,
  pos2: CellPosition | null
): boolean {
  if (!pos1 || !pos2) return false;
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

/**
 * Check if a position is in a list of positions
 * 
 * @param position - Position to check
 * @param positions - List of positions
 * @returns True if position is in the list
 */
export function isPositionInList(
  position: CellPosition,
  positions: CellPosition[]
): boolean {
  return positions.some(pos => positionsEqual(pos, position));
}

/**
 * Format completion time in seconds to a readable string
 * 
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "2:34" or "1:02:15")
 */
export function formatCompletionTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format average completion time
 * 
 * @param seconds - Average time in seconds (can be decimal)
 * @returns Formatted time string
 */
export function formatAverageTime(seconds: number | null): string {
  if (seconds === null) return 'N/A';
  return formatCompletionTime(Math.round(seconds));
}

/**
 * Get CSS class for cell status
 * 
 * @param status - Cell status
 * @returns Tailwind CSS class string
 */
export function getCellStatusClass(status: CellStatus): string {
  switch (status) {
    case CellStatus.EMPTY:
      return 'bg-white';
    case CellStatus.FILLED:
      return 'bg-white';
    case CellStatus.CORRECT:
      return 'bg-green-100 border-green-500';
    case CellStatus.INCORRECT:
      return 'bg-red-100 border-red-500';
    case CellStatus.REVEALED:
      return 'bg-blue-100 border-blue-500';
    default:
      return 'bg-white';
  }
}

/**
 * Parse grid data from backend format to GridData
 * Backend sends grid as nested arrays or object structure
 * 
 * @param gridData - Grid data from backend
 * @returns Parsed GridData
 */
export function parseGridData(gridData: Record<string, any>): GridData {
  // If gridData is already an array, return it
  if (Array.isArray(gridData)) {
    return gridData as GridData;
  }
  
  // Otherwise, construct a 5x5 grid from the object structure
  const grid: GridData = [];
  for (let row = 0; row < 5; row++) {
    grid[row] = [];
    for (let col = 0; col < 5; col++) {
      const key = `${row},${col}`;
      const cellData = gridData[key];
      
      if (cellData) {
        grid[row][col] = {
          letter: cellData.letter || null,
          number: cellData.number,
          isBlack: cellData.isBlack || false,
        };
      } else {
        // Default to empty cell
        grid[row][col] = {
          letter: null,
          number: undefined,
          isBlack: false,
        };
      }
    }
  }
  
  return grid;
}

/**
 * Convert GridData to backend format
 * 
 * @param grid - GridData to convert
 * @returns Grid data in backend format
 */
export function serializeGridData(grid: GridData): Record<string, any> {
  const serialized: Record<string, any> = {};
  
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const key = `${row},${col}`;
      const cell = grid[row][col];
      
      serialized[key] = {
        letter: cell.letter,
        number: cell.number,
        isBlack: cell.isBlack,
      };
    }
  }
  
  return serialized;
}

/**
 * Create an empty user grid (all cells empty)
 * 
 * @param templateGrid - Template grid with structure
 * @returns Empty user grid
 */
export function createEmptyUserGrid(templateGrid: GridData): GridData {
  return templateGrid.map(row =>
    row.map(cell => ({
      ...cell,
      letter: cell.isBlack ? null : '', // Empty string for user input
    }))
  );
}

/**
 * Check if the grid is completely filled (no empty cells)
 * 
 * @param grid - Grid to check
 * @returns True if all non-black cells are filled
 */
export function isGridComplete(grid: GridData): boolean {
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = grid[row][col];
      if (!cell.isBlack && (!cell.letter || cell.letter === '')) {
        return false;
      }
    }
  }
  return true;
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
    day: 'numeric',
  });
}
