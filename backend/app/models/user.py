from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    admin    = "admin"
    state    = "state"
    district = "district"
    zone     = "zone"
    unit     = "unit"
    faculty  = "faculty"
    student  = "student"


class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String, nullable=False)
    email          = Column(String, unique=True, index=True, nullable=False)
    phone          = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role           = Column(Enum(UserRole), nullable=False)
    is_active      = Column(Boolean, default=True)
    reg_code       = Column(String, unique=True, index=True, nullable=True)  # Format: KR01/0001/2026

    # Optional FK to hierarchy level based on role
    state_id    = Column(Integer, ForeignKey("states.id"),    nullable=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    zone_id     = Column(Integer, ForeignKey("zones.id"),     nullable=True)
    unit_id     = Column(Integer, ForeignKey("units.id"),     nullable=True)

    # Relationships
    state    = relationship("State",    foreign_keys=[state_id])
    district = relationship("District", foreign_keys=[district_id])
    zone     = relationship("Zone",     foreign_keys=[zone_id])
    unit     = relationship("Unit",     foreign_keys=[unit_id])
    student  = relationship("Student",  back_populates="user", uselist=False)
    faculty  = relationship("Faculty",  back_populates="user", uselist=False)
