// frontend/src/hooks/useZonaDibujo.js
import { useRef, useCallback } from 'react';
import { api } from '../api/client';
import { useMapStore } from '../stores/useMapStore';
import { geoJsonAPuntos } from '../utils/geo';

function useDebouncedCallback(callback, delay) {
  const timeoutRef = useRef(null);
  return useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

export function useZonaDibujo(mapRef) {
  const setColegios = useMapStore((s) => s.setColegios);
  const setCargando = useMapStore((s) => s.setCargando);
  const setError = useMapStore((s) => s.setError);

  const capaActivaRef = useRef(null);
  const solicitudIdRef = useRef(0);

  const ejecutarBusqueda = useCallback(
    async (layer) => {
      const puntos = geoJsonAPuntos(layer.toGeoJSON());
      const idActual = ++solicitudIdRef.current;

      setCargando(true);
      setError(null);

      try {
        const colegios = await api.buscarColegios(puntos);
        if (idActual !== solicitudIdRef.current) return;
        setColegios(colegios);
      } catch (err) {
        if (idActual !== solicitudIdRef.current) return;
        setError(err.message);
      } finally {
        if (idActual === solicitudIdRef.current) setCargando(false);
      }
    },
    [setColegios, setCargando, setError]
  );

  const busquedaConDebounce = useDebouncedCallback(ejecutarBusqueda, 400);

  const activarNuevaCapa = useCallback(
    (layer) => {
      const map = mapRef.current;
      if (!map) return;

      if (capaActivaRef.current && capaActivaRef.current !== layer) {
        map.removeLayer(capaActivaRef.current);
      }
      capaActivaRef.current = layer;

      layer.on('pm:edit', () => busquedaConDebounce(layer));
      layer.on('pm:markerdragend', () => busquedaConDebounce(layer));

      ejecutarBusqueda(layer);
    },
    [mapRef, ejecutarBusqueda, busquedaConDebounce]
  );

  const limpiarCapaActiva = useCallback(() => {
    capaActivaRef.current = null;
    solicitudIdRef.current++;
    setColegios([]);
    setError(null);
  }, [setColegios, setError]);

  return { capaActivaRef, activarNuevaCapa, limpiarCapaActiva };
}