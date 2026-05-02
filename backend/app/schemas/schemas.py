from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, time
from enum import Enum


class FacilityTypeEnum(str, Enum):
    own_building    = "own_building"
    rented_building = "rented_building"
    mosque          = "mosque"
    madrasa         = "madrasa"
    other           = "other"


# ── Hierarchy schemas ──────────────────────────────────────────────────────────
class StateCreate(BaseModel):
    name: str

class StateOut(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    class Config: from_attributes = True


class DistrictCreate(BaseModel):
    name: str
    state_id: int

class DistrictOut(BaseModel):
    id: int
    name: str
    state_id: int
    code: Optional[str] = None
    district_number: Optional[int] = None
    class Config: from_attributes = True


class ZoneCreate(BaseModel):
    name: str
    district_id: Optional[int] = None

class ZoneOut(BaseModel):
    id: int
    name: str
    district_id: int
    class Config: from_attributes = True


class UnitCreate(BaseModel):
    name: str
    zone_id: Optional[int] = None

class UnitOut(BaseModel):
    id: int
    name: str
    zone_id: int
    class Config: from_attributes = True


# ── Center schemas ──────────────────────────────────────────────────────────────
class CenterCreate(BaseModel):
    name: str
    district_id: int
    zone_id: int
    unit_id: int
    place: str
    post: str
    pin: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: str = "India"
    state_name: str
    local_body_type: Optional[str] = None
    local_body_name: Optional[str] = None
    phone_office: str
    email: Optional[EmailStr] = None
    facility_type: FacilityTypeEnum
    class_date: Optional[date] = None
    class_time: Optional[time] = None
    faculty_name: Optional[str] = None
    faculty_number: Optional[str] = None
    coordinator_name: Optional[str] = None
    coordinator_number: Optional[str] = None
    convener_name: Optional[str] = None
    convener_number: Optional[str] = None
    nfe_convener_name: Optional[str] = None
    nfe_convener_number: Optional[str] = None


class CenterOut(CenterCreate):
    id: int
    class Config: from_attributes = True


# ── Student schemas ────────────────────────────────────────────────────────────
class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    center_id: int
    class_name: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    reg_number: str
    class_name: Optional[str]
    user_id: int
    center_id: int
    unit_id: int
    class Config: from_attributes = True


# ── Faculty schemas ────────────────────────────────────────────────────────────
class FacultyCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    center_id: int


class FacultyOut(BaseModel):
    id: int
    user_id: int
    center_id: int
    unit_id: int
    class Config: from_attributes = True


# ── User creation schemas ──────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    state_id: Optional[int] = None
    district_id: Optional[int] = None
    zone_id: Optional[int] = None
    unit_id: Optional[int] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    state_id: Optional[int] = None
    district_id: Optional[int] = None
    zone_id: Optional[int] = None
    unit_id: Optional[int] = None
    class Config: from_attributes = True
