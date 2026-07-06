// frontend/src/components/DetalleColegioSidebar.jsx
import { useMapStore } from '../stores/useMapStore';
import { useFichaColegio } from '../hooks/useFichaColegio';
import FichaColegioContenido from './FichaColegioContenido';

export default function DetalleColegioSidebar({ colegioId }) {
  const cerrarDetalle = useMapStore((s) => s.cerrarDetalle);
  const { detalle, cargando, error } = useFichaColegio(colegioId);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center gap-3 px-4 py-3 z-10">
        <button onClick={cerrarDetalle} className="text-gray-500 hover:text-gray-800 p-1 flex-shrink-0" aria-label="Volver a resultados">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-bold text-gray-900 text-base truncate">
          {detalle?.nombre || 'Cargando...'}
        </h2>
      </div>
      <div className="p-4">
        <FichaColegioContenido detalle={detalle} cargando={cargando} error={error} />
      </div>
    </div>
  );
}