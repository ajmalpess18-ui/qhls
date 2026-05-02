import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import engine, Base
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE faculties DROP COLUMN center_id CASCADE;"))
        conn.commit()
        print("Dropped center_id column from faculties table.")
    except Exception as e:
        print(f"Error dropping column (may already be dropped): {e}")

# Create new tables (like faculty_centers)
Base.metadata.create_all(bind=engine)
print("Created missing tables.")
