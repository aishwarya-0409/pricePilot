from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ---------------------------------------------------------
# Step 4: Database Connection Setup
# ---------------------------------------------------------
# We are setting up SQLAlchemy. It acts as a translator.
# Instead of writing raw SQL strings (SELECT * FROM users),
# we write Python code, and SQLAlchemy translates it to SQL!

# For now, we will use a local PostgreSQL database.
# Format: postgresql://<username>:<password>@<host>:<port>/<database_name>
# IMPORTANT: Update these credentials to match your local PostgreSQL setup!
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/pricePilot"

# The engine is the core interface to the database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# A SessionLocal class is a "factory" for database sessions.
# Every time a user makes a request, we create a temporary session to talk to the DB.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our models. All our database tables will inherit from this.
Base = declarative_base()

# Dependency function: This ensures the database connection closes after a request finishes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
