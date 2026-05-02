from sqlalchemy import Column, Integer, String, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent  = "absent"


class Attendance(Base):
    __tablename__ = "attendance"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False)
    date        = Column(Date, nullable=False)
    status      = Column(Enum(AttendanceStatus), nullable=False)
    marked_by   = Column(Integer, ForeignKey("users.id"), nullable=True)  # unit user

    student    = relationship("Student",  back_populates="attendances")
    marker     = relationship("User",     foreign_keys=[marked_by])
