from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from app.config import settings
from app.database import get_db
from app.core.models.user import User
import logging

logger = logging.getLogger(__name__)

# Initialize Clerk client
try:
    if not settings.CLERK_SECRET_KEY:
        logger.error("❌ CLERK_SECRET_KEY is not set! Authentication will not work.")
        raise ValueError("CLERK_SECRET_KEY environment variable is required")
    
    logger.info(f"✓ Initializing Clerk client with key: {settings.CLERK_SECRET_KEY[:10]}...")
    clerk_client = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)
    logger.info("✓ Clerk client initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize Clerk client: {e}")
    raise

# HTTP Bearer token scheme
security = HTTPBearer()


async def verify_clerk_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Clerk JWT token using authenticateRequest and return user information.
    
    Args:
        request: FastAPI Request object
        credentials: HTTP Authorization credentials with Bearer token
        
    Returns:
        dict: User information from Clerk token
        
    Raises:
        HTTPException: If token is invalid or verification fails
    """
    try:
        # Use Clerk's authenticateRequest method
        # This handles token verification automatically
        options = AuthenticateRequestOptions(
            secret_key=settings.CLERK_SECRET_KEY,
            clock_skew_in_ms=60000,  # Allow 60 seconds of clock skew for Docker time sync issues
        )
        auth_result = clerk_client.authenticate_request(request, options)
        
        if not auth_result.is_authenticated:
            print(f"✗ Authentication failed: {auth_result.reason}")
            print(f"  Message: {auth_result.message}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {auth_result.reason or 'Invalid token'}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get the auth object which contains user info
        auth_obj = auth_result.to_auth()
        
        # Extract email and username from claims if available
        claims = auth_obj.claims or {}
        print(f"✓ Token verified successfully for user: {auth_obj.user_id}")
        print(f"  Claims keys: {list(claims.keys())}")
        
        # Fetch user details from Clerk if email not in claims
        email = claims.get("email")
        username = claims.get("username")
        
        if not email:
            # Fetch user from Clerk API
            try:
                user = clerk_client.users.get(user_id=auth_obj.user_id)
                email = user.email_addresses[0].email_address if user.email_addresses else None
                username = user.username
                print(f"  Fetched from Clerk API - email: {email}, username: {username}")
            except Exception as e:
                print(f"  Failed to fetch user from Clerk: {e}")
                import traceback
                traceback.print_exc()
        
        return {
            "sub": auth_obj.user_id,
            "session_id": auth_obj.session_id,
            "org_id": auth_obj.org_id,
            "email": email,
            "username": username,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Token verification failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    request: Request,
    token_data: dict = Depends(verify_clerk_token),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from database.
    
    Args:
        request: FastAPI Request object
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
