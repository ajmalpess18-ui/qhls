from app.database import SessionLocal
from app.models.user import User
from app.models.hierarchy import State

db = SessionLocal()

# Check if a state exists
state = db.query(State).first()
if not state:
    state = State(name="Kerala")
    db.add(state)
    db.commit()
    db.refresh(state)

# Assign state to state@qhls.com
user = db.query(User).filter(User.email == "state@qhls.com").first()
if user:
    user.state_id = state.id
    db.commit()
    print("Fixed state_id for state@qhls.com")
else:
    print("User state@qhls.com not found")

db.close()
