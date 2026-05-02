from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_student
from app.models.student import Student
from app.models.result import ExamResult
from app.models.attendance import Attendance
from app.models.material import StudyMaterial
from app.models.announcement import Announcement

router = APIRouter(prefix="/student", tags=["Student"])


@router.get("/profile")
def my_profile(db: Session = Depends(get_db), current=Depends(get_student)):
    student = db.query(Student).filter(Student.user_id == current.id).first()
    if not student:
        return {"name": current.name, "email": current.email}
    return {
        "name": current.name,
        "email": current.email,
        "reg_number": student.reg_number,
        "class_name": student.class_name,
        "center": student.center.name if student.center else None,
        "unit": student.unit.name if student.unit else None,
    }


@router.get("/results")
def my_results(db: Session = Depends(get_db), current=Depends(get_student)):
    student = db.query(Student).filter(Student.user_id == current.id).first()
    if not student:
        return []
    results = db.query(ExamResult).filter(ExamResult.student_id == student.id).all()
    return [
        {"exam_name": r.exam_name, "subject": r.subject,
         "marks": r.marks, "total_marks": r.total_marks,
         "grade": r.grade, "date": r.created_at.strftime("%Y-%m-%d")}
        for r in results
    ]


@router.get("/attendance")
def my_attendance(db: Session = Depends(get_db), current=Depends(get_student)):
    student = db.query(Student).filter(Student.user_id == current.id).first()
    if not student:
        return []
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    total = len(records)
    present = sum(1 for r in records if r.status == "present")
    return {
        "total": total,
        "present": present,
        "absent": total - present,
        "percentage": round((present / total * 100), 1) if total > 0 else 0,
        "records": [{"date": str(r.date), "status": r.status} for r in records],
    }


@router.get("/materials")
def my_materials(db: Session = Depends(get_db), current=Depends(get_student)):
    student = db.query(Student).filter(Student.user_id == current.id).first()
    class_name = student.class_name if student else None
    from sqlalchemy import or_
    query = db.query(StudyMaterial)
    if class_name:
        query = query.filter(or_(StudyMaterial.class_name == class_name, StudyMaterial.class_name == None))
    materials = query.order_by(StudyMaterial.created_at.desc()).all()
    return [
        {"id": m.id, "title": m.title, "description": m.description,
         "class_name": m.class_name, "file_url": f"/public/materials/{m.id}/download",
         "created_at": m.created_at.strftime("%Y-%m-%d")}
        for m in materials
    ]


@router.get("/announcements")
def my_announcements(db: Session = Depends(get_db), _=Depends(get_student)):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).limit(20).all()
