from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_admin
from app.core.security import hash_password
from app.models.user import User
from app.models.hierarchy import State, District
from app.schemas.schemas import StateCreate, StateOut, DistrictOut, UserCreate, UserOut

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/states", response_model=StateOut)
def create_state(data: StateCreate, db: Session = Depends(get_db), _=Depends(get_admin)):
    existing = db.query(State).filter(State.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="State already exists")
    state = State(name=data.name)
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


@router.put("/states/{state_id}", response_model=StateOut)
def update_state(state_id: int, data: StateCreate, db: Session = Depends(get_db), _=Depends(get_admin)):
    state = db.query(State).filter(State.id == state_id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    state.name = data.name
    db.commit()
    db.refresh(state)
    return state


@router.delete("/states/{state_id}")
def delete_state(state_id: int, db: Session = Depends(get_db), _=Depends(get_admin)):
    state = db.query(State).filter(State.id == state_id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    db.delete(state)
    db.commit()
    return {"message": "State deleted"}


@router.get("/states", response_model=list[StateOut])
def list_states(db: Session = Depends(get_db), _=Depends(get_admin)):
    return db.query(State).all()


@router.get("/districts", response_model=list[DistrictOut])
def list_districts(db: Session = Depends(get_db), _=Depends(get_admin)):
    return db.query(District).order_by(District.district_number).all()


@router.post("/users", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), _=Depends(get_admin)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        state_id=data.state_id,
        district_id=data.district_id,
        zone_id=data.zone_id,
        unit_id=data.unit_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserCreate, db: Session = Depends(get_db), _=Depends(get_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If email changed, check if it's already taken
    if user.email != data.email:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
            
    user.name = data.name
    user.email = data.email
    if data.password:  # only update if a new password is provided
        user.hashed_password = hash_password(data.password)
        
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(get_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(get_admin)):
    return db.query(User).filter(User.role != "student").all()


@router.patch("/users/{user_id}/toggle")
def toggle_user(user_id: int, db: Session = Depends(get_db), _=Depends(get_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}


@router.get("/analytics")
def analytics(db: Session = Depends(get_db), _=Depends(get_admin)):
    from app.models.hierarchy import District, Zone, Unit
    from app.models.center import Center
    from app.models.student import Student
    return {
        "total_states":    db.query(State).count(),
        "total_districts": db.query(District).count(),
        "total_zones":     db.query(Zone).count(),
        "total_units":     db.query(Unit).count(),
        "total_centers":   db.query(Center).count(),
        "total_students":  db.query(Student).count(),
        "total_users":     db.query(User).filter(User.role != "student").count(),
    }
