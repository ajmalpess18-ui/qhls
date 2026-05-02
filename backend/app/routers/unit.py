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
from app.schemas.schemas import StudentCreate, StudentUpdate, StudentOut, FacultyCreate, FacultyUpdate, FacultyOut, CenterCreate, CenterOut
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
    center_data = data.model_dump()
    center_data["district_id"] = current.district_id
    center_data["zone_id"] = current.zone_id
    center_data["unit_id"] = current.unit_id
    center = Center(**center_data)
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
    
    # Verify center is APPROVED
    sub = db.query(CenterSubmission).filter(CenterSubmission.center_id == center.id).first()
    if not sub or sub.status != SubmissionStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Center must be approved by the State before adding students")
        
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
         "center": s.center.name, "center_id": s.center_id, "email": s.user.email, "phone": s.user.phone, "class_name": s.class_name}
        for s in students
    ]

@router.put("/students/{student_id}", response_model=StudentOut)
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db), current=Depends(get_unit)):
    student = db.query(Student).filter(Student.id == student_id, Student.unit_id == current.unit_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    center = db.query(Center).filter(Center.id == data.center_id, Center.unit_id == current.unit_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found in your unit")
    
    sub = db.query(CenterSubmission).filter(CenterSubmission.center_id == center.id).first()
    if not sub or sub.status != SubmissionStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Center must be approved by the State before adding students")
        
    if student.user.email != data.email:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
            
    student.user.name = data.name
    student.user.email = data.email
    student.user.phone = data.phone
    if data.password:
        student.user.hashed_password = hash_password(data.password)
        
    student.center_id = data.center_id
    student.class_name = data.class_name
    db.commit()
    db.refresh(student)
    return student


@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), current=Depends(get_unit)):
    student = db.query(Student).filter(Student.id == student_id, Student.unit_id == current.unit_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    user = student.user
    db.delete(student)
    db.delete(user)
    db.commit()
    return {"message": "Deleted"}



# ── Faculty ────────────────────────────────────────────────────────────────────
@router.post("/faculty", response_model=FacultyOut)
def create_faculty(data: FacultyCreate, db: Session = Depends(get_db), current=Depends(get_unit)):
    centers = db.query(Center).filter(Center.id.in_(data.center_ids), Center.unit_id == current.unit_id).all()
    if not centers or len(centers) != len(data.center_ids):
        raise HTTPException(status_code=404, detail="One or more centers not found in your unit")
        
    # Verify all assigned centers are APPROVED
    for center in centers:
        sub = db.query(CenterSubmission).filter(CenterSubmission.center_id == center.id).first()
        if not sub or sub.status != SubmissionStatus.APPROVED:
            raise HTTPException(status_code=400, detail=f"Center '{center.name}' must be approved by the State before assigning faculty")

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=data.name, email=data.email, phone=data.phone,
                hashed_password=hash_password(data.password), role="faculty",
                unit_id=current.unit_id)
    db.add(user)
    db.flush()
    faculty = Faculty(user_id=user.id, unit_id=current.unit_id)
    faculty.centers = centers
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    
    # We must explicitly populate center_ids for the response schema
    faculty_out = FacultyOut.model_validate(faculty)
    faculty_out.center_ids = [c.id for c in faculty.centers]
    return faculty_out


@router.get("/faculty")
def list_faculty(db: Session = Depends(get_db), current=Depends(get_unit)):
    faculty_list = db.query(Faculty).filter(Faculty.unit_id == current.unit_id).all()
    return [
        {"id": f.id, "name": f.user.name, "email": f.user.email, "phone": f.user.phone, "center_ids": [c.id for c in f.centers], "center": ", ".join(c.name for c in f.centers)}
        for f in faculty_list
    ]

@router.put("/faculty/{faculty_id}", response_model=FacultyOut)
def update_faculty(faculty_id: int, data: FacultyUpdate, db: Session = Depends(get_db), current=Depends(get_unit)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id, Faculty.unit_id == current.unit_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    centers = db.query(Center).filter(Center.id.in_(data.center_ids), Center.unit_id == current.unit_id).all()
    if not centers or len(centers) != len(data.center_ids):
        raise HTTPException(status_code=404, detail="One or more centers not found in your unit")
        
    for center in centers:
        sub = db.query(CenterSubmission).filter(CenterSubmission.center_id == center.id).first()
        if not sub or sub.status != SubmissionStatus.APPROVED:
            raise HTTPException(status_code=400, detail=f"Center '{center.name}' must be approved by the State before assigning faculty")

    if faculty.user.email != data.email:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

    faculty.user.name = data.name
    faculty.user.email = data.email
    faculty.user.phone = data.phone
    if data.password:
        faculty.user.hashed_password = hash_password(data.password)

    faculty.centers = centers
    db.commit()
    db.refresh(faculty)
    
    faculty_out = FacultyOut.model_validate(faculty)
    faculty_out.center_ids = [c.id for c in faculty.centers]
    return faculty_out


@router.delete("/faculty/{faculty_id}")
def delete_faculty(faculty_id: int, db: Session = Depends(get_db), current=Depends(get_unit)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id, Faculty.unit_id == current.unit_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    user = faculty.user
    db.delete(faculty)
    db.delete(user)
    db.commit()
    return {"message": "Deleted"}


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
