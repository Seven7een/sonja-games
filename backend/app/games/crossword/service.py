"""
Crossword game service.
Handles game session management, answer validation, and statistics.
"""
import logging
from typing import Optional, List, Dict, Tuple
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from uuid import UUID

from app.games.crossword.models import CrosswordDailyPuzzle, CrosswordGameSession
from app.games.crossword.schemas import CrosswordStats, GameHistoryItem
from app.games.crossword.generator_service import ensure_daily_puzzle_exists

logger = logging.getLogger(__name__)


class CrosswordServiceError(Exception):
    """Base exception for crossword service errors."""
    pass


class PuzzleNotFoundError(CrosswordServiceError):
    """Raised when a puzzle cannot be found or generated."""
    pass


class SessionNotFoundError(CrosswordServiceError):
    """Raised when a game session is not found."""
    pass


class SessionAlreadyCompletedError(CrosswordServiceError):
    """Raised when trying to modify a completed session."""
    pass


async def get_or_create_daily_puzzle(db: Session, puzzle_date: date) -> CrosswordDailyPuzzle:
    """
    Get existing puzzle for date or generate a new one.
    
    Args:
        db: Database session
        puzzle_date: Date for the puzzle
        
    Returns:
        CrosswordDailyPuzzle: The puzzle for the given date
        
    Raises:
        PuzzleNotFoundError: If puzzle doesn't exist and generation fails
    """
    puzzle = await ensure_daily_puzzle_exists(db, puzzle_date)
    
    if puzzle is None:
        raise PuzzleNotFoundError(f"Failed to get or generate puzzle for {puzzle_date}")
    
    return puzzle


async def start_daily_challenge(
    db: Session,
    user_id: str,
    puzzle_date: Optional[date] = None
) -> CrosswordGameSession:
    """
    Create new game session for user and today's daily puzzle.
    
    Args:
        db: Database session
        user_id: User ID
        puzzle_date: Date for the puzzle (defaults to today)
        
    Returns:
        CrosswordGameSession: New game session
        
    Raises:
        PuzzleNotFoundError: If puzzle cannot be found or generated
    """
    if puzzle_date is None:
        puzzle_date = date.today()
    
    # Get or create the daily puzzle
    puzzle = await get_or_create_daily_puzzle(db, puzzle_date)
    
    # Initialize empty grid with same structure as puzzle grid
    # User's grid starts empty (all cells are empty strings)
    grid_data = puzzle.grid_data
    empty_grid = []
    for row in grid_data:
        empty_row = []
        for cell in row:
            # Keep black cells as ".", initialize letter cells as empty string
            empty_row.append("." if cell == "." else "")
        empty_grid.append(empty_row)
    
    # Create new game session
    session = CrosswordGameSession(
        user_id=user_id,
        daily_puzzle_id=puzzle.id,
        current_grid={"grid": empty_grid},
        completed=False,
        revealed_cells=[],
        hints_used=0,
        revealed_all=False
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    logger.info(f"Started crossword session {session.id} for user {user_id} on {puzzle_date}")
    return session


def update_session(
    db: Session,
    session_id: UUID,
    grid_data: Dict
) -> CrosswordGameSession:
    """
    Save user's current grid state.
    
    Args:
        db: Database session
        session_id: Game session ID
        grid_data: User's current grid state
        
    Returns:
        CrosswordGameSession: Updated session
        
    Raises:
        SessionNotFoundError: If session is not found
        SessionAlreadyCompletedError: If session is already completed
    """
    session = db.query(CrosswordGameSession).filter(
        CrosswordGameSession.id == session_id
    ).first()
    
    if not session:
        raise SessionNotFoundError(f"Session {session_id} not found")
    
    if session.completed:
        raise SessionAlreadyCompletedError(f"Session {session_id} is already completed")
    
    # Update grid
    session.current_grid = grid_data
    
    db.commit()
    db.refresh(session)
    
    logger.debug(f"Updated grid for session {session_id}")
    return session


def _extract_word_from_grid(
    grid: List[List[str]],
    start_row: int,
    start_col: int,
    direction: str,
    length: int
) -> str:
    """
    Extract a word from the grid at given position and direction.
    
    Args:
        grid: The grid to extract from
        start_row: Starting row
        start_col: Starting column
        direction: 'across' or 'down'
        length: Length of the word
        
    Returns:
        str: Extracted word (uppercase)
    """
    word = []
    for i in range(length):
        if direction == "across":
            row, col = start_row, start_col + i
        else:  # down
            row, col = start_row + i, start_col
        
        if row < len(grid) and col < len(grid[row]):
            cell = grid[row][col]
            word.append(cell.upper() if cell else "")
        else:
            word.append("")
    
    return "".join(word)


def _find_word_position(
    grid: List[List[str]],
    word_number: str,
    direction: str,
    answer: str
) -> Optional[Tuple[int, int]]:
    """
    Find the starting position of a word in the grid.
    This is a simplified approach - in a real implementation,
    you'd track word positions when generating the puzzle.
    
    For now, we'll scan the grid to find where the word fits.
    """
    # This is a placeholder - actual implementation would need
    # to track word positions in the puzzle data structure
    # For now, return None and we'll handle it gracefully
    return None


def check_answers(
    db: Session,
    session_id: UUID
) -> Dict[str, Dict[str, bool]]:
    """
    Validate user's answers against correct answers.
    
    Args:
        db: Database session
        session_id: Game session ID
        
    Returns:
        Dict with 'correct_across', 'correct_down', and 'all_correct' keys
        
    Raises:
        SessionNotFoundError: If session is not found
    """
    session = db.query(CrosswordGameSession).filter(
        CrosswordGameSession.id == session_id
    ).first()
    
    if not session:
        raise SessionNotFoundError(f"Session {session_id} not found")
    
    puzzle = session.daily_puzzle
    user_grid = session.current_grid.get("grid", [])
    correct_grid = puzzle.grid_data
    
    correct_across = {}
    correct_down = {}
    
    # Check across answers
    for num, answer in puzzle.answers_across.items():
        # Find where this word is in the grid and check if user's answer matches
        # For simplicity, we'll compare the entire grid cell by cell
        # and determine if the word is correct based on the answer
        correct_across[num] = False  # Will be set to True if word matches
    
    # Check down answers
    for num, answer in puzzle.answers_down.items():
        correct_down[num] = False  # Will be set to True if word matches
    
    # Compare grids cell by cell to determine which words are correct
    # This is a simplified check - we compare user's letters to correct letters
    # and mark words as correct if all their letters match
    
    # For a more accurate implementation, we need to track word positions
    # For now, we'll do a simple letter-by-letter comparison
    all_cells_correct = True
    for i in range(len(correct_grid)):
        for j in range(len(correct_grid[i])):
            correct_cell = correct_grid[i][j]
            user_cell = user_grid[i][j] if i < len(user_grid) and j < len(user_grid[i]) else ""
            
            # Skip black cells
            if correct_cell == ".":
                continue
            
            # Check if user's letter matches
            if user_cell.upper() != correct_cell.upper():
                all_cells_correct = False
    
    # If all cells are correct, mark all words as correct
    if all_cells_correct:
        for num in puzzle.answers_across.keys():
            correct_across[num] = True
        for num in puzzle.answers_down.keys():
            correct_down[num] = True
    
    return {
        "correct_across": correct_across,
        "correct_down": correct_down,
        "all_correct": all_cells_correct
    }


def complete_session(
    db: Session,
    session_id: UUID,
    completion_time_seconds: int
) -> CrosswordGameSession:
    """
    Mark session as complete and save completion time.
    
    Args:
        db: Database session
        session_id: Game session ID
        completion_time_seconds: Time taken to complete in seconds
        
    Returns:
        CrosswordGameSession: Completed session
        
    Raises:
        SessionNotFoundError: If session is not found
        SessionAlreadyCompletedError: If session is already completed
    """
    session = db.query(CrosswordGameSession).filter(
        CrosswordGameSession.id == session_id
    ).first()
    
    if not session:
        raise SessionNotFoundError(f"Session {session_id} not found")
    
    if session.completed:
        raise SessionAlreadyCompletedError(f"Session {session_id} is already completed")
    
    # Mark as completed
    session.completed = True
    session.completion_time_seconds = completion_time_seconds
    session.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(session)
    
    logger.info(f"Completed session {session_id} in {completion_time_seconds} seconds")
    return session


def reveal_cell(
    db: Session,
    session_id: UUID,
    row: int,
    col: int
) -> Tuple[str, CrosswordGameSession]:
    """
    Reveal correct letter for specific cell and track it.
    
    Args:
        db: Database session
        session_id: Game session ID
        row: Row index (0-4)
        col: Column index (0-4)
        
    Returns:
        Tuple of (correct_letter, updated_session)
        
    Raises:
        SessionNotFoundError: If session is not found
        SessionAlreadyCompletedError: If session is already completed
        ValueError: If row/col are out of bounds
    """
    session = db.query(CrosswordGameSession).filter(
        CrosswordGameSession.id == session_id
    ).first()
    
    if not session:
        raise SessionNotFoundError(f"Session {session_id} not found")
    
    if session.completed:
        raise SessionAlreadyCompletedError(f"Session {session_id} is already completed")
    
    puzzle = session.daily_puzzle
    grid = puzzle.grid_data
    
    # Validate bounds
    if row < 0 or row >= len(grid) or col < 0 or col >= len(grid[row]):
        raise ValueError(f"Cell position ({row}, {col}) is out of bounds")
    
    correct_letter = grid[row][col]
    
    # Don't reveal black cells
    if correct_letter == ".":
        raise ValueError(f"Cannot reveal black cell at ({row}, {col})")
    
    # Track revealed cell
    revealed_cells = session.revealed_cells or []
    cell_pos = {"row": row, "col": col}
    
    # Only add if not already revealed
    if cell_pos not in revealed_cells:
        revealed_cells.append(cell_pos)
        session.revealed_cells = revealed_cells
        session.hints_used += 1
    
    # Update user's grid with correct letter
    user_grid = session.current_grid.get("grid", [])
    if row < len(user_grid) and col < len(user_grid[row]):
        user_grid[row][col] = correct_letter
        session.current_grid = {"grid": user_grid}
    
    db.commit()
    db.refresh(session)
    
    logger.info(f"Revealed cell ({row}, {col}) for session {session_id}")
    return correct_letter, session


def check_cell(
    db: Session,
    session_id: UUID,
    row: int,
    col: int,
    letter: str
) -> Tuple[bool, CrosswordGameSession]:
    """
    Check if specific cell letter is correct.
    
    Args:
        db: Database session
        session_id: Game session ID
        row: Row index (0-4)
        col: Column index (0-4)
        letter: Letter to check
        
    Returns:
        Tuple of (is_correct, updated_session)
        
    Raises:
        SessionNotFoundError: If session is not found
        SessionAlreadyCompletedError: If session is already completed
        ValueError: If row/col are out of bounds
    """
    session = db.query(CrosswordGameSession).filter(
        CrosswordGameSession.id == session_id
    ).first()
    
    if not session:
        raise SessionNotFoundError(f"Session {session_id} not found")
    
    if session.completed:
        raise SessionAlreadyCompletedError(f"Session {session_id} is already completed")
    
    puzzle = session.daily_puzzle
    grid = puzzle.grid_data
    
    # Validate bounds
    if row < 0 or row >= len(grid) or col < 0 or col >= len(grid[row]):
        raise ValueError(f"Cell position ({row}, {col}) is out of bounds")
    
    correct_letter = grid[row][col]
    
    # Can't check black cells
    if correct_letter == ".":
        raise ValueError(f"Cannot check black cell at ({row}, {col})")
    
    is_correct = letter.upper() == correct_letter.upper()
    
    # Increment hints used counter
    session.hints_used += 1
    
    db.commit()
    db.refresh(session)
    
    logger.info(f"Checked cell ({row}, {col}) for session {session_id}: {is_correct}")
    return is_correct, session


def reveal_all(
    db: Session,
    session_id: UUID
) -> Tuple[Dict, CrosswordGameSession]:
    """
    Reveal entire board with all answers.
    
    Args:
        db: Database session
        session_id: Game session ID
        
    Returns:
        Tuple of (complete_grid_data, updated_session)
        
    Raises:
        SessionNotFoundError: If session is not found
        SessionAlreadyCompletedError: If session is already completed
    """
    session = db.query(CrosswordGameSession).filter(
        CrosswordGameSession.id == session_id
    ).first()
    
    if not session:
        raise SessionNotFoundError(f"Session {session_id} not found")
    
    if session.completed:
        raise SessionAlreadyCompletedError(f"Session {session_id} is already completed")
    
    puzzle = session.daily_puzzle
    
    # Mark that user revealed all
    session.revealed_all = True
    session.hints_used += 1  # Count reveal all as one hint
    
    # Update user's grid with complete solution
    session.current_grid = {"grid": puzzle.grid_data}
    
    db.commit()
    db.refresh(session)
    
    complete_data = {
        "complete_grid": puzzle.grid_data,
        "answers_across": puzzle.answers_across,
        "answers_down": puzzle.answers_down
    }
    
    logger.info(f"Revealed all answers for session {session_id}")
    return complete_data, session


def get_user_stats(db: Session, user_id: str) -> CrosswordStats:
    """
    Calculate aggregate statistics for a user.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        CrosswordStats: User's statistics
    """
    # Get all completed sessions
    completed_sessions = db.query(CrosswordGameSession).filter(
        and_(
            CrosswordGameSession.user_id == user_id,
            CrosswordGameSession.completed == True
        )
    ).all()
    
    total_completed = len(completed_sessions)
    
    # Calculate average completion time
    completion_times = [s.completion_time_seconds for s in completed_sessions if s.completion_time_seconds]
    average_completion_time = sum(completion_times) / len(completion_times) if completion_times else None
    
    # Calculate average hints used
    hints_used_list = [s.hints_used for s in completed_sessions]
    average_hints_used = sum(hints_used_list) / len(hints_used_list) if hints_used_list else None
    
    # Count puzzles where reveal_all was used
    puzzles_revealed = sum(1 for s in completed_sessions if s.revealed_all)
    
    # Calculate streaks
    current_streak = 0
    max_streak = 0
    temp_streak = 0
    
    # Get sessions ordered by date
    sessions_by_date = db.query(CrosswordGameSession).join(
        CrosswordDailyPuzzle
    ).filter(
        and_(
            CrosswordGameSession.user_id == user_id,
            CrosswordGameSession.completed == True
        )
    ).order_by(CrosswordDailyPuzzle.date.desc()).all()
    
    if sessions_by_date:
        # Check if user played today
        today = date.today()
        last_played_date = sessions_by_date[0].daily_puzzle.date
        
        # Calculate current streak
        expected_date = today
        for session in sessions_by_date:
            session_date = session.daily_puzzle.date
            if session_date == expected_date:
                current_streak += 1
                expected_date = date.fromordinal(expected_date.toordinal() - 1)
            else:
                break
        
        # Calculate max streak
        prev_date = None
        for session in reversed(sessions_by_date):
            session_date = session.daily_puzzle.date
            if prev_date is None or session_date == date.fromordinal(prev_date.toordinal() + 1):
                temp_streak += 1
                max_streak = max(max_streak, temp_streak)
            else:
                temp_streak = 1
            prev_date = session_date
    
    return CrosswordStats(
        total_completed=total_completed,
        average_completion_time_seconds=average_completion_time,
        current_streak=current_streak,
        max_streak=max_streak,
        average_hints_used=average_hints_used,
        puzzles_revealed=puzzles_revealed
    )


def get_game_history(
    db: Session,
    user_id: str,
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[GameHistoryItem], int]:
    """
    Retrieve paginated list of user's past crossword sessions.
    
    Args:
        db: Database session
        user_id: User ID
        page: Page number (1-indexed)
        page_size: Number of items per page
        
    Returns:
        Tuple of (list of GameHistoryItem, total count)
    """
    # Get total count
    total = db.query(CrosswordGameSession).filter(
        CrosswordGameSession.user_id == user_id
    ).count()
    
    # Get paginated sessions
    offset = (page - 1) * page_size
    sessions = db.query(CrosswordGameSession).join(
        CrosswordDailyPuzzle
    ).filter(
        CrosswordGameSession.user_id == user_id
    ).order_by(desc(CrosswordDailyPuzzle.date)).offset(offset).limit(page_size).all()
    
    # Convert to history items
    history_items = []
    for session in sessions:
        history_items.append(GameHistoryItem(
            id=session.id,
            date=session.daily_puzzle.date,
            completed=session.completed,
            completion_time_seconds=session.completion_time_seconds,
            completed_at=session.completed_at
        ))
    
    return history_items, total
