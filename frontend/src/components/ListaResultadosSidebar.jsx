// frontend/src/components/ListaResultadosSidebar.jsx
import { useMapStore } from '../stores/useMapStore';

export default function ListaResultadosSidebar() {
  const colegios = useMapStore((s) => s.colegios);
  const seleccionarColegio = useMapStore((s) => s.seleccionarColegio);

  if (colegios.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <p className="text-gray-400 text-sm">
          Dibujá una zona en el mapa o buscá un barrio para ver los colegios de esa área.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-2">
      <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {colegios.length} {colegios.length === 1 ? 'institución encontrada' : 'instituciones encontradas'}
      </p>
      <div className="flex flex-col gap-2">
        {colegios.map((c) => (
          <button
            key={c.id}
            onClick={() => seleccionarColegio(c.id)}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-left hover:shadow-md hover:border-blue-200 transition-all group flex flex-col gap-1"
          >
            <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors leading-tight">
              {c.nombre}
            </h4>
            <div className="flex justify-between items-center w-full mt-1">
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                SIE: {c.codigo_sie}
              </span>
              <span className="text-xs text-blue-600 font-semibold group-hover:underline">
                Ver ficha ›
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}