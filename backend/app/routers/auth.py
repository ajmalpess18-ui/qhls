from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError
from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.hierarchy import District
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, hash_password
from app.core.reg_codes import generate_reg_code
from app.schemas.auth import LoginRequest, StudentLoginRequest, TokenResponse, RefreshRequest, CreateUserRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


from fastapi import Request

def get_bearer_token(request: Request) -> str:
    """Get bearer token from request headers"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return auth_header[7:]


def get_current_user_from_token(authorization: str = Depends(get_bearer_token)) -> str:
    """Extract token from bearer header"""
    return authorization


def get_current_user(token: str = Depends(get_current_user_from_token), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def authenticate_user(db: Session, email: str, password: str, allowed_roles: list):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    if user.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this login portal")
    return user


def authenticate_student_by_phone(db: Session, phone: str, password: str):
    user = db.query(User).filter(User.phone == phone, User.role == "student").first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    return user


def build_token_response(user: User) -> TokenResponse:
    payload = {"sub": str(user.id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload),
        role=user.role,
        name=user.name,
        user_id=user.id,
    )


@router.post("/student/login", response_model=TokenResponse)
def student_login(data: StudentLoginRequest, db: Session = Depends(get_db)):
    user = authenticate_student_by_phone(db, data.phone, data.password)
    return build_token_response(user)


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password,
                             ["admin", "state", "district", "zone", "unit", "faculty"])
    return build_token_response(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return build_token_response(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")


@router.post("/create-user", response_model=UserResponse)
def create_user(data: CreateUserRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Create a new user account (students/faculty).
    Only unit admins can create students in their unit.
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Only unit admins can create students
    if current_user.role != "unit":
        raise HTTPException(status_code=403, detail="Only unit admins can create users")
    
    if data.role != "student":
        raise HTTPException(status_code=400, detail="Only student creation is supported")
    
    # Verify unit admin is creating student in their unit
    if not current_user.unit_id:
        raise HTTPException(status_code=400, detail="Unit admin has no assigned unit")
    
    if data.unit_id and data.unit_id != current_user.unit_id:
        raise HTTPException(status_code=403, detail="Cannot create students outside your unit")
    
    # Create new user
    new_user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        hashed_password=hash_password(data.password),
        role=data.role,
        is_active=True,
    )
    
    # Set hierarchy relationships from unit admin's context
    new_user.state_id = current_user.state_id
    new_user.district_id = current_user.district_id
    new_user.zone_id = current_user.zone_id
    new_user.unit_id = current_user.unit_id
    
    # Get district and zone names for reg code generation
    from app.models.hierarchy import State, Zone
    district = db.query(District).filter(District.id == current_user.district_id).first()
    zone = db.query(Zone).filter(Zone.id == current_user.zone_id).first()
    state = db.query(State).filter(State.id == current_user.state_id).first()
    
    if not district or not state:
        raise HTTPException(status_code=400, detail="Invalid unit hierarchy configuration")
    
    # Generate registration code for students
    try:
        new_user.reg_code = generate_reg_code(
            db, 
            state.name, 
            district.name,
            zone.name if zone else None
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Error generating reg code: {str(e)}")
    
    db.add(new_user)
    db.flush()  # Flush to get the user ID
    
    # Create student record
    if not data.center_id:
        raise HTTPException(status_code=400, detail="center_id required for students")
    
    student = Student(
        user_id=new_user.id,
        reg_number=new_user.reg_code,
        center_id=data.center_id,
        unit_id=current_user.unit_id,
        class_name=data.class_name,
    )
    db.add(student)
    db.commit()
    db.refresh(new_user)
    
    return new_user

