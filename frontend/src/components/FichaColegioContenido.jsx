// frontend/src/components/FichaColegioContenido.jsx
export default function FichaColegioContenido({ detalle, cargando, error }) {
  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm">Descargando información del colegio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center text-sm">
        {error}
      </div>
    );
  }

  if (!detalle) return null;

  const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${detalle.lat},${detalle.lng}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
          SIE: {detalle.codigo_sie}
        </span>
        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
          Turno: {detalle.turno || 'Sin dato'}
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Datos Administrativos</h3>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-gray-500 font-semibold mb-1">Director/a</dt>
            <dd className="text-gray-900 font-medium capitalize bg-gray-50 p-2 rounded">
              {detalle.director?.toLowerCase() || 'No registrado'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-semibold mb-1">Niveles</dt>
            <dd className="text-gray-900 font-medium bg-gray-50 p-2 rounded">
              {detalle.niveles?.join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-semibold mb-1">Matrícula ({detalle.anio_actual})</dt>
            <dd className="text-gray-900 font-medium bg-gray-50 p-2 rounded">
              {detalle.matricula_actual ?? '—'} estudiantes
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Contacto y Ubicación</h3>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-gray-500 font-semibold mb-1">Teléfono</dt>
            <dd className="text-gray-900 font-medium bg-gray-50 p-2 rounded">
              {detalle.telefono || 'Sin registro'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-semibold mb-1">Dirección</dt>
            <dd className="text-gray-900 font-medium bg-gray-50 p-2 rounded">
              {detalle.direccion || 'No registrada'}
            </dd>
          </div>
        </dl>
      </div>

      <a
        href={urlGoogleMaps}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-white border-2 border-brand text-brand hover:bg-blue-50 font-bold py-3 rounded-xl transition-colors"
      >
            Ver ubicación en Google Maps
      </a>

    </div>
  );
}