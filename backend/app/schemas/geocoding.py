# backend/app/schemas/geocoding.py
from pydantic import BaseModel

class ZonaResponse(BaseModel):
    nombre: str
    lat: float
    lng: float
    fuente: str  # "cache" | "nominatim"