from sqlalchemy import Column, String, DateTime, Date, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


class CrosswordDailyPuzzle(Base):
    """Daily Crossword puzzle with unique puzzle per day"""
    __tablename__ = "crossword_daily_puzzles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    grid_data = Column(JSON, nullable=False)  # 5x5 grid with letters and black cells
    clues_across = Column(JSON, nullable=False)  # {number: clue_text}
    clues_down = Column(JSON, nullable=False)  # {number: clue_text}
    answers_across = Column(JSON, nullable=False)  # {number: answer_word}
    answers_down = Column(JSON, nullable=False)  # {number: answer_word}
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship to game sessions
    game_sessions = relationship("CrosswordGameSession", back_populates="daily_puzzle")
    
    def __repr__(self):
        return f"<CrosswordDailyPuzzle(id={self.id}, date={self.date})>"


class CrosswordGameSession(Base):
    """Individual Crossword game session for a user"""
    __tablename__ = "crossword_game_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    daily_puzzle_id = Column(UUID(as_uuid=True), ForeignKey("crossword_daily_puzzles.id"), nullable=False, index=True)
    current_grid = Column(JSON, nullable=False, default=dict)  # User's current answers
    completed = Column(Boolean, nullable=False, default=False)
    completion_time_seconds = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", backref="crossword_sessions")
    daily_puzzle = relationship("CrosswordDailyPuzzle", back_populates="game_sessions")
    
    def __repr__(self):
        return f"<CrosswordGameSession(id={self.id}, user_id={self.user_id}, completed={self.completed})>"
