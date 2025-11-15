"""
Crossword game API router.
Handles all Crossword game endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date

from app.database import get_db
from app.core.middleware.auth import get_current_user
from app.core.models.user import User
from app.games.crossword.schemas import (
    PuzzleInfo,
    GameSessionResponse,
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
    RevealAllResponse
)
from app.games.crossword import service
from app.games.crossword.service import (
    PuzzleNotFoundError,
    SessionNotFoundError,
    SessionAlreadyCompletedError
)

router = APIRouter(prefix="/api/crossword", tags=["crossword"])


@router.get("/daily", response_model=PuzzleInfo)
async def get_daily_puzzle(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get today's daily crossword puzzle.
    Returns the puzzle with grid structure and clues (without answers).
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        PuzzleInfo: Puzzle information without answers
        
    Raises:
        HTTPException: If puzzle cannot be generated
    """
    try:
        today = date.today()
        puzzle = await service.get_or_create_daily_puzzle(db, today)
        
        return PuzzleInfo(
            puzzle_id=puzzle.id,
            date=puzzle.date,
            grid_data=puzzle.grid_data,
            clues_across=puzzle.clues_across,
            clues_down=puzzle.clues_down
        )
    except PuzzleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Today's puzzle couldn't be generated. We're working to fix this ASAP! Please check back later."
        )


@router.post("/session", response_model=GameSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_game_session(
    session_data: GameSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start a new crossword game session for the authenticated user.
    
    Args:
        session_data: Optional date for the puzzle (defaults to today)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        GameSessionResponse: New game session details
        
    Raises:
        HTTPException: If puzzle cannot be generated
    """
    try:
        target_date = session_data.date or date.today()
        session = await service.start_daily_challenge(db, current_user.id, target_date)
        
        return session
    except PuzzleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Today's puzzle couldn't be generated. We're working to fix this ASAP! Please check back later."
        )


@router.post("/session/{session_id}/update", response_model=GameSessionResponse)
async def update_session_grid(
    session_id: UUID,
    grid_update: GridUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the current grid state for a game session.
    
    Args:
        session_id: The game session ID
        grid_update: Updated grid data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        GameSessionResponse: Updated session details
        
    Raises:
        HTTPException: If session not found, already completed, or doesn't belong to user
    """
    try:
        # Verify session belongs to current user
        from app.games.crossword.models import CrosswordGameSession
        session = db.query(CrosswordGameSession).filter(
            CrosswordGameSession.id == session_id
        ).first()
        
        if not session:
            raise SessionNotFoundError(f"Session {session_id} not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this game session"
            )
        
        updated_session = service.update_session(db, session_id, grid_update.current_grid)
        return updated_session
        
    except SessionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game session not found"
        )
    except SessionAlreadyCompletedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a completed session"
        )


@router.post("/session/{session_id}/check", response_model=CheckAnswersResponse)
async def check_session_answers(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validate current answers and return feedback.
    
    Args:
        session_id: The game session ID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        CheckAnswersResponse: Correctness feedback for each word
        
    Raises:
        HTTPException: If session not found or doesn't belong to user
    """
    try:
        # Verify session belongs to current user
        from app.games.crossword.models import CrosswordGameSession
        session = db.query(CrosswordGameSession).filter(
            CrosswordGameSession.id == session_id
        ).first()
        
        if not session:
            raise SessionNotFoundError(f"Session {session_id} not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this game session"
            )
        
        result = service.check_answers(db, session_id)
        return CheckAnswersResponse(**result)
        
    except SessionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game session not found"
        )


@router.post("/session/{session_id}/complete", response_model=GameSessionResponse)
async def complete_game_session(
    session_id: UUID,
    completion_data: CompleteSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit completed crossword and record completion time.
    
    Args:
        session_id: The game session ID
        completion_data: Completion time in seconds
        db: Database session
        current_user: Authenticated user
        
    Returns:
        GameSessionResponse: Completed session details
        
    Raises:
        HTTPException: If session not found, already completed, or doesn't belong to user
    """
    try:
        # Verify session belongs to current user
        from app.games.crossword.models import CrosswordGameSession
        session = db.query(CrosswordGameSession).filter(
            CrosswordGameSession.id == session_id
        ).first()
        
        if not session:
            raise SessionNotFoundError(f"Session {session_id} not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this game session"
            )
        
        completed_session = service.complete_session(
            db, 
            session_id, 
            completion_data.completion_time_seconds
        )
        return completed_session
        
    except SessionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game session not found"
        )
    except SessionAlreadyCompletedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is already completed"
        )


@router.post("/session/{session_id}/reveal-cell", response_model=RevealCellResponse)
async def reveal_cell_letter(
    session_id: UUID,
    cell_position: CellPosition,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reveal correct letter for a specific cell.
    
    Args:
        session_id: The game session ID
        cell_position: Cell coordinates (row, col)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        RevealCellResponse: Correct letter for the cell
        
    Raises:
        HTTPException: If session not found, already completed, or doesn't belong to user
    """
    try:
        # Verify session belongs to current user
        from app.games.crossword.models import CrosswordGameSession
        session = db.query(CrosswordGameSession).filter(
            CrosswordGameSession.id == session_id
        ).first()
        
        if not session:
            raise SessionNotFoundError(f"Session {session_id} not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this game session"
            )
        
        letter, updated_session = service.reveal_cell(
            db, 
            session_id, 
            cell_position.row, 
            cell_position.col
        )
        
        return RevealCellResponse(
            letter=letter,
            row=cell_position.row,
            col=cell_position.col
        )
        
    except SessionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game session not found"
        )
    except SessionAlreadyCompletedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reveal cell in a completed session"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/session/{session_id}/check-cell", response_model=CheckCellResponse)
async def check_cell_letter(
    session_id: UUID,
    check_request: CheckCellRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if a specific cell letter is correct.
    
    Args:
        session_id: The game session ID
        check_request: Cell coordinates and letter to check
        db: Database session
        current_user: Authenticated user
        
    Returns:
        CheckCellResponse: Whether the letter is correct
        
    Raises:
        HTTPException: If session not found, already completed, or doesn't belong to user
    """
    try:
        # Verify session belongs to current user
        from app.games.crossword.models import CrosswordGameSession
        session = db.query(CrosswordGameSession).filter(
            CrosswordGameSession.id == session_id
        ).first()
        
        if not session:
            raise SessionNotFoundError(f"Session {session_id} not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this game session"
            )
        
        is_correct, updated_session = service.check_cell(
            db,
            session_id,
            check_request.row,
            check_request.col,
            check_request.letter
        )
        
        return CheckCellResponse(
            is_correct=is_correct,
            row=check_request.row,
            col=check_request.col
        )
        
    except SessionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game session not found"
        )
    except SessionAlreadyCompletedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check cell in a completed session"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/session/{session_id}/reveal-all", response_model=RevealAllResponse)
async def reveal_all_answers(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reveal entire board with all answers.
    
    Args:
        session_id: The game session ID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        RevealAllResponse: Complete grid with all answers
        
    Raises:
        HTTPException: If session not found, already completed, or doesn't belong to user
    """
    try:
        # Verify session belongs to current user
        from app.games.crossword.models import CrosswordGameSession
        session = db.query(CrosswordGameSession).filter(
            CrosswordGameSession.id == session_id
        ).first()
        
        if not session:
            raise SessionNotFoundError(f"Session {session_id} not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this game session"
            )
        
        complete_data, updated_session = service.reveal_all(db, session_id)
        
        return RevealAllResponse(**complete_data)
        
    except SessionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game session not found"
        )
    except SessionAlreadyCompletedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reveal answers in a completed session"
        )


@router.get("/session/{session_id}", response_model=GameSessionResponse)
async def get_game_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get details of a specific game session.
    
    Args:
        session_id: The game session ID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        GameSessionResponse: Session details
        
    Raises:
        HTTPException: If session not found or doesn't belong to user
    """
    from app.games.crossword.models import CrosswordGameSession
    
    session = db.query(CrosswordGameSession).filter(
        CrosswordGameSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game session not found"
        )
    
    # Verify session belongs to current user
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this game session"
        )
    
    return session


@router.get("/stats", response_model=CrosswordStats)
async def get_user_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get aggregate statistics for the authenticated user.
    Includes hints used and puzzles revealed.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        CrosswordStats: User's aggregate statistics
    """
    stats = service.get_user_stats(db, current_user.id)
    
    return stats


@router.get("/history", response_model=GameHistoryResponse)
async def get_game_history(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated game history for the authenticated user.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (max 100)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        GameHistoryResponse: Paginated game history
    """
    games, total = service.get_game_history(db, current_user.id, page, page_size)
    
    return GameHistoryResponse(
        games=games,
        total=total,
        page=page,
        page_size=page_size
    )
