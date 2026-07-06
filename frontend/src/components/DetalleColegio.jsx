// frontend/src/components/DetalleColegio.jsx
import { useMapStore } from '../stores/useMapStore';
import { useFichaColegio } from '../hooks/useFichaColegio';
import FichaColegioContenido from './FichaColegioContenido';

export default function DetalleColegio() {
  const colegioId = useMapStore((s) => s.colegioSeleccionadoId);
  const cerrarDetalle = useMapStore((s) => s.cerrarDetalle);
  const { detalle, cargando, error } = useFichaColegio(colegioId);

  if (!colegioId) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/40 flex items-end"
      onClick={cerrarDetalle}
    >
      <div
        className="bg-gray-50 w-full rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="font-bold text-gray-900 text-lg truncate pr-4">
            {detalle?.nombre || 'Cargando...'}
          </h2>
          <button onClick={cerrarDetalle} className="text-gray-400 hover:text-gray-700 p-1 flex-shrink-0" aria-label="Cerrar">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-6">
          <FichaColegioContenido detalle={detalle} cargando={cargando} error={error} />
        </div>
      </div>
    </div>
  );
}