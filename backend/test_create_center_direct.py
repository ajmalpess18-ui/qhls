import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.schemas.schemas import CenterCreate
from app.routers.unit import create_center

db = SessionLocal()

unit_admin = db.query(User).filter(User.role == "unit").first()
if not unit_admin:
    print("No unit admin found.")
    sys.exit(1)

payload = {
    "name": "NHIUJB",
    "place": "jb",
    "post": "hvy",
    "pin": "432",
    "country": "India",
    "state_name": "fgd",
    "local_body_type": "Panchayat",
    "local_body_name": "trhre",
    "phone_office": "1234567890",
    "email": "ajmalpess18@gmail.com",
    "latitude": 67.0,
    "longitude": 65.0,
    "facility_type": "own_building",
    "class_date": "2026-05-08",
    "class_time": "10:52",
    "faculty_name": "gndfdgs",
    "faculty_number": "1234567890",
    "coordinator_name": "gnfbd",
    "coordinator_number": "1234567890",
    "convener_name": "dfbds",
    "convener_number": "1234567890",
    "nfe_convener_name": "hfsdg",
    "nfe_convener_number": "1234567890"
}

data = CenterCreate(**payload)

try:
    result = create_center(data=data, db=db, current=unit_admin)
    print("Success:", result)
except Exception as e:
    import traceback
    traceback.print_exc()

db.close()
