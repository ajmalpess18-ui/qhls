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

district_admin = db.query(User).filter(User.role == "district").first()
if not district_admin:
    print("No district admin found.")
    sys.exit(1)

access_token = create_access_token(
    data={"sub": str(district_admin.id), "role": "district"}
)

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

from app.models.hierarchy import Zone
zone = db.query(Zone).filter(Zone.district_id == district_admin.district_id).first()

if not zone:
    zone = Zone(name="Test Zone", district_id=district_admin.district_id)
    db.add(zone)
    db.commit()
    db.refresh(zone)

payload = {"name": "iritty"}
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(f"http://127.0.0.1:8000/district/zones/{zone.id}", data=data, headers=headers, method="PUT")

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.status}")
        print(f"Response: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    print(f"Response: {e.read().decode('utf-8')}")

db.close()
