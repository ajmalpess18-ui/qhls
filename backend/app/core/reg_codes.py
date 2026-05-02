"""
Registration Code Management for QHLS
Format: STATECD/DISTRICTCD/YEAR-STUDENTNUM
Example: KR01/0001/2026
"""

from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.hierarchy import District

# State Code Configuration
STATE_CODES = {
    "Kerala": {
        "code": "KR",
        "districts": {
            1: "Trivandrum",
            2: "Kollam",
            3: "Pathanamthitta",
            4: "Alappuzha",
            5: "Kottayam",
            6: "Idukki",
            7: "Ernakulam",
            8: "Thrissur",
            9: "Palakkad",
            10: "Malappuram",
            11: "Kozhikode",
            12: "Wayanad",
            13: "Kannur",
            14: "Kasaragod",
        }
    }
    # Add more states as needed
    # "State_Name": {
    #     "code": "ST",
    #     "districts": {
    #         1: "District Name",
    #         ...
    #     }
    # }
}


def get_state_code(state_name: str) -> str:
    """Get state code from state name"""
    if state_name not in STATE_CODES:
        raise ValueError(f"State {state_name} not configured")
    return STATE_CODES[state_name]["code"]


def get_district_number(state_name: str, district_name: str) -> int:
    """Get district number from district name"""
    if state_name not in STATE_CODES:
        raise ValueError(f"State {state_name} not configured")
    
    districts = STATE_CODES[state_name]["districts"]
    for num, name in districts.items():
        if name.lower() == district_name.lower():
            return num
    raise ValueError(f"District {district_name} not found in {state_name}")


def generate_reg_code(db: Session, state_name: str, district_name: str, unit_name: str = None, year: int = None) -> str:
    """
    Generate a unique registration code
    Format: STATECD/UNITCD/YEAR-STUDENTNUM
    Example: KR0101/0001/2026-0001
    """
    if year is None:
        year = datetime.now().year
    
    state_code = get_state_code(state_name)
    district_num = get_district_number(state_name, district_name)
    
    # Get next student number for this unit and year
    # Format: STATECD+DISTRICTCD = 4 chars (e.g., KR01)
    # Unit code: 2 digits (01-99)
    prefix = f"{state_code}{district_num:02d}"
    
    # If unit specified, add unit code (default 01 if not specified)
    unit_code = "01"  # Default unit code
    if unit_name:
        # You can enhance this to get actual unit number
        unit_code = "01"
    
    full_prefix = f"{prefix}{unit_code}"
    
    # Query existing codes with this prefix and year
    existing_codes = db.query(User).filter(
        User.reg_code.like(f"{full_prefix}/%/{year}%")
    ).all()
    
    # Extract student numbers from existing codes
    student_numbers = []
    for user in existing_codes:
        if user.reg_code:
            # Extract the number part after year- in format: KR0101/0001/2026-0001
            parts = user.reg_code.split('-')
            if len(parts) == 2:
                try:
                    num = int(parts[1])
                    student_numbers.append(num)
                except ValueError:
                    pass
    
    # Get next number
    next_student_num = max(student_numbers) + 1 if student_numbers else 1
    
    # Generate registration code
    reg_code = f"{full_prefix}/{next_student_num:04d}/{year}-{next_student_num:04d}"
    
    return reg_code
    
    return reg_code


def parse_reg_code(reg_code: str) -> dict:
    """Parse registration code and return its components"""
    try:
        # Format: KR01/0001/2026-0001
        parts = reg_code.split('/')
        if len(parts) != 3:
            raise ValueError("Invalid format")
        
        state_district = parts[0]  # KR01
        student_num = parts[1]      # 0001
        year_and_num = parts[2]     # 2026-0001
        
        year_num_parts = year_and_num.split('-')
        year = int(year_num_parts[0])
        
        state_code = state_district[:2]
        district_num = int(state_district[2:])
        
        return {
            "state_code": state_code,
            "district_number": district_num,
            "student_number": int(student_num),
            "year": year,
        }
    except (IndexError, ValueError) as e:
        raise ValueError(f"Cannot parse registration code: {e}")
