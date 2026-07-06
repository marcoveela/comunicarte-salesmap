// frontend/src/App.jsx
import MapaZonas from './components/MapaZonas'
import Login from './pages/Login'
import { useAuthStore } from './stores/useAuthStore'

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const rol = useAuthStore((s) => s.rol)
  const logout = useAuthStore((s) => s.logout)

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      <header className="bg-brand text-white px-5 py-4 shadow-md flex justify-between items-center z-10 relative">
        <h1 className="font-display font-bold text-lg tracking-tight">Comunicarte</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-wide bg-white/10 px-3 py-1.5 rounded-full">
            {rol || 'Vendedor'}
          </span>
          <button
            onClick={logout}
            className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 relative w-full h-full">
        <MapaZonas />
      </main>
    </div>
  )
}

export default App