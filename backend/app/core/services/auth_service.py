from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.models.user import User
from app.core.schemas.user import UserCreate
from typing import Optional


def sync_user(db: Session, user_data: UserCreate) -> User:
    """
    Sync user from Clerk to database. Creates new user if doesn't exist,
    updates existing user if found.
    
    Args:
        db: Database session
        user_data: User data from Clerk
        
    Returns:
        User: Synced user record
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.id == user_data.id).first()
    
    if existing_user:
        # Update existing user
        existing_user.email = user_data.email
        existing_user.username = user_data.username
        db.commit()
        db.refresh(existing_user)
        return existing_user
    
    # Create new user
    new_user = User(
        id=user_data.id,
        email=user_data.email,
        username=user_data.username
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError:
        db.rollback()
        # Handle race condition - user was created by another request
        existing_user = db.query(User).filter(User.id == user_data.id).first()
        if existing_user:
            return existing_user
        raise


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """
    Retrieve user by Clerk ID.
    
    Args:
        db: Database session
        user_id: Clerk user ID
        
    Returns:
        User: User record if found, None otherwise
    """
    return db.query(User).filter(User.id == user_id).first()
