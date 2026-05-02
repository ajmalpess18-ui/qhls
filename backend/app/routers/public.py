from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student import Student
from app.models.result import ExamResult
from app.models.material import StudyMaterial
import os

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/result/{reg_number}")
def check_result(reg_number: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.reg_number == reg_number).first()
    if not student:
        raise HTTPException(status_code=404, detail="No student found with this registration number")

    results = db.query(ExamResult).filter(ExamResult.student_id == student.id).all()

    return {
        "student": {
            "name": student.user.name,
            "reg_number": student.reg_number,
            "class_name": student.class_name,
            "center": student.center.name if student.center else None,
            "unit": student.unit.name if student.unit else None,
        },
        "results": [
            {
                "exam_name": r.exam_name,
                "subject": r.subject,
                "marks": r.marks,
                "total_marks": r.total_marks,
                "grade": r.grade,
                "date": r.created_at.strftime("%Y-%m-%d"),
            }
            for r in results
        ],
    }


@router.get("/materials")
def list_materials(class_name: str = None, db: Session = Depends(get_db)):
    query = db.query(StudyMaterial)
    if class_name:
        query = query.filter(StudyMaterial.class_name == class_name)
    materials = query.order_by(StudyMaterial.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "class_name": m.class_name,
            "file_url": f"/public/materials/{m.id}/download",
            "created_at": m.created_at.strftime("%Y-%m-%d"),
        }
        for m in materials
    ]


@router.get("/materials/{material_id}/download")
def download_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material or not os.path.exists(material.file_url):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(material.file_url, media_type="application/pdf",
                        filename=os.path.basename(material.file_url))
