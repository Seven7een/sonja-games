from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """User model with Clerk ID as primary key"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)  # Clerk user ID
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
