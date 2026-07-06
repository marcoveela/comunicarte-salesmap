// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

// Patrón sutil de líneas de contorno topográfico — referencia a cartografía,
// sin competir visualmente con el mapa real de Leaflet una vez adentro.
function PatronTopografico() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.08]"
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid slice"
    >
      {[...Array(8)].map((_, i) => (
        <path
          key={i}
          d={`M -50 ${100 + i * 90} Q 200 ${50 + i * 90}, 400 ${100 + i * 90} T 850 ${100 + i * 90}`}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand relative overflow-hidden px-4">
      <PatronTopografico />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            Comunicarte
          </h1>
          <p className="font-mono text-xs text-brand-light/70 tracking-widest uppercase mt-1">
            SalesMap
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <label className="block text-sm font-medium text-ink mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-route/30 rounded-xl px-4 py-3 mb-4 text-base
                       focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent
                       transition"
            placeholder="tu@comunicarte.com.bo"
          />

          <label className="block text-sm font-medium text-ink mb-1.5">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-route/30 rounded-xl px-4 py-3 mb-5 text-base
                       focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent
                       transition"
            placeholder="••••••••"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3.5
                       rounded-xl text-base transition disabled:opacity-50
                       disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-brand-light/50 text-xs mt-6 font-mono">
          Herramienta interna · Editorial Comunicarte
        </p>
      </div>
    </div>
  );
}