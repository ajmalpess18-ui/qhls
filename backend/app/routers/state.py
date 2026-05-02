from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import os, shutil, csv, io
from app.database import get_db
from app.core.deps import get_state
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.models.hierarchy import District, Zone, Unit
from app.models.center import Center
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.submission import CenterSubmission, SubmissionStatus
from app.models.result import ExamResult
from app.models.material import StudyMaterial
from app.models.announcement import Announcement
from app.schemas.schemas import DistrictCreate, DistrictOut, UserCreate, UserOut
from app.schemas.data_schemas import SubmissionReview, ResultCreate, AnnouncementCreate, AnnouncementOut

router = APIRouter(prefix="/state", tags=["State"])


@router.post("/districts", response_model=DistrictOut)
def create_district(data: DistrictCreate, db: Session = Depends(get_db), current=Depends(get_state)):
    district = District(name=data.name, state_id=current.state_id)
    db.add(district)
    db.commit()
    db.refresh(district)
    return district


@router.get("/districts")
def list_districts(db: Session = Depends(get_db), current=Depends(get_state)):
    return db.query(District).filter(District.state_id == current.state_id).all()


@router.get("/hierarchy")
def get_hierarchy(db: Session = Depends(get_db), current=Depends(get_state)):
    districts = db.query(District).filter(District.state_id == current.state_id).all()
    result = []
    for d in districts:
        zones = db.query(Zone).filter(Zone.district_id == d.id).all()
        zone_list = []
        for z in zones:
            units = db.query(Unit).filter(Unit.zone_id == z.id).all()
            zone_list.append({"id": z.id, "name": z.name, "units": [{"id": u.id, "name": u.name} for u in units]})
        result.append({"id": d.id, "name": d.name, "zones": zone_list})
    return result


@router.get("/submissions")
def list_submissions(db: Session = Depends(get_db), current=Depends(get_state)):
    # Get all units under this state
    districts = db.query(District).filter(District.state_id == current.state_id).all()
    district_ids = [d.id for d in districts]
    zones = db.query(Zone).filter(Zone.district_id.in_(district_ids)).all()
    zone_ids = [z.id for z in zones]
    units = db.query(Unit).filter(Unit.zone_id.in_(zone_ids)).all()
    unit_ids = [u.id for u in units]
    submissions = db.query(CenterSubmission).filter(CenterSubmission.unit_id.in_(unit_ids)).all()
    result = []
    for s in submissions:
        center = db.query(Center).filter(Center.id == s.center_id).first()
        result.append({
            "id": s.id, "center_id": s.center_id,
            "center_name": center.name if center else "",
            "unit_id": s.unit_id, "status": s.status,
            "rejection_reason": s.rejection_reason,
            "submitted_at": s.submitted_at,
        })
    return result


@router.patch("/submissions/{submission_id}")
def review_submission(
    submission_id: int,
    data: SubmissionReview,
    db: Session = Depends(get_db),
    current=Depends(get_state)
):
    sub = db.query(CenterSubmission).filter(CenterSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub.status = data.status
    sub.rejection_reason = data.rejection_reason
    sub.reviewed_at = datetime.utcnow()
    sub.state_id = current.state_id
    db.commit()
    return {"message": f"Submission {data.status}"}


@router.get("/units/{unit_id}/students")
def get_unit_students(unit_id: int, db: Session = Depends(get_db), current=Depends(get_state)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    zone = db.query(Zone).filter(Zone.id == unit.zone_id).first()
    district = db.query(District).filter(District.id == zone.district_id).first()
    if district.state_id != current.state_id:
        raise HTTPException(status_code=403, detail="Unit not in your state")
    
    students = db.query(Student).filter(Student.unit_id == unit_id).all()
    return [
        {
            "id": s.id,
            "name": s.user.name,
            "reg_number": s.reg_number,
            "center": s.center.name if s.center else "",
            "class_name": s.class_name
        }
        for s in students
    ]


# ── Results ────────────────────────────────────────────────────────────────────
@router.post("/results/manual")
def add_result_manual(data: ResultCreate, db: Session = Depends(get_db), current=Depends(get_state)):
    result = ExamResult(**data.model_dump(), uploaded_by=current.id)
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.post("/results/upload-csv")
async def upload_results_csv(
    file: UploadFile = File(...),
    exam_name: str = Form(...),
    db: Session = Depends(get_db),
    current=Depends(get_state)
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    added = 0
    for row in reader:
        student = db.query(Student).filter(Student.reg_number == row.get("reg_number")).first()
        if not student:
            continue
        result = ExamResult(
            student_id=student.id,
            exam_name=exam_name,
            subject=row.get("subject", ""),
            marks=float(row.get("marks", 0)),
            total_marks=float(row.get("total_marks", 100)),
            grade=row.get("grade", None),
            uploaded_by=current.id,
        )
        db.add(result)
        added += 1
    db.commit()
    return {"message": f"{added} results uploaded successfully"}


# ── Study Materials ────────────────────────────────────────────────────────────
@router.post("/materials/upload")
async def upload_material(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current=Depends(get_state)
):
    upload_dir = os.path.join(settings.UPLOAD_DIR, "materials")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{datetime.utcnow().timestamp()}_{file.filename}")
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    material = StudyMaterial(
        title=title, description=description, class_name=class_name,
        file_url=file_path, uploaded_by=current.id
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return {"message": "Material uploaded", "id": material.id}


@router.get("/materials")
def list_materials(db: Session = Depends(get_db), _=Depends(get_state)):
    return db.query(StudyMaterial).order_by(StudyMaterial.created_at.desc()).all()


@router.delete("/materials/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db), _=Depends(get_state)):
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if os.path.exists(material.file_url):
        os.remove(material.file_url)
    db.delete(material)
    db.commit()
    return {"message": "Deleted"}


# ── Announcements ──────────────────────────────────────────────────────────────
@router.post("/announcements", response_model=AnnouncementOut)
def create_announcement(data: AnnouncementCreate, db: Session = Depends(get_db), current=Depends(get_state)):
    ann = Announcement(title=data.title, body=data.body, posted_by=current.id)
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@router.get("/announcements", response_model=list[AnnouncementOut])
def list_announcements(db: Session = Depends(get_db), _=Depends(get_state)):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()


# ── Users for this state ───────────────────────────────────────────────────────
@router.post("/users", response_model=UserOut)
def create_sub_user(data: UserCreate, db: Session = Depends(get_db), current=Depends(get_state)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name, email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        state_id=current.state_id,
        district_id=data.district_id,
        zone_id=data.zone_id,
        unit_id=data.unit_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/stats")
def state_stats(db: Session = Depends(get_db), current=Depends(get_state)):
    districts = db.query(District).filter(District.state_id == current.state_id).all()
    district_ids = [d.id for d in districts]
    zones = db.query(Zone).filter(Zone.district_id.in_(district_ids)).all()
    zone_ids = [z.id for z in zones]
    units = db.query(Unit).filter(Unit.zone_id.in_(zone_ids)).all()
    unit_ids = [u.id for u in units]
    centers = db.query(Center).filter(Center.unit_id.in_(unit_ids)).all()
    center_ids = [c.id for c in centers]
    students = db.query(Student).filter(Student.center_id.in_(center_ids)).count()
    faculty = db.query(Faculty).filter(Faculty.unit_id.in_(unit_ids)).count()
    return {
        "districts": len(districts), "zones": len(zones),
        "units": len(units), "centers": len(centers),
        "students": students, "faculty": faculty,
    }
