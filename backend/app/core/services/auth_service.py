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
    print(f"📝 Auth service - syncing user: {user_data.id}, {user_data.email}, {user_data.username}")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.id == user_data.id).first()
    
    if existing_user:
        # Update existing user
        print(f"📝 Updating existing user: {existing_user.id}")
        existing_user.email = user_data.email
        existing_user.username = user_data.username
        db.commit()
        db.refresh(existing_user)
        print(f"✅ User updated - Email: {existing_user.email}, Username: {existing_user.username}")
        return existing_user
    
    # Create new user
    print(f"📝 Creating new user: {user_data.id}")
    new_user = User(
        id=user_data.id,
        email=user_data.email,
        username=user_data.username
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"✅ New user created - Email: {new_user.email}, Username: {new_user.username}")
        return new_user
    except IntegrityError:
        db.rollback()
        print(f"⚠️ IntegrityError - user may have been created by another request")
        # Handle race condition - user was created by another request
        existing_user = db.query(User).filter(User.id == user_data.id).first()
        if existing_user:
            print(f"✅ Found user after race condition - Email: {existing_user.email}")
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
