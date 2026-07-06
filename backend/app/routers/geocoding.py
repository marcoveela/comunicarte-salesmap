# backend/app/routers/geocoding.py
import requests
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.zona_conocida import ZonaConocida
from app.schemas.geocoding import ZonaResponse
from app.core.deps import get_current_user
from app.core.limiter import limiter

router = APIRouter(prefix="/geocoding", tags=["geocoding"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Bounding box aproximado de Santa Cruz de la Sierra — evita que Nominatim
# devuelva una zona con el mismo nombre en otra ciudad/país.
VIEWBOX_SANTA_CRUZ = "-63.35,-17.65,-62.95,-17.95"


@router.get("/buscar", response_model=ZonaResponse)
@limiter.limit("20/minute")
def buscar_zona(
    request: Request,
    nombre: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # 1. Caché propia primero (evita golpear Nominatim en zonas ya conocidas)
    zona = db.query(ZonaConocida).filter(
        func.lower(ZonaConocida.nombre) == nombre.lower()
    ).first()

    if zona:
        return ZonaResponse(nombre=zona.nombre, lat=zona.lat, lng=zona.lng, fuente="cache")

    # 2. Fallback a Nominatim
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={
                "q": f"{nombre}, Santa Cruz de la Sierra, Bolivia",
                "format": "json",
                "viewbox": VIEWBOX_SANTA_CRUZ,
                "bounded": 1,
                "limit": 1,
            },
            headers={"User-Agent": "comunicarte-salesmap/1.0"},  # Nominatim exige un User-Agent identificable
            timeout=5,
        )
        resp.raise_for_status()
        resultados = resp.json()
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="No se pudo consultar el servicio de mapas, intentá de nuevo")

    if not resultados:
        raise HTTPException(status_code=404, detail=f"No se encontró la zona '{nombre}'")

    lat = float(resultados[0]["lat"])
    lng = float(resultados[0]["lon"])

    # 3. Cachear para no volver a consultar Nominatim por esta misma zona
    db.add(ZonaConocida(nombre=nombre, lat=lat, lng=lng))
    db.commit()

    return ZonaResponse(nombre=nombre, lat=lat, lng=lng, fuente="nominatim")