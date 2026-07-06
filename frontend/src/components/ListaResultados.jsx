// frontend/src/components/ListaResultados.jsx
import { useMapStore } from '../stores/useMapStore';

export default function ListaResultados() {
  const colegios = useMapStore((s) => s.colegios);
  const seleccionarColegio = useMapStore((s) => s.seleccionarColegio);

  if (colegios.length === 0) return null;

  return (
    <div className="absolute z-[900] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex flex-col
                    bottom-0 left-0 right-0 rounded-t-3xl max-h-[45vh]">
      <div className="bg-white border-b border-gray-100 p-4 shrink-0">
        <h3 className="font-bold text-gray-800 text-lg">Resultados de la zona</h3>
        <p className="text-sm text-gray-500">{colegios.length} instituciones encontradas</p>
      </div>

      <div className="overflow-y-auto flex-1 bg-gray-50 p-2">
        <div className="flex flex-col gap-2">
          {colegios.map((c) => (
            <button
              key={c.id}
              onClick={() => seleccionarColegio(c.id)}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-left hover:shadow-md hover:border-blue-200 transition-all group flex flex-col gap-1 active:scale-[0.98]"
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
    </div>
  );
}