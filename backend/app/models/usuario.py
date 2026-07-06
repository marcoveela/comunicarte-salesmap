# backend/app/models/usuario.py
from sqlalchemy import Column, Integer, String, DateTime, func
from app.db.session import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(50), nullable=False, default="vendedor")
    created_at = Column(DateTime, server_default=func.now())