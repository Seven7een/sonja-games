"""
Wordle game API router.
Handles all Wordle game endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date

from app.database import get_db
from app.core.middleware.auth import get_current_user
from app.core.models.user import User
from app.games.wordle.schemas import (
    DailyChallengeInfo,
    GameSessionResponse,
    GameSessionCreate,
    GuessSubmission,
    GuessResult,
    WordleStats,
    GameHistoryResponse
)
from app.games.wordle import service

router = APIRouter(prefix="/api/wordle", tags=["wordle"])


@router.get("/daily", response_model=DailyChallengeInfo)
async def get_daily_challenge(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get today's daily challenge information.
    Returns the challenge ID and date without revealing the word.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        DailyChallengeInfo: Challenge ID and date
    """
    today = date.today()
    challenge = service.get_or_create_daily_challenge(db, today)
    
    return DailyChallengeInfo(
        challenge_id=challenge.id,
        date=challenge.date
    )


@router.post("/session", response_model=GameSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_game_session(
    session_data: GameSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start a new game session for the authenticated user.
    
    Args:
        session_data: Optional date for the challenge (defaults to today)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        GameSessionResponse: New game session details
        
    Raises:
        HTTPException: If user has already completed today's challenge
    """
    target_date = session_data.date or date.today()
    
    # Check if user can play for this date
    if target_date == date.today():
        can_play = service.can_play_today(db, current_user.id)
        if not can_play:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You have already completed today's challenge"
            )
    
    # Start new session
    session = service.start_daily_challenge(db, current_user.id, target_date)
    
    return session


@router.post("/session/{session_id}/guess", response_model=GuessResult)
async def submit_guess_to_session(
    session_id: UUID,
    guess_data: GuessSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a guess for a game session.
    
    Args:
        session_id: The game session ID
        guess_data: The guess submission
        db: Database session
        current_user: Authenticated user
        
    Returns:
        GuessResult: Feedback and updated game state
        
    Raises:
        HTTPException: If session not found, already completed, or invalid guess
    """
    try:
        result = service.submit_guess(db, session_id, guess_data.guess)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
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
        GameSessionResponse: Session details including guesses and status
        
    Raises:
        HTTPException: If session not found or doesn't belong to user
    """
    from app.games.wordle.models import WordleGameSession
    
    session = db.query(WordleGameSession).filter(
        WordleGameSession.id == session_id
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


@router.get("/can-play-today", response_model=dict)
async def check_can_play_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if the user can play today's daily challenge.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        dict: {"can_play": bool}
    """
    can_play = service.can_play_today(db, current_user.id)
    
    return {"can_play": can_play}


@router.get("/stats", response_model=WordleStats)
async def get_user_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get aggregate statistics for the authenticated user.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        WordleStats: User's aggregate statistics
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
