from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_district
from app.core.security import hash_password
from app.models.user import User
from app.models.hierarchy import Zone, Unit
from app.models.center import Center
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.submission import CenterSubmission
from app.schemas.schemas import ZoneCreate, ZoneOut, UnitOut, UserCreate, UserOut

router = APIRouter(prefix="/district", tags=["District"])


@router.post("/zones", response_model=ZoneOut)
def create_zone(data: ZoneCreate, db: Session = Depends(get_db), current=Depends(get_district)):
    zone = Zone(name=data.name, district_id=current.district_id)
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.put("/zones/{zone_id}", response_model=ZoneOut)
def update_zone(zone_id: int, data: ZoneCreate, db: Session = Depends(get_db), current=Depends(get_district)):
    zone = db.query(Zone).filter(Zone.id == zone_id, Zone.district_id == current.district_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    zone.name = data.name
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/zones/{zone_id}")
def delete_zone(zone_id: int, db: Session = Depends(get_db), current=Depends(get_district)):
    zone = db.query(Zone).filter(Zone.id == zone_id, Zone.district_id == current.district_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    db.delete(zone)
    db.commit()
    return {"message": "Zone deleted"}


@router.get("/zones", response_model=list[ZoneOut])
def list_zones(db: Session = Depends(get_db), current=Depends(get_district)):
    return db.query(Zone).filter(Zone.district_id == current.district_id).all()


@router.get("/units", response_model=list[UnitOut])
def list_units(db: Session = Depends(get_db), current=Depends(get_district)):
    zones = db.query(Zone).filter(Zone.district_id == current.district_id).all()
    zone_ids = [z.id for z in zones]
    return db.query(Unit).filter(Unit.zone_id.in_(zone_ids)).all()


@router.get("/submissions")
def list_submissions(db: Session = Depends(get_db), current=Depends(get_district)):
    zones = db.query(Zone).filter(Zone.district_id == current.district_id).all()
    zone_ids = [z.id for z in zones]
    units = db.query(Unit).filter(Unit.zone_id.in_(zone_ids)).all()
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
def create_zone_user(data: UserCreate, db: Session = Depends(get_db), current=Depends(get_district)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name, email=data.email,
        hashed_password=hash_password(data.password),
        role="zone", district_id=current.district_id,
        zone_id=data.zone_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserOut)
def update_zone_user(user_id: int, data: UserCreate, db: Session = Depends(get_db), current=Depends(get_district)):
    user = db.query(User).filter(User.id == user_id, User.district_id == current.district_id, User.role == "zone").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.email != data.email:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
            
    user.name = data.name
    user.email = data.email
    if data.zone_id:
        user.zone_id = data.zone_id
    if data.password:
        user.hashed_password = hash_password(data.password)
        
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_zone_user(user_id: int, db: Session = Depends(get_db), current=Depends(get_district)):
    user = db.query(User).filter(User.id == user_id, User.district_id == current.district_id, User.role == "zone").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/zone-users", response_model=list[UserOut])
def list_zone_users(db: Session = Depends(get_db), current=Depends(get_district)):
    return db.query(User).filter(
        User.district_id == current.district_id,
        User.role == "zone"
    ).all()


@router.get("/stats")
def district_stats(db: Session = Depends(get_db), current=Depends(get_district)):
    zones = db.query(Zone).filter(Zone.district_id == current.district_id).all()
    zone_ids = [z.id for z in zones]
    units = db.query(Unit).filter(Unit.zone_id.in_(zone_ids)).all()
    unit_ids = [u.id for u in units]
    centers = db.query(Center).filter(Center.unit_id.in_(unit_ids)).count()
    students = db.query(Student).filter(Student.unit_id.in_(unit_ids)).count()
    return {"zones": len(zones), "units": len(units), "centers": centers, "students": students}
