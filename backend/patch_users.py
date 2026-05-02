import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.hierarchy import Zone

db = SessionLocal()

unit_admins = db.query(User).filter(User.role == "unit").all()
for ua in unit_admins:
    if ua.district_id is None and ua.zone_id is not None:
        zone = db.query(Zone).filter(Zone.id == ua.zone_id).first()
        if zone:
            ua.district_id = zone.district_id
            db.commit()
            print(f"Patched unit admin {ua.email} with district_id {zone.district_id}")

zone_admins = db.query(User).filter(User.role == "zone").all()
for za in zone_admins:
    if za.district_id is None and za.zone_id is not None:
        zone = db.query(Zone).filter(Zone.id == za.zone_id).first()
        if zone:
            za.district_id = zone.district_id
            db.commit()
            print(f"Patched zone admin {za.email} with district_id {zone.district_id}")

db.close()
