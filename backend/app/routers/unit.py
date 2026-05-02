from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional
from app.database import get_db
from app.core.deps import get_unit
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import User
from app.models.hierarchy import Unit
from app.models.center import Center
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.submission import CenterSubmission, SubmissionStatus
from app.models.attendance import Attendance
from app.schemas.schemas import StudentCreate, StudentOut, FacultyCreate, FacultyOut, CenterCreate, CenterOut
from app.schemas.data_schemas import AttendanceCreate, AttendanceOut

router = APIRouter(prefix="/unit", tags=["Unit"])


def generate_reg_number(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = settings.REG_NUMBER_PREFIX
    last = db.query(Student).order_by(Student.id.desc()).first()
    seq = (last.id + 1) if last else 1
    return f"{prefix}/{seq:03d}/{year}"


# ── Centers ────────────────────────────────────────────────────────────────────
@router.post("/centers", response_model=CenterOut)
def create_center(data: CenterCreate, db: Session = Depends(get_db), current=Depends(get_unit)):
    center = Center(**data.model_dump(), )
    center.name = data.name.upper()
    db.add(center)
    db.flush()
    # Auto-create submission
    submission = CenterSubmission(center_id=center.id, unit_id=current.unit_id, status=SubmissionStatus.NEW)
    db.add(submission)
    db.commit()
    db.refresh(center)
    return center


@router.get("/centers")
def list_centers(db: Session = Depends(get_db), current=Depends(get_unit)):
    centers = db.query(Center).filter(Center.unit_id == current.unit_id).all()
    result = []
    for c in centers:
        sub = db.query(CenterSubmission).filter(CenterSubmission.center_id == c.id).first()
        result.append({
            "id": c.id, "name": c.name, "place": c.place,
            "phone_office": c.phone_office,
            "submission_status": sub.status if sub else None,
            "rejection_reason": sub.rejection_reason if sub else None,
        })
    return result


@router.get("/submissions")
def list_submissions(db: Session = Depends(get_db), current=Depends(get_unit)):
    subs = db.query(CenterSubmission).filter(CenterSubmission.unit_id == current.unit_id).all()
    result = []
    for s in subs:
        center = db.query(Center).filter(Center.id == s.center_id).first()
        result.append({
            "id": s.id, "center_name": center.name if center else "",
            "status": s.status, "rejection_reason": s.rejection_reason,
            "submitted_at": s.submitted_at,
        })
    return result


# ── Students ───────────────────────────────────────────────────────────────────
@router.post("/students", response_model=StudentOut)
def create_student(data: StudentCreate, db: Session = Depends(get_db), current=Depends(get_unit)):
    # Verify center belongs to this unit
    center = db.query(Center).filter(Center.id == data.center_id, Center.unit_id == current.unit_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found in your unit")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=data.name, email=data.email, phone=data.phone,
                hashed_password=hash_password(data.password), role="student",
                unit_id=current.unit_id)
    db.add(user)
    db.flush()
    reg_number = generate_reg_number(db)
    student = Student(user_id=user.id, reg_number=reg_number,
                      center_id=data.center_id, unit_id=current.unit_id,
                      class_name=data.class_name)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/students")
def list_students(db: Session = Depends(get_db), current=Depends(get_unit)):
    students = db.query(Student).filter(Student.unit_id == current.unit_id).all()
    return [
        {"id": s.id, "name": s.user.name, "reg_number": s.reg_number,
         "center": s.center.name, "class_name": s.class_name}
        for s in students
    ]


# ── Faculty ────────────────────────────────────────────────────────────────────
@router.post("/faculty", response_model=FacultyOut)
def create_faculty(data: FacultyCreate, db: Session = Depends(get_db), current=Depends(get_unit)):
    center = db.query(Center).filter(Center.id == data.center_id, Center.unit_id == current.unit_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found in your unit")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=data.name, email=data.email, phone=data.phone,
                hashed_password=hash_password(data.password), role="faculty",
                unit_id=current.unit_id)
    db.add(user)
    db.flush()
    faculty = Faculty(user_id=user.id, center_id=data.center_id, unit_id=current.unit_id)
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


@router.get("/faculty")
def list_faculty(db: Session = Depends(get_db), current=Depends(get_unit)):
    faculty_list = db.query(Faculty).filter(Faculty.unit_id == current.unit_id).all()
    return [
        {"id": f.id, "name": f.user.name, "email": f.user.email, "center": f.center.name}
        for f in faculty_list
    ]


# ── Attendance ─────────────────────────────────────────────────────────────────
@router.post("/attendance")
def mark_attendance(data: List[AttendanceCreate], db: Session = Depends(get_db), current=Depends(get_unit)):
    for item in data:
        existing = db.query(Attendance).filter(
            Attendance.student_id == item.student_id,
            Attendance.date == item.date
        ).first()
        if existing:
            existing.status = item.status
        else:
            att = Attendance(student_id=item.student_id, date=item.date,
                             status=item.status, marked_by=current.id)
            db.add(att)
    db.commit()
    return {"message": "Attendance marked"}


@router.get("/attendance/{student_id}")
def get_attendance(student_id: int, db: Session = Depends(get_db), current=Depends(get_unit)):
    student = db.query(Student).filter(Student.id == student_id, Student.unit_id == current.unit_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    return [{"date": str(r.date), "status": r.status} for r in records]


@router.get("/stats")
def unit_stats(db: Session = Depends(get_db), current=Depends(get_unit)):
    centers = db.query(Center).filter(Center.unit_id == current.unit_id).count()
    students = db.query(Student).filter(Student.unit_id == current.unit_id).count()
    faculty = db.query(Faculty).filter(Faculty.unit_id == current.unit_id).count()
    return {"centers": centers, "students": students, "faculty": faculty}
