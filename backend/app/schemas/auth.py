from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class StudentLoginRequest(BaseModel):
    phone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: int


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class CreateUserRequest(BaseModel):
    """Request to create a new student user (for unit admins)"""
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: str = "student"  # Only students
    center_id: int  # Required for students
    class_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    role: str
    reg_code: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

