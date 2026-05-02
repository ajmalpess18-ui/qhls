from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, Date, Time
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class FacilityType(str, enum.Enum):
    own_building    = "own_building"
    rented_building = "rented_building"
    mosque          = "mosque"
    madrasa         = "madrasa"
    other           = "other"


class Center(Base):
    __tablename__ = "centers"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)  # UPPERCASE English

    # Hierarchy
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    zone_id     = Column(Integer, ForeignKey("zones.id"),     nullable=False)
    unit_id     = Column(Integer, ForeignKey("units.id"),     nullable=False)

    # Address
    place           = Column(String, nullable=False)
    post            = Column(String, nullable=False)
    pin             = Column(String, nullable=False)
    latitude        = Column(Float, nullable=True)
    longitude       = Column(Float, nullable=True)
    country         = Column(String, nullable=False, default="India")
    state_name      = Column(String, nullable=False)
    local_body_type = Column(String, nullable=True)
    local_body_name = Column(String, nullable=True)
    phone_office    = Column(String, nullable=False)
    email           = Column(String, nullable=True)

    # Physical facility
    facility_type   = Column(Enum(FacilityType), nullable=False)

    # Schedule
    class_date = Column(Date, nullable=True)
    class_time = Column(Time, nullable=True)

    # Staff
    faculty_name         = Column(String, nullable=True)
    faculty_number       = Column(String, nullable=True)
    coordinator_name     = Column(String, nullable=True)
    coordinator_number   = Column(String, nullable=True)
    convener_name        = Column(String, nullable=True)   # QHLS Convener
    convener_number      = Column(String, nullable=True)
    nfe_convener_name    = Column(String, nullable=True)   # Non-Formal Education Convener
    nfe_convener_number  = Column(String, nullable=True)

    # Relationships
    unit       = relationship("Unit",     back_populates="centers")
    district   = relationship("District", foreign_keys=[district_id])
    zone       = relationship("Zone",     foreign_keys=[zone_id])
    students   = relationship("Student",  back_populates="center")
    faculties  = relationship("Faculty",  secondary="faculty_centers", back_populates="centers")
    submission = relationship("CenterSubmission", back_populates="center", uselist=False)
