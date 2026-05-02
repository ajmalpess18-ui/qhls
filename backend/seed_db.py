import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.hierarchy import State, District
# Need to import all models so Base knows about them before create_all
from app.models.announcement import Announcement
from app.models.attendance import Attendance
from app.models.center import Center
from app.models.faculty import Faculty
from app.models.material import StudyMaterial
from app.models.result import ExamResult
from app.models.student import Student
from app.models.submission import CenterSubmission

from app.core.security import hash_password

def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create Admin User
        admin_email = "admin@qhls.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                name="Super Admin",
                email=admin_email,
                phone="0000000000",
                hashed_password=hash_password("Admin@123"),
                role=UserRole.admin,
                is_active=True,
                reg_code="ADMIN001"
            )
            db.add(admin_user)
            print(f"Created Admin user: {admin_email} / Admin@123")
        else:
            print(f"Admin user already exists: {admin_email}")

        # 2. Create State (Kerala)
        state = db.query(State).filter(State.code == "KR").first()
        if not state:
            state = State(name="Kerala", code="KR")
            db.add(state)
            db.commit()
            db.refresh(state)
            print("Created State: Kerala (KR)")
        else:
            print("State Kerala (KR) already exists.")

        # 3. Create 14 Districts
        districts_data = [
            ("Thiruvananthapuram", "KR01", 1),
            ("Kollam", "KR02", 2),
            ("Pathanamthitta", "KR03", 3),
            ("Alappuzha", "KR04", 4),
            ("Kottayam", "KR05", 5),
            ("Idukki", "KR06", 6),
            ("Ernakulam", "KR07", 7),
            ("Thrissur", "KR08", 8),
            ("Palakkad", "KR09", 9),
            ("Malappuram", "KR10", 10),
            ("Kozhikode", "KR11", 11),
            ("Wayanad", "KR12", 12),
            ("Kannur", "KR13", 13),
            ("Kasaragod", "KR14", 14),
        ]

        for name, code, num in districts_data:
            district = db.query(District).filter(District.code == code).first()
            if not district:
                district = District(
                    name=name,
                    state_id=state.id,
                    code=code,
                    district_number=num
                )
                db.add(district)
                print(f"Created District: {name} ({code})")
            else:
                print(f"District already exists: {name} ({code})")

        db.commit()
        print("Database seeding completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
