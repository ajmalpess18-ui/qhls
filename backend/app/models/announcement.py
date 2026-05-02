from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Announcement(Base):
    __tablename__ = "announcements"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    body        = Column(String, nullable=False)
    posted_by   = Column(Integer, ForeignKey("users.id"), nullable=True)  # state user
    created_at  = Column(DateTime, default=datetime.utcnow)

    posted_by_user = relationship("User", foreign_keys=[posted_by])
