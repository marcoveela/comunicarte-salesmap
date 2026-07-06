from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from shapely.geometry import Polygon
from geoalchemy2.shape import from_shape
from app.db.session import get_db
from app.models.colegio import Colegio
from app.schemas.colegio import (
    BusquedaPoligonoRequest, ColegioListItem, ColegioDetalle
)
from app.core.deps import get_current_user
from app.core.limiter import limiter

router = APIRouter(prefix="/colegios", tags=["colegios"])

@router.post("/buscar", response_model=list[ColegioListItem])
@limiter.limit("30/minute")  # endpoint costoso, protegido contra abuso/scraping propio
def buscar_colegios(
    request: Request,
    busqueda: BusquedaPoligonoRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Construir el polígono con Shapely y validar que cierra correctamente
    coords = [(p.lng, p.lat) for p in busqueda.puntos]  # Shapely usa (x=lng, y=lat)
    if coords[0] != coords[-1]:
        coords.append(coords[0])  # cerrar el polígono si el frontend no lo hizo

    try:
        poligono = Polygon(coords)
        if not poligono.is_valid:
            raise ValueError("Polígono inválido (autointersección u otro problema geométrico)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Polígono inválido: {e}")

    geom_wkb = from_shape(poligono, srid=4326)

    query = db.query(
        Colegio.id,
        Colegio.nombre,
        Colegio.codigo_sie,
        func.ST_Y(Colegio.geom).label("lat"),
        func.ST_X(Colegio.geom).label("lng"),
    ).filter(func.ST_Within(Colegio.geom, geom_wkb))

    # Filtros opcionales
    if busqueda.turno:
        query = query.filter(Colegio.turno == busqueda.turno)
    if busqueda.nivel:
        query = query.filter(Colegio.niveles.any(busqueda.nivel))

    resultados = query.all()
    return [
        ColegioListItem(id=r.id, nombre=r.nombre, codigo_sie=r.codigo_sie, lat=r.lat, lng=r.lng)
        for r in resultados
    ]

@router.get("/{colegio_id}", response_model=ColegioDetalle)
@limiter.limit("60/minute")
def detalle_colegio(
    request: Request,
    colegio_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    resultado = db.query(
        Colegio,
        func.ST_Y(Colegio.geom).label("lat"),
        func.ST_X(Colegio.geom).label("lng"),
    ).filter(Colegio.id == colegio_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Colegio no encontrado")

    colegio, lat, lng = resultado
    
    return ColegioDetalle(
        id=colegio.id,
        codigo_sie=colegio.codigo_sie,
        nombre=colegio.nombre,
        director=colegio.director,
        telefono=colegio.telefono,
        niveles=colegio.niveles,
        turno=colegio.turno,
        direccion=colegio.direccion,
        
        # --- CORRECCIÓN FINAL AQUÍ ---
        matricula_actual=colegio.matricula_actual,
        anio_actual=colegio.anio_actual,
        promovidos=colegio.promovidos,
        reprobados=colegio.reprobados,
        retirados=colegio.retirados,
        # -----------------------------
        
        lat=lat,
        lng=lng,
    )