from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum


class SubmissionStatus(str, enum.Enum):
    NEW      = "NEW"
    IN_LIST  = "IN_LIST"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REMOVED  = "REMOVED"


class CenterSubmission(Base):
    __tablename__ = "center_submissions"

    id               = Column(Integer, primary_key=True, index=True)
    center_id        = Column(Integer, ForeignKey("centers.id"), nullable=False, unique=True)
    unit_id          = Column(Integer, ForeignKey("units.id"),   nullable=False)
    state_id         = Column(Integer, ForeignKey("states.id"),  nullable=True)  # reviewed by
    status           = Column(Enum(SubmissionStatus), default=SubmissionStatus.NEW, nullable=False)
    rejection_reason = Column(String, nullable=True)
    submitted_at     = Column(DateTime, default=datetime.utcnow)
    reviewed_at      = Column(DateTime, nullable=True)

    center = relationship("Center", back_populates="submission")
    unit   = relationship("Unit",   foreign_keys=[unit_id])
    state  = relationship("State",  foreign_keys=[state_id])
