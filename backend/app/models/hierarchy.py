from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class State(Base):
    __tablename__ = "states"
    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String(5), nullable=True)  # e.g. "KR"
    districts = relationship("District", back_populates="state")


class District(Base):
    __tablename__ = "districts"
    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False)
    state_id        = Column(Integer, ForeignKey("states.id"), nullable=False)
    code            = Column(String(10), nullable=True)   # e.g. "KR01"
    district_number = Column(Integer, nullable=True)      # e.g. 1
    state           = relationship("State", back_populates="districts")
    zones           = relationship("Zone", back_populates="district")


class Zone(Base):
    __tablename__ = "zones"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    district    = relationship("District", back_populates="zones")
    units       = relationship("Unit", back_populates="zone")


class Unit(Base):
    __tablename__ = "units"
    id      = Column(Integer, primary_key=True, index=True)
    name    = Column(String, nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    zone    = relationship("Zone", back_populates="units")
    centers = relationship("Center", back_populates="unit")
