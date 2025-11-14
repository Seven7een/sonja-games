from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.middleware.auth import verify_clerk_token
from app.core.services.auth_service import sync_user
from app.core.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/sync", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def sync_authenticated_user(
    token_data: dict = Depends(verify_clerk_token),
    db: Session = Depends(get_db)
):
    """
    Synchronize authenticated user from Clerk to database.
    
    This endpoint should be called after successful Clerk authentication
    to ensure the user exists in the application database.
    
    Args:
        token_data: Verified token data from Clerk
        db: Database session
        
    Returns:
        UserResponse: Synced user information
        
    Raises:
        HTTPException: If sync fails or token is invalid
    """
    # Extract user information from token
    user_id = token_data.get("sub")
    email = token_data.get("email")
    username = token_data.get("username")
    
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token: missing required user information"
        )
    
    # Create user data object
    user_data = UserCreate(
        id=user_id,
        email=email,
        username=username
    )
    
    # Sync user to database
    user = sync_user(db, user_data)
    
    return user
