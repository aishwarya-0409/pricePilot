from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta

from database import get_db
from models import User, OTPCode
from utils import generate_otp, send_otp_email

# ---------------------------------------------------------
# Step 7: Authentication API Routes
# ---------------------------------------------------------
# We use APIRouter to organize our routes into separate files
router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Pydantic Models for Data Validation ---
# These ensure the frontend sends us the correct data types
class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    code: str

# --- Route 1: Request OTP ---
@router.post("/request-otp")
def request_otp(request: OTPRequest, db: Session = Depends(get_db)):
    # 1. Check if user exists, if not, create a new one (Seamless Registration/Login!)
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        user = User(email=request.email)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 2. Generate a 6-digit OTP
    otp = generate_otp()
    
    # 3. Save it to the database with a 5-minute expiration
    expiration_time = datetime.utcnow() + timedelta(minutes=5)
    
    # Delete any old OTPs for this email first
    db.query(OTPCode).filter(OTPCode.email == request.email).delete()
    
    new_otp = OTPCode(email=request.email, code=otp, expires_at=expiration_time)
    db.add(new_otp)
    db.commit()
    
    # 4. "Send" the email
    send_otp_email(request.email, otp)
    
    return {"message": "OTP sent successfully! Check your console."}


# --- Route 2: Verify OTP ---
@router.post("/verify-otp")
def verify_otp(request: OTPVerify, db: Session = Depends(get_db)):
    # 1. Find the OTP in the database
    db_otp = db.query(OTPCode).filter(
        OTPCode.email == request.email,
        OTPCode.code == request.code
    ).first()
    
    # 2. Validation Checks
    if not db_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
        
    if db_otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP code has expired.")
        
    # 3. Success! Mark user as verified
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        user.is_verified = True
        db.commit()
        
    # Delete the OTP so it can't be used again
    db.delete(db_otp)
    db.commit()
    
    # In a real app, we would return a JWT Token here so the frontend stays logged in.
    # We will add JWTs when we connect the Next.js frontend!
    return {
        "message": "Login successful!",
        "user_id": user.id,
        "email": user.email
    }
