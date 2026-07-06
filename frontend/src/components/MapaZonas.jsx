// frontend/src/components/MapaZonas.jsx
import { useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import '@geoman-io/leaflet-geoman-free';
import * as L from 'leaflet';
import { useMapStore } from '../stores/useMapStore';
import { useZonaDibujo } from '../hooks/useZonaDibujo';
import BarraBusqueda from './BarraBusqueda';
import ListaResultados from './ListaResultados';
import ListaResultadosSidebar from './ListaResultadosSidebar';
import DetalleColegio from './DetalleColegio';
import DetalleColegioSidebar from './DetalleColegioSidebar';

import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// --- DEFINICIÓN DE ÍCONOS ---
const iconoNormal = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconoSeleccionado = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- COMPONENTE DE PILOTO AUTOMÁTICO (CÁMARA) ---
function AutoPanSeleccion({ colegioId, colegios }) {
  const map = useMap();

  useEffect(() => {
    if (colegioId && colegios.length > 0) {
      const colegio = colegios.find((c) => String(c.id) === String(colegioId));
      if (colegio) {
        map.flyTo([colegio.lat, colegio.lng], 17, {
          animate: true,
          duration: 1.5,
        });
      }
    }
    // Solo dependemos del ID para evitar vuelos infinitos de cámara
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colegioId, map]); 

  return null;
}

// --- CONTROLES DE DIBUJO GEOMAN ---
function ControlesDibujo({ mapRefExterno, activarNuevaCapa, capaActivaRef, limpiarCapaActiva }) {
  const map = useMap();

  useEffect(() => {
    // eslint-disable-next-line
    mapRefExterno.current = map;
  }, [map, mapRefExterno]);

  useEffect(() => {
    map.pm.addControls({
      position: 'bottomleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });

    function handleCreate(e) { activarNuevaCapa(e.layer); }
    function handleRemove(e) {
      if (e.layer === capaActivaRef.current) limpiarCapaActiva();
    }

    map.on('pm:create', handleCreate);
    map.on('pm:remove', handleRemove);

    return () => {
      map.pm.removeControls();
      map.off('pm:create', handleCreate);
      map.off('pm:remove', handleRemove);
    };
  }, [map, activarNuevaCapa, capaActivaRef, limpiarCapaActiva]);

  return null;
}

export default function MapaZonas() {
  const centroSantaCruz = [-17.7833, -63.1821];
  const colegios = useMapStore((s) => s.colegios);
  const colegioSeleccionadoId = useMapStore((s) => s.colegioSeleccionadoId);
  const seleccionarColegio = useMapStore((s) => s.seleccionarColegio);

  const mapRef = useRef(null);
  const { capaActivaRef, activarNuevaCapa, limpiarCapaActiva } = useZonaDibujo(mapRef);

  // --- TRUCO DE MICRO-DESPLAZAMIENTO (BLINDADO CON USEMEMO Y MATEMÁTICAS) ---
  const colegiosSeparados = useMemo(() => {
    return colegios.map((c, index, array) => {
      const latNum = parseFloat(c.lat);
      const lngNum = parseFloat(c.lng);

      const superpuestos = array.slice(0, index).filter((prev) => {
        // Tolerancia de 0.00001 para ignorar errores de precisión decimal de JavaScript
        const latIgual = Math.abs(parseFloat(prev.lat) - latNum) < 0.00001;
        const lngIgual = Math.abs(parseFloat(prev.lng) - lngNum) < 0.00001;
        return latIgual && lngIgual;
      }).length;

      // Si es único, aseguramos de devolver números en lugar de textos
      if (superpuestos === 0) {
        return { ...c, lat: latNum, lng: lngNum };
      }

      // 0.0002 = Separación amplia (~20 metros) para que sea súper evidente a la vista
      const offset = 0.0002; 
      return {
        ...c,
        lat: latNum + (superpuestos * offset),
        lng: lngNum - (superpuestos * offset) // Se dibujarán en diagonal hacia la derecha
      };
    });
  }, [colegios]); // Solo recalcula si los colegios de Zustand cambian

  return (
    <div className="w-full h-full flex flex-col md:flex-row">
      <aside className="hidden md:flex md:flex-col md:w-[400px] md:h-full bg-white border-r border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <BarraBusqueda mapRef={mapRef} activarNuevaCapa={activarNuevaCapa} floating={false} />
        </div>
        {colegioSeleccionadoId ? (
          <DetalleColegioSidebar colegioId={colegioSeleccionadoId} />
        ) : (
          <ListaResultadosSidebar />
        )}
      </aside>

      <div className="relative flex-1 h-full">
        <MapContainer center={centroSantaCruz} zoom={13} zoomControl={false} className="w-full h-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="bottomright" />

          {/* Piloto automático optimizado */}
          <AutoPanSeleccion colegioId={colegioSeleccionadoId} colegios={colegiosSeparados} />

          <ControlesDibujo
            mapRefExterno={mapRef}
            activarNuevaCapa={activarNuevaCapa}
            capaActivaRef={capaActivaRef}
            limpiarCapaActiva={limpiarCapaActiva}
          />

          <MarkerClusterGroup 
            disableClusteringAtZoom={16} 
            maxClusterRadius={40}
          >
            {colegiosSeparados.map((c) => {
              const esSeleccionado = String(c.id) === String(colegioSeleccionadoId);
              
              {/* TRUCO INFALIBLE: Cambiamos la 'key' para burlar el caché del Cluster. 
                  Si se selecciona, React destruye el pin azul y crea uno rojo nuevo */}
              const markerKey = `${c.id}-${esSeleccionado ? 'seleccionado' : 'normal'}`;

              return (
                <Marker 
                  key={markerKey} 
                  position={[c.lat, c.lng]}
                  icon={esSeleccionado ? iconoSeleccionado : iconoNormal}
                  zIndexOffset={esSeleccionado ? 1000 : 0} 
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold text-gray-800 mb-1">{c.nombre}</p>
                      {!esSeleccionado && (
                        <button
                          onClick={() => seleccionarColegio(c.id)}
                          className="text-brand text-sm font-medium underline"
                        >
                          Ver ficha completa
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        <div className="md:hidden">
          <BarraBusqueda mapRef={mapRef} activarNuevaCapa={activarNuevaCapa} floating={true} />
          <ListaResultados />
          <DetalleColegio />
        </div>
      </div>
    </div>
  );
}