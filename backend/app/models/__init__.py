# Import all models so SQLAlchemy registers them before create_all
from app.models.user import User
from app.models.hierarchy import State, District, Zone, Unit
from app.models.center import Center
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.submission import CenterSubmission
from app.models.result import ExamResult
from app.models.material import StudyMaterial
from app.models.attendance import Attendance
from app.models.announcement import Announcement
