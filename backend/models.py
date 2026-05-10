from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# ---------------------------------------------------------
# Step 5: Database Models
# ---------------------------------------------------------
# These classes represent tables in our PostgreSQL database.
# SQLAlchemy will automatically convert these classes into SQL 'CREATE TABLE' statements!

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    # We will store the hashed password here eventually, but for OTP we might not need it initially
    # Let's keep it simple: Email OTP based login!
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)

# ---------------------------------------------------------
# Phase 2: Price Tracking Models
# ---------------------------------------------------------

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True)
    # The "Market Weather" (e.g., 'Sunny', 'Storm', 'Rain')
    market_weather = Column(String, default="Sunny")
    # 'Stable', 'Volatile', 'Overpriced'
    market_mood = Column(String, default="Stable")
    
    # Link to price history
    prices = relationship("PriceHistory", back_populates="product")
    competitor_prices = relationship("PlatformPrice", back_populates="product")

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    platform_name = Column(String, nullable=True) # Which app was this price from?
    price = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Link back to product
    product = relationship("Product", back_populates="prices")

class PlatformPrice(Base):
    __tablename__ = "platform_prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    platform_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    url = Column(String, nullable=False)
    is_available = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="competitor_prices")
