from sqlalchemy import Column, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base


faculty_centers = Table(
    'faculty_centers', Base.metadata,
    Column('faculty_id', Integer, ForeignKey('faculties.id', ondelete="CASCADE"), primary_key=True),
    Column('center_id', Integer, ForeignKey('centers.id', ondelete="CASCADE"), primary_key=True)
)


class Faculty(Base):
    __tablename__ = "faculties"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id"),    nullable=False, unique=True)
    unit_id   = Column(Integer, ForeignKey("units.id"),    nullable=False)

    user    = relationship("User",   back_populates="faculty")
    centers = relationship("Center", secondary=faculty_centers, back_populates="faculties")
    unit    = relationship("Unit",   foreign_keys=[unit_id])
