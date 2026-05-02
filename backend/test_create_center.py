import sys
import os
import urllib.request
import urllib.error
import json

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

db = SessionLocal()

# Find a unit admin
unit_admin = db.query(User).filter(User.role == "unit").first()
if not unit_admin:
    print("No unit admin found.")
    sys.exit(1)

access_token = create_access_token(
    data={"sub": str(unit_admin.id), "role": "unit"}
)

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

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

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/unit/centers", data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.status}")
        print(f"Response: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    print(f"Response: {e.read().decode('utf-8')}")

db.close()
