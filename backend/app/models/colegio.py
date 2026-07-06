from sqlalchemy import Column, Integer, String, ARRAY, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import ENUM
from geoalchemy2 import Geometry
from app.db.session import Base

turno_enum = ENUM(
    "Mañana", "Tarde", "Noche", "Continuo",
    name="turno_enum",
    create_type=False,  # el tipo ya existe en la DB
)

class Colegio(Base):
    __tablename__ = "colegios"

    id = Column(Integer, primary_key=True, index=True)
    codigo_sie = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    director = Column(String(255))
    telefono = Column(String(50))
    niveles = Column(ARRAY(Text), nullable=False, default=list)
    turno = Column(turno_enum)
    direccion = Column(Text)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    # --- NOMBRES CORREGIDOS PARA CONECTAR BD Y REACT ---
    matricula_actual = Column(Integer, nullable=True)
    anio_actual = Column(Integer, nullable=True)
    promovidos = Column(Integer, default=0)
    reprobados = Column(Integer, default=0)
    retirados = Column(Integer, default=0)
    # ---------------------------------------------------

    scraped_at = Column(TIMESTAMP, nullable=False)
    source_hash = Column(String(64))