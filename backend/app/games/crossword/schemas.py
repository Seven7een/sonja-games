from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime, date
from uuid import UUID


class PuzzleInfo(BaseModel):
    """Information about a crossword puzzle (without answers)"""
    puzzle_id: UUID
    date: date
    grid_data: List[List[str]]  # 5x5 grid structure (2D array)
    clues_across: Dict[str, str]  # {number: clue_text}
    clues_down: Dict[str, str]  # {number: clue_text}


class PuzzleResponse(BaseModel):
    """Full puzzle response including answers (for admin/testing)"""
    id: UUID
    date: date
    grid_data: List[List[str]]  # 5x5 grid structure (2D array)
    clues_across: Dict[str, str]
    clues_down: Dict[str, str]
    answers_across: Dict[str, str]
    answers_down: Dict[str, str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class GameSessionResponse(BaseModel):
    """Response for a crossword game session"""
    id: UUID
    user_id: str
    daily_puzzle_id: UUID
    current_grid: Dict
    completed: bool
    completion_time_seconds: Optional[int]
    completed_at: Optional[datetime]
    revealed_cells: Optional[List[Dict[str, int]]]  # List of {row, col}
    hints_used: int
    revealed_all: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class GameSessionCreate(BaseModel):
    """Request to create a new game session"""
    date: Optional[date] = None  # Defaults to today if not provided


class GridUpdate(BaseModel):
    """Request to update the current grid state"""
    current_grid: Dict = Field(..., description="User's current grid state")


class CheckAnswersResponse(BaseModel):
    """Response for checking answers"""
    correct_across: Dict[str, bool]  # {number: is_correct}
    correct_down: Dict[str, bool]  # {number: is_correct}
    all_correct: bool


class CompleteSessionRequest(BaseModel):
    """Request to complete a session"""
    completion_time_seconds: int = Field(..., gt=0, description="Time taken to complete in seconds")


class CrosswordStats(BaseModel):
    """Aggregate statistics for a user"""
    total_completed: int
    average_completion_time_seconds: Optional[float]
    current_streak: int
    max_streak: int
    average_hints_used: Optional[float]
    puzzles_revealed: int  # Count of puzzles where reveal_all was used


class GameHistoryItem(BaseModel):
    """Single item in crossword game history"""
    id: UUID
    date: date
    completed: bool
    completion_time_seconds: Optional[int]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class GameHistoryResponse(BaseModel):
    """Paginated game history response"""
    games: List[GameHistoryItem]
    total: int
    page: int
    page_size: int


class CellPosition(BaseModel):
    """Position of a cell in the grid"""
    row: int = Field(..., ge=0, lt=5, description="Row index (0-4)")
    col: int = Field(..., ge=0, lt=5, description="Column index (0-4)")


class RevealCellResponse(BaseModel):
    """Response for revealing a cell"""
    letter: str = Field(..., min_length=1, max_length=1, description="Correct letter for the cell")
    row: int
    col: int


class CheckCellRequest(BaseModel):
    """Request to check if a cell is correct"""
    row: int = Field(..., ge=0, lt=5)
    col: int = Field(..., ge=0, lt=5)
    letter: str = Field(..., min_length=1, max_length=1)


class CheckCellResponse(BaseModel):
    """Response for checking a cell"""
    is_correct: bool
    row: int
    col: int


class RevealAllResponse(BaseModel):
    """Response for revealing entire board"""
    complete_grid: List[List[str]]  # 5x5 grid structure (2D array)
    answers_across: Dict[str, str]
    answers_down: Dict[str, str]
