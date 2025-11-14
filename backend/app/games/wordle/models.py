from sqlalchemy import Column, String, DateTime, Date, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


class WordleDailyChallenge(Base):
    """Daily Wordle challenge with unique word per day"""
    __tablename__ = "wordle_daily_challenges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    word = Column(String(5), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship to game sessions
    game_sessions = relationship("WordleGameSession", back_populates="daily_challenge")
    
    def __repr__(self):
        return f"<WordleDailyChallenge(id={self.id}, date={self.date}, word={self.word})>"


class WordleGameSession(Base):
    """Individual Wordle game session for a user"""
    __tablename__ = "wordle_game_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    daily_challenge_id = Column(UUID(as_uuid=True), ForeignKey("wordle_daily_challenges.id"), nullable=False, index=True)
    guesses = Column(JSON, nullable=False, default=list)
    won = Column(Boolean, nullable=False, default=False)
    attempts_used = Column(Integer, nullable=False, default=0)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", backref="wordle_sessions")
    daily_challenge = relationship("WordleDailyChallenge", back_populates="game_sessions")
    
    def __repr__(self):
        return f"<WordleGameSession(id={self.id}, user_id={self.user_id}, won={self.won}, attempts_used={self.attempts_used})>"
