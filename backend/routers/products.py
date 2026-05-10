from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
import random

from database import get_db
from models import Product, PriceHistory, PlatformPrice
from scraper import scrape_across_platforms, get_product_title_from_url
from ml_engine import generate_prediction

router = APIRouter(prefix="/api/products", tags=["Products & Predictions"])

class ScrapeRequest(BaseModel):
    query: str

# --- Route 1: Scrape & Save (The Bridge between Real World and our App) ---
@router.post("/scrape")
def scrape_new_product(request: ScrapeRequest, db: Session = Depends(get_db)):
    query = request.query
    
    # 0. Check if the query is a direct URL
    if query.startswith("http"):
        # Visit the URL and extract the product title first
        query = get_product_title_from_url(query)
        print(f"[*] Parsed title from URL: {query}")

    # 1. Scrape the live data across platforms
    scraped_data_list = scrape_across_platforms(query)
    
    if not scraped_data_list:
        raise HTTPException(status_code=500, detail="Failed to find product data.")
        
    # Find the lowest price to represent the main tracking price
    best_deal = min(scraped_data_list, key=lambda x: x["price"])
    product_name = best_deal["title"]
    
    # 2. Check if we already scraped this name
    product = db.query(Product).filter(Product.name == product_name).first()
    
    if not product:
        product = Product(
            name=product_name,
            category="Electronics",
            market_weather="Sunny" if random.random() > 0.5 else "Storm",
            market_mood="Volatile" if random.random() > 0.5 else "Stable"
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        
        # Backfill 30 days of fake history leading up to today
        real_price = best_deal["price"]
        now = datetime.utcnow()
        history = []
        for i in range(30, -1, -1):
            date = now - timedelta(days=i)
            price = real_price if i == 0 else real_price + random.randint(-5000, 5000)
            history.append(PriceHistory(product_id=product.id, price=price, timestamp=date))
        
        db.add_all(history)
        db.commit()
    else:
        new_price = PriceHistory(product_id=product.id, price=best_deal["price"], timestamp=datetime.utcnow())
        db.add(new_price)
        db.commit()

    # 3. Update Platform Prices
    # Clear old platform prices for this product to keep it fresh
    db.query(PlatformPrice).filter(PlatformPrice.product_id == product.id).delete()
    
    platform_prices = []
    for data in scraped_data_list:
        platform_prices.append(
            PlatformPrice(
                product_id=product.id,
                platform_name=data["platform"],
                price=data["price"],
                url=data["url"],
                is_available=data.get("is_available", True)
            )
        )
    db.add_all(platform_prices)
    db.commit()

    return {"message": "Scraped successfully", "product_id": product.id}

# --- Route 5: Mock AI Vision Engine ---
@router.post("/identify-image")
async def identify_image(file: UploadFile = File(...)):
    # In a real app, we'd use Gemini Vision or GPT-4V here.
    # For now, we simulate identification based on the filename or a random selection.
    filename = file.filename.lower()
    
    # Simple keyword detection for "Mocking"
    if "iphone" in filename or "phone" in filename:
        product_name = "iPhone 16 Pro"
    elif "samsung" in filename or "galaxy" in filename:
        product_name = "Samsung Galaxy S24 Ultra"
    elif "macbook" in filename or "laptop" in filename:
        product_name = "MacBook Air M3"
    elif "shoe" in filename or "nike" in filename or "adidas" in filename:
        product_name = "Nike Air Max Shoes"
    elif "shirt" in filename or "dress" in filename or "top" in filename:
        product_name = "Cotton Casual Wear"
    elif "watch" in filename:
        product_name = "Smart Watch Series 9"
    else:
        # Random fashion items if no keyword found
        fashion_items = ["Floral Summer Dress", "Men's Slim Fit Jeans", "Leather Handbag", "Wireless Headphones"]
        product_name = random.choice(fashion_items)
        
    return {"product_name": product_name}


# --- Route 2: Get Product Details ---
@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    latest_price = db.query(PriceHistory).filter(PriceHistory.product_id == product_id).order_by(PriceHistory.timestamp.desc()).first()
    platform_prices = db.query(PlatformPrice).filter(PlatformPrice.product_id == product_id).all()
    
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "market_weather": product.market_weather,
        "market_mood": product.market_mood,
        "current_price": latest_price.price if latest_price else 0,
        "competitors": [{"platform": p.platform_name, "price": p.price, "url": p.url, "is_available": p.is_available} for p in platform_prices]
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
    platform_prices = db.query(PlatformPrice).filter(PlatformPrice.product_id == product_id).all()
    platform_data = [{"platform": p.platform_name, "price": p.price} for p in platform_prices]
    prediction_data = generate_prediction(prices, dates, platform_prices=platform_data)
    
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
