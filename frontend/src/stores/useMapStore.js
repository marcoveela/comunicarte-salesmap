// frontend/src/stores/useMapStore.js
import { create } from 'zustand';

export const useMapStore = create((set) => ({
  colegios: [],
  cargando: false,
  error: null,
  colegioSeleccionadoId: null,

  setColegios: (colegios) => set({ colegios, colegioSeleccionadoId: null }),
  setCargando: (cargando) => set({ cargando }),
  setError: (error) => set({ error }),
  seleccionarColegio: (id) => set({ colegioSeleccionadoId: id }),
  cerrarDetalle: () => set({ colegioSeleccionadoId: null }),
}));