from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ResultOut(BaseModel):
    id: int
    student_id: int
    exam_name: str
    subject: str
    marks: float
    total_marks: float
    grade: Optional[str]
    created_at: datetime
    class Config: from_attributes = True


class ResultCreate(BaseModel):
    student_id: int
    exam_name: str
    subject: str
    marks: float
    total_marks: float = 100
    grade: Optional[str] = None


class MaterialOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    file_url: str
    class_name: Optional[str]
    created_at: datetime
    class Config: from_attributes = True


class AttendanceCreate(BaseModel):
    student_id: int
    date: date
    status: str  # "present" | "absent"


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    date: date
    status: str
    class Config: from_attributes = True


class SubmissionOut(BaseModel):
    id: int
    center_id: int
    unit_id: int
    status: str
    rejection_reason: Optional[str]
    submitted_at: datetime
    class Config: from_attributes = True


class SubmissionReview(BaseModel):
    status: str       # APPROVED | REJECTED | REMOVED
    rejection_reason: Optional[str] = None


class AnnouncementCreate(BaseModel):
    title: str
    body: str


class AnnouncementOut(BaseModel):
    id: int
    title: str
    body: str
    created_at: datetime
    class Config: from_attributes = True
