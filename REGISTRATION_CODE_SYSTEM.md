# Registration Code System - Updated Implementation

## Overview
Implemented a hierarchical registration code system with state, district, zone, and unit management.

## Registration Code Format
```
STATECODE + DISTRICTCODE + UNITCODE / STUDENTNUMBER / YEAR - STUDENTNUMBER
Example: KR0101/0001/2026-0001
```

- **STATECODE**: 2-letter state code (KR for Kerala)
- **DISTRICTCODE**: 2-digit district number (01-14)
- **UNITCODE**: 2-digit unit number (01-99)
- **STUDENTNUMBER**: Auto-incrementing per unit per year (0001, 0002, etc.)
- **YEAR**: Current year

---

## Hierarchy Structure

```
State (Kerala - KR)
├── District (14 total - Trivandrum, Kollam, etc.)
│   ├── Zone (4 zones per district)
│   │   ├── Unit (3 units per zone)
│   │   │   ├── Center (Physical study centers)
│   │   │   └── Students
```

**Example for Trivandrum:**
- District: Trivandrum (Code: KR01)
- Zone 1: Trivandrum Zone 1
  - Unit 1: Trivandrum-Z1-U1 (Unit Admin: trivandrum-z1u1@qhls.org)
  - Unit 2: Trivandrum-Z1-U2 (Unit Admin: trivandrum-z1u2@qhls.org)
  - Unit 3: Trivandrum-Z1-U3 (Unit Admin: trivandrum-z1u3@qhls.org)
- Zone 2, 3, 4 (similar structure)

---

## Implementation Details

### 1. **User Model Updates** (`app/models/user.py`)
- Added `reg_code` field to store registration codes (unique)
- Format example: `KR0101/0001/2026-0001`

### 2. **Hierarchy Models** (`app/models/hierarchy.py`)
- **State**: State name
- **District**: District name + state_id
- **Zone**: Zone name + district_id
- **Unit**: Unit name + zone_id

### 3. **Registration Code Utility** (`app/core/reg_codes.py`)
**Key Functions:**
- `generate_reg_code(db, state_name, district_name, unit_name)` - Generates unique reg codes
- `parse_reg_code(reg_code)` - Parses and validates reg codes
- `get_state_code(state_name)` - Maps state names to codes
- `get_district_number(state_name, district_name)` - Maps districts to numbers

**State Configuration (Expandable):**
```python
Kerala:
  - Code: KR
  - 14 Districts with 4 Zones each, 3 Units per Zone
```

### 4. **Student Creation Endpoint** (`app/routers/auth.py`)
**Endpoint:** `POST /auth/create-user`

**Features:**
- Only **Unit Admins** can create students
- Automatic registration code generation for students
- Student records created automatically with reg number
- Automatic hierarchy assignment from unit admin's context

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "student@example.com",
  "phone": "9876543210",
  "password": "secure_password",
  "role": "student",
  "center_id": 1,
  "class_name": "Class 1"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "student@example.com",
  "phone": "9876543210",
  "role": "student",
  "reg_code": "KR0101/0001/2026-0001",
  "is_active": true
}
```

### 5. **Database Initialization** (`init_db.py`)
Creates:
1. **Super Admin Account**
   - Email: `admin@qhls.org`
   - Password: `admin123`

2. **States, Districts, Zones & Units**
   - Kerala with 14 districts
   - 4 zones per district
   - 3 units per zone
   - Total: 14 × 4 × 3 = 168 unit admins auto-created

3. **Unit Admin Accounts** (Auto-created for each unit)
   - Example for Trivandrum Zone 1 Unit 1:
     - Email: `trivandrum-z1u1@qhls.org`
     - Password: `unit11`
   - Format: `{district_name_lowercase}-z{zone_num}u{unit_num}@qhls.org`

---

## Usage Flow

### 1. Run Database Initialization
```powershell
python init_db.py
```
This creates:
- States, Districts, Zones, Units
- Unit Admins for each unit
- Sample output shows all created accounts

### 2. Login as Unit Admin
Example - Trivandrum Zone 1 Unit 1:
```
Email: trivandrum-z1u1@qhls.org
Password: unit11
```

### 3. Create Student Users via API
```bash
POST /auth/create-user
Authorization: Bearer <unit_admin_token>

{
  "name": "Alice",
  "email": "alice@school.com",
  "phone": "9876543210",
  "password": "student123",
  "role": "student",
  "center_id": 1,
  "class_name": "Class 1"
}
```

Response includes auto-generated `reg_code`: `KR0101/0001/2026-0001`

---

## Unit Admins Reference Sample

For **Trivandrum District (KR01)**:

| Zone | Unit | Admin Email | Password |
|------|------|------------|----------|
| 1 | 1 | trivandrum-z1u1@qhls.org | unit11 |
| 1 | 2 | trivandrum-z1u2@qhls.org | unit12 |
| 1 | 3 | trivandrum-z1u3@qhls.org | unit13 |
| 2 | 1 | trivandrum-z2u1@qhls.org | unit21 |
| 2 | 2 | trivandrum-z2u2@qhls.org | unit22 |
| ... | ... | ... | ... |

(Similar pattern for all 14 districts)

---

## Adding More States
Edit `app/core/reg_codes.py` and add to `STATE_CODES`:
```python
"Maharashtra": {
    "code": "MH",
    "districts": {
        1: "Mumbai",
        2: "Pune",
        # ... up to 14
    }
}
```

Then run `init_db.py` again to create states, zones, units, and admins.

---

## Files Modified
- [app/models/user.py](app/models/user.py) - Added reg_code field
- [app/models/hierarchy.py](app/models/hierarchy.py) - Uses existing State, District, Zone, Unit models
- [app/core/reg_codes.py](app/core/reg_codes.py) - Registration code utility
- [app/schemas/auth.py](app/schemas/auth.py) - Updated CreateUserRequest schema
- [app/routers/auth.py](app/routers/auth.py) - Updated create-user endpoint for unit admins
- [init_db.py](init_db.py) - Creates full hierarchy with zone and unit initialization

