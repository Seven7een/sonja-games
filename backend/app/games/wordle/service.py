"""
Wordle game service.
Handles game session management, statistics, and game logic.
"""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from app.games.wordle.models import WordleDailyChallenge, WordleGameSession
from app.games.wordle.schemas import (
    GuessResult,
    LetterResult,
    WordleStats,
    GameHistoryItem,
    LetterStatus
)
from app.games.wordle.word_service import get_word_service


def get_or_create_daily_challenge(db: Session, target_date: date) -> WordleDailyChallenge:
    """
    Get or create the daily challenge for a specific date.
    
    Args:
        db: Database session
        target_date: The date to get/create challenge for
        
    Returns:
        WordleDailyChallenge instance for the specified date
    """
    # Try to get existing challenge
    challenge = db.query(WordleDailyChallenge).filter(
        WordleDailyChallenge.date == target_date
    ).first()
    
    if challenge:
        return challenge
    
    # Create new challenge
    word_service = get_word_service()
    daily_word = word_service.get_daily_word(target_date)
    
    challenge = WordleDailyChallenge(
        date=target_date,
        word=daily_word
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    
    return challenge


def start_daily_challenge(db: Session, user_id: str, target_date: Optional[date] = None) -> WordleGameSession:
    """
    Start a new game session for the user and the daily challenge.
    
    Args:
        db: Database session
        user_id: The user's ID
        target_date: The date of the challenge (defaults to today)
        
    Returns:
        New WordleGameSession instance
    """
    if target_date is None:
        target_date = date.today()
    
    # Get or create the daily challenge
    challenge = get_or_create_daily_challenge(db, target_date)
    
    # Create new game session
    session = WordleGameSession(
        user_id=user_id,
        daily_challenge_id=challenge.id,
        guesses=[],
        won=False,
        attempts_used=0
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session


def submit_guess(
    db: Session,
    session_id: UUID,
    guess: str
) -> GuessResult:
    """
    Submit a guess for a game session.
    Validates the guess, calculates feedback, updates session,
    and checks win/loss conditions.
    
    Args:
        db: Database session
        session_id: The game session ID
        guess: The guessed word (5 letters)
        
    Returns:
        GuessResult with feedback and game status
        
    Raises:
        ValueError: If session not found, already completed, or invalid guess
    """
    # Get the session
    session = db.query(WordleGameSession).filter(
        WordleGameSession.id == session_id
    ).first()
    
    if not session:
        raise ValueError("Game session not found")
    
    if session.completed_at is not None:
        raise ValueError("Game session already completed")
    
    # Validate the guess
    word_service = get_word_service()
    guess = guess.lower()
    
    if not word_service.is_valid_word(guess):
        raise ValueError("Invalid word")
    
    # Get the answer from the daily challenge
    challenge = db.query(WordleDailyChallenge).filter(
        WordleDailyChallenge.id == session.daily_challenge_id
    ).first()
    
    if not challenge:
        raise ValueError("Daily challenge not found")
    
    # Calculate feedback
    feedback = word_service.check_guess(guess, challenge.word)
    
    # Update session
    session.guesses = session.guesses + [guess]
    session.attempts_used += 1
    
    # Store guess results - convert LetterResult objects to dicts for JSON storage
    current_results = session.guess_results or []
    feedback_dict = [{"letter": lr.letter, "status": lr.status.value} for lr in feedback]
    session.guess_results = current_results + [feedback_dict]
    
    # Check if won
    is_correct = all(letter.status == LetterStatus.CORRECT for letter in feedback)
    game_over = False
    won = None
    
    if is_correct:
        session.won = True
        session.completed_at = datetime.utcnow()
        game_over = True
        won = True
    elif session.attempts_used >= 6:
        session.won = False
        session.completed_at = datetime.utcnow()
        game_over = True
        won = False
    
    db.commit()
    db.refresh(session)
    
    return GuessResult(
        guess=guess,
        result=feedback,
        is_correct=is_correct,
        attempts_used=session.attempts_used,
        game_over=game_over,
        won=won,
        answer=challenge.word if game_over else None  # Only reveal answer when game is over
    )


def get_user_stats(db: Session, user_id: str) -> WordleStats:
    """
    Calculate aggregate statistics for a user.
    
    Args:
        db: Database session
        user_id: The user's ID
        
    Returns:
        WordleStats with calculated statistics
    """
    # Get all completed sessions
    completed_sessions = db.query(WordleGameSession).filter(
        and_(
            WordleGameSession.user_id == user_id,
            WordleGameSession.completed_at.isnot(None)
        )
    ).order_by(WordleGameSession.created_at).all()
    
    total_games = len(completed_sessions)
    wins = sum(1 for s in completed_sessions if s.won)
    losses = total_games - wins
    win_percentage = (wins / total_games * 100) if total_games > 0 else 0.0
    
    # Calculate guess distribution (index 0 = 1 guess, index 5 = 6 guesses)
    guess_distribution = [0, 0, 0, 0, 0, 0]
    for session in completed_sessions:
        if session.won and 1 <= session.attempts_used <= 6:
            guess_distribution[session.attempts_used - 1] += 1
    
    # Calculate current streak and max streak
    current_streak = 0
    max_streak = 0
    temp_streak = 0
    
    # Get sessions ordered by date
    sessions_by_date = db.query(WordleGameSession).join(
        WordleDailyChallenge
    ).filter(
        and_(
            WordleGameSession.user_id == user_id,
            WordleGameSession.completed_at.isnot(None)
        )
    ).order_by(WordleDailyChallenge.date).all()
    
    prev_date = None
    for session in sessions_by_date:
        challenge_date = session.daily_challenge.date
        
        if session.won:
            # Check if consecutive day
            if prev_date is None or (challenge_date - prev_date).days == 1:
                temp_streak += 1
            else:
                temp_streak = 1
            
            max_streak = max(max_streak, temp_streak)
            prev_date = challenge_date
        else:
            temp_streak = 0
            prev_date = challenge_date
    
    # Current streak is the temp_streak if the last session was today or yesterday
    if sessions_by_date:
        last_session = sessions_by_date[-1]
        last_date = last_session.daily_challenge.date
        days_since_last = (date.today() - last_date).days
        
        if last_session.won and days_since_last <= 1:
            current_streak = temp_streak
        else:
            current_streak = 0
    
    return WordleStats(
        total_games=total_games,
        wins=wins,
        losses=losses,
        win_percentage=round(win_percentage, 2),
        current_streak=current_streak,
        max_streak=max_streak,
        guess_distribution=guess_distribution
    )


def get_game_history(
    db: Session,
    user_id: str,
    page: int = 1,
    page_size: int = 20
) -> tuple[List[GameHistoryItem], int]:
    """
    Get paginated game history for a user.
    
    Args:
        db: Database session
        user_id: The user's ID
        page: Page number (1-indexed)
        page_size: Number of items per page
        
    Returns:
        Tuple of (list of GameHistoryItem, total count)
    """
    # Get total count
    total = db.query(WordleGameSession).filter(
        and_(
            WordleGameSession.user_id == user_id,
            WordleGameSession.completed_at.isnot(None)
        )
    ).count()
    
    # Get paginated sessions
    offset = (page - 1) * page_size
    sessions = db.query(WordleGameSession).join(
        WordleDailyChallenge
    ).filter(
        and_(
            WordleGameSession.user_id == user_id,
            WordleGameSession.completed_at.isnot(None)
        )
    ).order_by(desc(WordleDailyChallenge.date)).offset(offset).limit(page_size).all()
    
    # Convert to GameHistoryItem
    history_items = [
        GameHistoryItem(
            id=session.id,
            date=session.daily_challenge.date,
            won=session.won,
            attempts_used=session.attempts_used,
            completed_at=session.completed_at
        )
        for session in sessions
    ]
    
    return history_items, total


def get_todays_session(db: Session, user_id: str, target_date: date) -> Optional[WordleGameSession]:
    """
    Get the user's game session for a specific date.
    
    Args:
        db: Database session
        user_id: The user's ID
        target_date: The date to get the session for
        
    Returns:
        WordleGameSession if found, None otherwise
    """
    # Get the challenge for the target date
    challenge = db.query(WordleDailyChallenge).filter(
        WordleDailyChallenge.date == target_date
    ).first()
    
    if not challenge:
        return None
    
    # Get the user's session for this challenge
    session = db.query(WordleGameSession).filter(
        and_(
            WordleGameSession.user_id == user_id,
            WordleGameSession.daily_challenge_id == challenge.id
        )
    ).first()
    
    return session


def calculate_guess_results_for_session(db: Session, session: WordleGameSession) -> List[List[LetterResult]]:
    """
    Calculate the guess results (letter feedback) for all guesses in a session.
    
    Args:
        db: Database session
        session: The game session
        
    Returns:
        List of guess results, one for each guess
    """
    # Get the answer from the daily challenge
    challenge = db.query(WordleDailyChallenge).filter(
        WordleDailyChallenge.id == session.daily_challenge_id
    ).first()
    
    if not challenge:
        return []
    
    # Calculate feedback for each guess
    word_service = get_word_service()
    results = []
    
    for guess in session.guesses:
        feedback = word_service.check_guess(guess, challenge.word)
        results.append(feedback)
    
    return results


def can_play_today(db: Session, user_id: str) -> bool:
    """
    Check if the user can play today's daily challenge.
    Returns False if user has already completed today's challenge.
    
    Args:
        db: Database session
        user_id: The user's ID
        
    Returns:
        True if user can play, False if already completed today
    """
    today = date.today()
    
    # Get today's challenge
    challenge = db.query(WordleDailyChallenge).filter(
        WordleDailyChallenge.date == today
    ).first()
    
    if not challenge:
        # No challenge exists yet, user can play
        return True
    
    # Check if user has a completed session for today
    completed_session = db.query(WordleGameSession).filter(
        and_(
            WordleGameSession.user_id == user_id,
            WordleGameSession.daily_challenge_id == challenge.id,
            WordleGameSession.completed_at.isnot(None)
        )
    ).first()
    
    return completed_session is None
