// frontend/src/components/BarraBusqueda.jsx
import { useState } from 'react';
import L from 'leaflet';
import { api } from '../api/client';
import { crearPoligonoDesdeCentro } from '../utils/geo';

export default function BarraBusqueda({ mapRef, activarNuevaCapa, floating = false }) {
  const [query, setQuery] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [errorZona, setErrorZona] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim() || !mapRef.current) return;

    setBuscando(true);
    setErrorZona(null);
    try {
      const { lat, lng } = await api.geocodificar(query.trim());
      mapRef.current.flyTo([lat, lng], 15);

      const anillo = crearPoligonoDesdeCentro(lat, lng);
      const nuevaCapa = L.polygon(anillo).addTo(mapRef.current);
      nuevaCapa.pm.enable();

      activarNuevaCapa(nuevaCapa);
    } catch (err) {
      setErrorZona(err.message || 'No se encontró esa zona');
    } finally {
      setBuscando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={floating ? 'absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[92%] max-w-md px-2' : 'w-full'}
    >
      <div className="bg-white rounded-full shadow-lg flex items-center px-4 py-2.5 gap-2 border border-gray-200">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar zona, ej: Plan 3000"
          className="flex-1 outline-none text-base bg-transparent"
        />
        {buscando && <span className="text-xs text-gray-400 flex-shrink-0">Buscando...</span>}
      </div>
      {errorZona && (
        <p className="text-red-600 text-sm bg-white rounded-lg px-3 py-1.5 mt-1.5 shadow text-center">
          {errorZona}
        </p>
      )}
    </form>
  );
}