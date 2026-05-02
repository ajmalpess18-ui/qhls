from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class ExamResult(Base):
    __tablename__ = "exam_results"

    id           = Column(Integer, primary_key=True, index=True)
    student_id   = Column(Integer, ForeignKey("students.id"), nullable=False)
    exam_name    = Column(String, nullable=False)   # e.g. "Midterm 2024", "Final 2024"
    subject      = Column(String, nullable=False)
    marks        = Column(Float,  nullable=False)
    total_marks  = Column(Float,  nullable=False, default=100)
    grade        = Column(String, nullable=True)    # e.g. A, B, C, Distinction
    uploaded_by  = Column(Integer, ForeignKey("users.id"), nullable=True)  # state user
    created_at   = Column(DateTime, default=datetime.utcnow)

    student      = relationship("Student", back_populates="results")
    uploaded_by_user = relationship("User", foreign_keys=[uploaded_by])
