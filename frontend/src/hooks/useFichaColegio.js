// frontend/src/hooks/useFichaColegio.js
import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function useFichaColegio(colegioId) {
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [idAnterior, setIdAnterior] = useState(null);

  if (colegioId !== idAnterior) {
    setIdAnterior(colegioId);
    setDetalle(null);
    setError(null);
    if (colegioId) setCargando(true);
  }

  useEffect(() => {
    if (!colegioId) return;
    let cancelado = false;

    api
      .detalleColegio(colegioId)
      .then((data) => { if (!cancelado) { setDetalle(data); setCargando(false); } })
      .catch((err) => { if (!cancelado) { setError(err.message); setCargando(false); } });

    return () => { cancelado = true; };
  }, [colegioId]);

  return { detalle, cargando, error };
}