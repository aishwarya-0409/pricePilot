from database import SessionLocal, engine
from models import Product, PriceHistory, Base
from datetime import datetime, timedelta
import random

# Create tables
Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    
    # Check if we already seeded
    if db.query(Product).first():
        print("Database already seeded!")
        return

    # Create dummy products
    p1 = Product(name="iPhone 16 Pro Max", category="Electronics", market_weather="Storm", market_mood="Volatile")
    p2 = Product(name="Sony WH-1000XM5", category="Audio", market_weather="Sunny", market_mood="Stable")
    
    db.add_all([p1, p2])
    db.commit()
    db.refresh(p1)
    db.refresh(p2)

    # Generate dummy price history for the last 30 days
    # iPhone: Highly volatile, currently overpriced
    # Sony: Stable
    
    now = datetime.utcnow()
    iphone_prices = []
    sony_prices = []
    
    # Base prices
    iphone_base = 135000
    sony_base = 28000

    for i in range(30, -1, -1):
        date = now - timedelta(days=i)
        
        # iPhone has a crazy spike at the end
        if i < 5:
            iphone_price = iphone_base + 8000 + random.randint(-1000, 1000)
        else:
            iphone_price = iphone_base + random.randint(-3000, 3000)
            
        sony_price = sony_base + random.randint(-500, 500)
        
        iphone_prices.append(PriceHistory(product_id=p1.id, price=iphone_price, timestamp=date))
        sony_prices.append(PriceHistory(product_id=p2.id, price=sony_price, timestamp=date))
        
    db.add_all(iphone_prices)
    db.add_all(sony_prices)
    db.commit()
    
    print("Database seeded with realistic dummy data successfully!")
    db.close()

if __name__ == "__main__":
    seed_db()
