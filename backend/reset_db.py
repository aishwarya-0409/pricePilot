from database import engine, Base
import models

print("Dropping all tables to start fresh with Multi-Platform tracking...")
models.Base.metadata.drop_all(bind=engine)
print("Recreating tables with new schema...")
models.Base.metadata.create_all(bind=engine)
print("Database reset complete!")
