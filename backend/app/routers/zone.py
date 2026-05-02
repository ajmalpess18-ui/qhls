from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_zone
from app.core.security import hash_password
from app.models.user import User
from app.models.hierarchy import Unit
from app.models.center import Center
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.submission import CenterSubmission
from app.schemas.schemas import UnitCreate, UnitOut, UserCreate, UserOut

router = APIRouter(prefix="/zone", tags=["Zone"])


@router.post("/units", response_model=UnitOut)
def create_unit(data: UnitCreate, db: Session = Depends(get_db), current=Depends(get_zone)):
    unit = Unit(name=data.name, zone_id=current.zone_id)
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


@router.put("/units/{unit_id}", response_model=UnitOut)
def update_unit(unit_id: int, data: UnitCreate, db: Session = Depends(get_db), current=Depends(get_zone)):
    unit = db.query(Unit).filter(Unit.id == unit_id, Unit.zone_id == current.zone_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    unit.name = data.name
    db.commit()
    db.refresh(unit)
    return unit


@router.delete("/units/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db), current=Depends(get_zone)):
    unit = db.query(Unit).filter(Unit.id == unit_id, Unit.zone_id == current.zone_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(unit)
    db.commit()
    return {"message": "Unit deleted"}


@router.get("/units", response_model=list[UnitOut])
def list_units(db: Session = Depends(get_db), current=Depends(get_zone)):
    return db.query(Unit).filter(Unit.zone_id == current.zone_id).all()


@router.get("/submissions")
def list_submissions(db: Session = Depends(get_db), current=Depends(get_zone)):
    units = db.query(Unit).filter(Unit.zone_id == current.zone_id).all()
    unit_ids = [u.id for u in units]
    subs = db.query(CenterSubmission).filter(CenterSubmission.unit_id.in_(unit_ids)).all()
    result = []
    for s in subs:
        center = db.query(Center).filter(Center.id == s.center_id).first()
        result.append({
            "id": s.id, "center_name": center.name if center else "",
            "status": s.status, "submitted_at": s.submitted_at,
        })
    return result


@router.post("/users", response_model=UserOut)
def create_unit_user(data: UserCreate, db: Session = Depends(get_db), current=Depends(get_zone)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name, email=data.email,
        hashed_password=hash_password(data.password),
        role="unit", district_id=current.district_id, 
        zone_id=current.zone_id,
        unit_id=data.unit_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/unit-users", response_model=list[UserOut])
def list_unit_users(db: Session = Depends(get_db), current=Depends(get_zone)):
    return db.query(User).filter(
        User.zone_id == current.zone_id,
        User.role == "unit"
    ).all()


@router.put("/users/{user_id}", response_model=UserOut)
def update_unit_user(user_id: int, data: UserCreate, db: Session = Depends(get_db), current=Depends(get_zone)):
    user = db.query(User).filter(User.id == user_id, User.zone_id == current.zone_id, User.role == "unit").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.email != data.email:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
            
    user.name = data.name
    user.email = data.email
    if data.unit_id:
        user.unit_id = data.unit_id
    if data.password:
        user.hashed_password = hash_password(data.password)
        
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_unit_user(user_id: int, db: Session = Depends(get_db), current=Depends(get_zone)):
    user = db.query(User).filter(User.id == user_id, User.zone_id == current.zone_id, User.role == "unit").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/stats")
def zone_stats(db: Session = Depends(get_db), current=Depends(get_zone)):
    units = db.query(Unit).filter(Unit.zone_id == current.zone_id).all()
    unit_ids = [u.id for u in units]
    centers = db.query(Center).filter(Center.unit_id.in_(unit_ids)).count()
    students = db.query(Student).filter(Student.unit_id.in_(unit_ids)).count()
    faculty = db.query(Faculty).filter(Faculty.unit_id.in_(unit_ids)).count()
    return {"units": len(units), "centers": centers, "students": students, "faculty": faculty}
