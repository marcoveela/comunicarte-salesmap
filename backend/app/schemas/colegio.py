from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, List

class PuntoCoordenada(BaseModel):
    lat: float
    lng: float

class BusquedaPoligonoRequest(BaseModel):
    puntos: list[PuntoCoordenada]
    turno: Optional[str] = None       # filtro opcional
    nivel: Optional[str] = None       # filtro opcional

    @field_validator("puntos")
    @classmethod
    def validar_poligono(cls, v):
        if len(v) < 3:
            raise ValueError("Un polígono necesita al menos 3 puntos")
        return v

class ColegioListItem(BaseModel):
    id: int
    nombre: str
    codigo_sie: str
    lat: float
    lng: float

    model_config = ConfigDict(from_attributes=True)

class ColegioDetalle(BaseModel):
    id: int
    codigo_sie: str
    nombre: str
    director: Optional[str]
    telefono: Optional[str]
    niveles: list[str]
    turno: Optional[str]
    direccion: Optional[str]
    
   # --- ---
    matricula_actual: Optional[int] = None
    anio_actual: Optional[int] = None
    promovidos: Optional[int] = 0
    reprobados: Optional[int] = 0
    retirados: Optional[int] = 0
    # -------------------------------------------------------------
    
    lat: float
    lng: float

    model_config = ConfigDict(from_attributes=True)

