from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    reg_number = Column(String, unique=True, index=True, nullable=False)
    center_id  = Column(Integer, ForeignKey("centers.id"), nullable=False)
    unit_id    = Column(Integer, ForeignKey("units.id"),   nullable=False)
    class_name = Column(String, nullable=True)  # e.g. "Class 1", "Class 2"

    user    = relationship("User",   back_populates="student")
    center  = relationship("Center", back_populates="students")
    unit    = relationship("Unit",   foreign_keys=[unit_id])
    results     = relationship("ExamResult",  back_populates="student")
    attendances = relationship("Attendance",  back_populates="student")
