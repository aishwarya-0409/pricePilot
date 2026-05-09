from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
import random

from database import get_db
from models import Product, PriceHistory
from scraper import scrape_product
from ml_engine import generate_prediction

router = APIRouter(prefix="/api/products", tags=["Products & Predictions"])

class ScrapeRequest(BaseModel):
    url: str

# --- Route 1: Scrape & Save (The Bridge between Real World and our App) ---
@router.post("/scrape")
def scrape_new_product(request: ScrapeRequest, db: Session = Depends(get_db)):
    # 1. Scrape the live data
    scraped_data = scrape_product(request.url)
    
    # 2. Check if we already scraped this exact name
    product = db.query(Product).filter(Product.name == scraped_data["name"]).first()
    
    if not product:
        # Create new product
        product = Product(
            name=scraped_data["name"],
            category=scraped_data["category"],
            market_weather="Sunny" if random.random() > 0.5 else "Storm",
            market_mood="Volatile" if random.random() > 0.5 else "Stable"
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        
        # Because ML requires historical data, we backfill 30 days of fake history
        # leading up to the REAL scraped price today.
        real_price = scraped_data["current_price"]
        now = datetime.utcnow()
        history = []
        for i in range(30, -1, -1):
            date = now - timedelta(days=i)
            # Add some variance, but make sure the final day equals the real price
            if i == 0:
                price = real_price
            else:
                price = real_price + random.randint(-5000, 5000)
            history.append(PriceHistory(product_id=product.id, price=price, timestamp=date))
        
        db.add_all(history)
        db.commit()
    else:
        # If it exists, just append today's real scraped price
        new_price = PriceHistory(product_id=product.id, price=scraped_data["current_price"], timestamp=datetime.utcnow())
        db.add(new_price)
        db.commit()

    return {"message": "Scraped successfully", "product_id": product.id}


# --- Route 2: Get Product Details ---
@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    latest_price = db.query(PriceHistory).filter(PriceHistory.product_id == product_id).order_by(PriceHistory.timestamp.desc()).first()
    
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "market_weather": product.market_weather,
        "market_mood": product.market_mood,
        "current_price": latest_price.price if latest_price else 0
    }

# --- Route 3: Get Price History ---
@router.get("/{product_id}/prices")
def get_price_history(product_id: int, db: Session = Depends(get_db)):
    prices = db.query(PriceHistory).filter(PriceHistory.product_id == product_id).order_by(PriceHistory.timestamp.asc()).all()
    
    return [
        {
            "price": p.price,
            "date": p.timestamp.strftime("%Y-%m-%d %H:%M")
        } for p in prices
    ]

# --- Route 4: The AI Recommendation Engine (Scikit-Learn Integration) ---
@router.get("/{product_id}/recommend")
def get_recommendation(product_id: int, db: Session = Depends(get_db)):
    # Fetch all historical prices to feed into our Machine Learning model
    history = db.query(PriceHistory).filter(PriceHistory.product_id == product_id).order_by(PriceHistory.timestamp.asc()).all()
    
    prices = [p.price for p in history]
    dates = [p.timestamp for p in history]
    
    # Run the Scikit-Learn Linear Regression!
    prediction_data = generate_prediction(prices, dates)
    
    return {
        "action": prediction_data["action"],
        "current_price": prediction_data["current_price"],
        "predicted_price": prediction_data["predicted_price"],
        "savings": prediction_data.get("savings", 0),
        "confidence": prediction_data["confidence"],
        "reason": prediction_data["reason"],
        "logs": prediction_data["logs"],
        "future_data_point": {
            "date": prediction_data["future_date"].strftime("%Y-%m-%d %H:%M") if "future_date" in prediction_data else "",
            "predicted_price": prediction_data["predicted_price"]
        }
    }
