from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from clerk_backend_api import Clerk
from app.config import settings
from app.database import get_db
from app.core.models.user import User

# Initialize Clerk client
clerk_client = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)

# HTTP Bearer token scheme
security = HTTPBearer()


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Clerk JWT token and return user information.
    
    Args:
        credentials: HTTP Authorization credentials with Bearer token
        
    Returns:
        dict: User information from Clerk token
        
    Raises:
        HTTPException: If token is invalid or verification fails
    """
    token = credentials.credentials
    
    try:
        # Verify the JWT token with Clerk
        verified_token = clerk_client.jwt_templates.verify_token(token)
        return verified_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    token_data: dict = Depends(verify_clerk_token),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from database.
    
    Args:
        token_data: Verified token data from Clerk
        db: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If user not found in database
    """
    user_id = token_data.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please sync your account first.",
        )
    
    return user
