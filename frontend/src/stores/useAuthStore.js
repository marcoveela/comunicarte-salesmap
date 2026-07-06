// frontend/src/stores/useAuthStore.js
import { create } from 'zustand';

const STORAGE_KEY = 'salesmap_token';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem(STORAGE_KEY) || null,
  rol: null,

  isAuthenticated: () => !!get().token,

  login: async (email, password) => {
    const { api } = await import('../api/client');
    const data = await api.login(email, password);
    localStorage.setItem(STORAGE_KEY, data.access_token);
    set({ token: data.access_token, rol: data.rol });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, rol: null });
  },
}));