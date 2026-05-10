from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("Attempting to add 'is_available' column to 'platform_prices' table...")
    try:
        conn.execute(text("ALTER TABLE platform_prices ADD COLUMN is_available BOOLEAN DEFAULT TRUE"))
        conn.commit()
        print("Successfully added column!")
    except Exception as e:
        print(f"Column might already exist or error occurred: {e}")
