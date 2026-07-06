# backend/app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.db.session import get_db
from app.core.limiter import limiter
from app.routers import auth, colegios
from app.routers import auth, colegios, geocoding

app = FastAPI(title="comunicarte_salesmap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)
app.include_router(colegios.router)
app.include_router(geocoding.router)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT PostGIS_Version();")).scalar()
    return {
        "status": "ok",
        "database": "connected",
        "postgis_version": result,
    }