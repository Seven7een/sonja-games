from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID
from enum import Enum


class LetterStatus(str, Enum):
    """Status of a letter in a guess"""
    CORRECT = "correct"  # Green - correct letter in correct position
    PRESENT = "present"  # Yellow - correct letter in wrong position
    ABSENT = "absent"    # Gray - letter not in word


class LetterResult(BaseModel):
    """Result for a single letter in a guess"""
    letter: str = Field(..., min_length=1, max_length=1)
    status: LetterStatus


class GuessResult(BaseModel):
    """Result of a guess submission"""
    guess: str = Field(..., min_length=5, max_length=5)
    result: List[LetterResult]
    is_correct: bool
    attempts_used: int
    game_over: bool
    won: Optional[bool] = None
    answer: Optional[str] = None  # Only provided when game is over


class GuessSubmission(BaseModel):
    """Request to submit a guess"""
    guess: str = Field(..., min_length=5, max_length=5, pattern="^[a-zA-Z]{5}$")


class DailyChallengeInfo(BaseModel):
    """Information about the daily challenge (without revealing the word)"""
    challenge_id: UUID
    date: date


class GameSessionResponse(BaseModel):
    """Response for a game session"""
    id: UUID
    user_id: str
    daily_challenge_id: UUID
    guesses: List[str]
    guess_results: Optional[List[List[LetterResult]]] = None  # Calculated feedback for each guess
    won: bool
    attempts_used: int
    completed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class GameSessionCreate(BaseModel):
    """Request to create a new game session"""
    date: Optional[date] = None  # Defaults to today if not provided


class WordleStats(BaseModel):
    """Aggregate statistics for a user"""
    total_games: int
    wins: int
    losses: int
    win_percentage: float
    current_streak: int
    max_streak: int
    guess_distribution: List[int] = Field(default_factory=lambda: [0, 0, 0, 0, 0, 0])  # Index 0 = 1 guess, etc.


class GameHistoryItem(BaseModel):
    """Single item in game history"""
    id: UUID
    date: date
    won: bool
    attempts_used: int
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class GameHistoryResponse(BaseModel):
    """Paginated game history response"""
    games: List[GameHistoryItem]
    total: int
    page: int
    page_size: int
