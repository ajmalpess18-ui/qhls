import sys
import os
import urllib.request
import urllib.error
import json

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.center import Center
from app.core.security import create_access_token

db = SessionLocal()

unit_admin = db.query(User).filter(User.role == "unit").first()
if not unit_admin:
    print("No unit admin found.")
    sys.exit(1)

centers = db.query(Center).filter(Center.unit_id == unit_admin.unit_id).all()
if not centers:
    print("No centers found.")
    sys.exit(1)

access_token = create_access_token(
    data={"sub": str(unit_admin.id), "role": "unit"}
)

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

payload = {
    "name": "Test Faculty",
    "email": "facultytest@qhls.com",
    "phone": "0987654321",
    "password": "password123",
    "center_ids": [c.id for c in centers]
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/unit/faculty", data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.status}")
        print(f"Response: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    print(f"Response: {e.read().decode('utf-8')}")

db.close()
