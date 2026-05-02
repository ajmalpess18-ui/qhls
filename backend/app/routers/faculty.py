from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_faculty
from app.models.faculty import Faculty
from app.models.center import Center
from app.models.student import Student

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get("/centers")
def my_centers(db: Session = Depends(get_db), current=Depends(get_faculty)):
    faculty = db.query(Faculty).filter(Faculty.user_id == current.id).first()
    if not faculty:
        return []
    center = db.query(Center).filter(Center.id == faculty.center_id).first()
    if not center:
        return []
    student_count = db.query(Student).filter(Student.center_id == center.id).count()
    return [{
        "id": center.id,
        "name": center.name,
        "place": center.place,
        "phone_office": center.phone_office,
        "email": center.email,
        "facility_type": center.facility_type,
        "class_date": str(center.class_date) if center.class_date else None,
        "class_time": str(center.class_time) if center.class_time else None,
        "student_count": student_count,
    }]


@router.get("/profile")
def faculty_profile(current=Depends(get_faculty)):
    return {
        "id": current.id,
        "name": current.name,
        "email": current.email,
        "role": current.role,
    }
