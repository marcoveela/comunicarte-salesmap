# backend/app/models/zona_conocida.py
from sqlalchemy import Column, Integer, String, Float
from app.db.session import Base

class ZonaConocida(Base):
    __tablename__ = "zonas_conocidas"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(255), unique=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)