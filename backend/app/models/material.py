from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String, nullable=False)
    description  = Column(String, nullable=True)
    file_url     = Column(String, nullable=False)   # path on server disk
    class_name   = Column(String, nullable=True)    # e.g. "Class 1" or "All"
    uploaded_by  = Column(Integer, ForeignKey("users.id"), nullable=True)  # state user
    created_at   = Column(DateTime, default=datetime.utcnow)

    uploaded_by_user = relationship("User", foreign_keys=[uploaded_by])
