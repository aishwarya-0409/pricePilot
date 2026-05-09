import random
import string
import smtplib
from email.message import EmailMessage

# ---------------------------------------------------------
# Step 6: OTP Generation and "Sending" Logic
# ---------------------------------------------------------

def generate_otp(length=6) -> str:
    """Generates a random N-digit OTP code."""
    # We use random.choices to pick 6 random numbers from 0-9
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email_address: str, otp_code: str):
    """
    Simulates sending an email with the OTP.
    In a real production environment, we would use a service like SendGrid,
    AWS SES, or simply Python's smtplib with a Gmail app password.
    """
    
    print("\n" + "="*50, flush=True)
    print(" 🚀 PRICEPILOT EMAIL SYSTEM SIMULATOR", flush=True)
    print("="*50, flush=True)
    print(f"To: {email_address}", flush=True)
    print(f"Subject: Your PricePilot Login Code", flush=True)
    print("-" * 50, flush=True)
    print(f"Your secret One-Time Password is: {otp_code}", flush=True)
    print("This code will expire in 5 minutes.", flush=True)
    print("="*50 + "\n", flush=True)
    
    # Example of how it WOULD look if we used a real Gmail account:
    """
    msg = EmailMessage()
    msg.set_content(f"Your PricePilot login code is: {otp_code}")
    msg['Subject'] = 'Your PricePilot Login Code'
    msg['From'] = "no-reply@pricepilot.ai"
    msg['To'] = email_address
    
    # You would need to turn on "App Passwords" in your Google Account
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login('your_email@gmail.com', 'your_app_password')
        smtp.send_message(msg)
    """
    
    # For our development, printing to the console is perfect!
    return True
