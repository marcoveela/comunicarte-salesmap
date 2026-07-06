// frontend/src/api/client.js
import { useAuthStore } from '../stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

async function apiFetch(path, options = {}) {
  const token = useAuthStore.getState().token;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    // Token vencido o inválido: forzamos logout y dejamos que la UI
    // redirija sola al login (App.jsx reacciona al cambio de isAuthenticated)
    useAuthStore.getState().logout();
    throw new Error('Sesión expirada, iniciá sesión de nuevo');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  buscarColegios: (puntos, filtros = {}) =>
    apiFetch('/colegios/buscar', {
      method: 'POST',
      body: JSON.stringify({ puntos, ...filtros }),
    }),

  detalleColegio: (id) => apiFetch(`/colegios/${id}`),

  geocodificar: (nombre) =>
    apiFetch(`/geocoding/buscar?nombre=${encodeURIComponent(nombre)}`),
};