import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Registro from './pages/Registro';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Barra de Navegación Simple */}
        <nav className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-2xl font-black text-blue-700 mr-8">EduSync</span>
                <div className="hidden md:flex space-x-8">
                  <Link to="/login" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Login</Link>
                  <Link to="/registro" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Registro</Link>
                  <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Dashboard</Link>
                  <Link to="/usuarios" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Usuarios</Link>
                </div>
              </div>
            </div>
          </div>
          {/* Navegación móvil (visible en pantallas pequeñas) */}
          <div className="md:hidden flex justify-around p-2 bg-slate-50 border-t border-slate-100">
            <Link to="/login" className="text-xs font-bold text-slate-500 uppercase">Login</Link>
            <Link to="/registro" className="text-xs font-bold text-slate-500 uppercase">Registro</Link>
            <Link to="/dashboard" className="text-xs font-bold text-slate-500 uppercase">Dashboard</Link>
            <Link to="/usuarios" className="text-xs font-bold text-slate-500 uppercase">Usuarios</Link>
          </div>
        </nav>

        {/* Contenido de las Páginas */}
        <main className="flex-grow max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usuarios" element={<Usuarios />} />
            {/* Ruta por defecto redirige a login */}
            <Route path="/" element={<Login />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-200 p-4 text-center text-slate-400 text-sm">
          &copy; 2024 EduSync - Sistema de Gestión Escolar
        </footer>
      </div>
    </Router>
  );
}

export default App;
