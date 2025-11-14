from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    username: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""
    id: str  # Clerk user ID


class UserSync(BaseModel):
    """Schema for syncing user from Clerk"""
    clerk_user_id: str
    email: EmailStr
    username: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
