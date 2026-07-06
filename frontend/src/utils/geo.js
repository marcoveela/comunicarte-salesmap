// frontend/src/utils/geo.js
export function geoJsonAPuntos(geojson) {
  const anillo = geojson.geometry.coordinates[0];
  return anillo.map(([lng, lat]) => ({ lat, lng }));
}

export function crearPoligonoDesdeCentro(lat, lng, deltaGrados = 0.012) {
  return [
    [lat + deltaGrados, lng - deltaGrados],
    [lat + deltaGrados, lng + deltaGrados],
    [lat - deltaGrados, lng + deltaGrados],
    [lat - deltaGrados, lng - deltaGrados],
  ];
}