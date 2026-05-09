from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from database import engine, Base
import models
from routers import auth, products

# Magically create all tables in our Postgres database if they don't exist yet!
models.Base.metadata.create_all(bind=engine)

# Initialize our FastAPI app
app = FastAPI(
    title="PricePilot API",
    description="The core engine for the PricePilot Smart Shopping OS",
    version="1.0.0"
)

# Register our Authentication Routes
app.include_router(auth.router)
app.include_router(products.router)

# Allow our Next.js frontend to communicate with this backend securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, we'll change this to our Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dummy product data (we will replace this with PostgreSQL soon!)
products = [
    {"id": 1, "name": "iPhone 16 Pro Max", "category": "Electronics", "price": 140000},
    {"id": 2, "name": "Sony WH-1000XM5", "category": "Audio", "price": 28000},
    {"id": 3, "name": "MacBook Air M3", "category": "Computers", "price": 115000}
]

# The root route (checks if server is alive)
@app.get("/")
def read_root():
    return {"message": "📡 PricePilot Backend Radar is Online."}

# A simple search route to mimic the "Live Market Search"
@app.get("/search")
def search_products(q: str = ""):
    # If the user types a query, filter the products. Otherwise, return none.
    if not q:
         return []
         
    query = q.lower()
    result = [p for p in products if query in p["name"].lower()]
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
