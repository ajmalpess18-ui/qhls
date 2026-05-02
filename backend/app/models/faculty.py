from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Faculty(Base):
    __tablename__ = "faculties"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id"),    nullable=False, unique=True)
    center_id = Column(Integer, ForeignKey("centers.id"),  nullable=False)
    unit_id   = Column(Integer, ForeignKey("units.id"),    nullable=False)

    user   = relationship("User",   back_populates="faculty")
    center = relationship("Center", back_populates="faculties")
    unit   = relationship("Unit",   foreign_keys=[unit_id])
