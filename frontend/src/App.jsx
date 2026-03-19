import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Registro from './pages/Registro';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    window.location.href = '/login'; // Recargar para limpiar estados de React si los hubiera
  };

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
                  {!usuarioGuardado ? (
                    <>
                      <Link to="/login" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Login</Link>
                      <Link to="/registro" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Registro</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Dashboard</Link>
                      {/* SOLO EL DIRECTOR VE USUARIOS Y REGISTRO */}
                      {usuarioGuardado.rol === 'director' && (
                        <>
                          <Link to="/usuarios" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Usuarios</Link>
                          <Link to="/registro" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Nuevo Usuario</Link>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {usuarioGuardado && (
                <div className="flex items-center space-x-4">
                  <div className="text-right mr-2">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{usuarioGuardado.nombre_completo}</p>
                    <p className="text-xs font-medium text-blue-600 capitalize">{usuarioGuardado.rol}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-transparent hover:border-rose-200"
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Navegación móvil */}
          <div className="md:hidden flex justify-around p-2 bg-slate-50 border-t border-slate-100">
            {!usuarioGuardado ? (
              <>
                <Link to="/login" className="text-xs font-bold text-slate-500 uppercase">Login</Link>
                <Link to="/registro" className="text-xs font-bold text-slate-500 uppercase">Registro</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-xs font-bold text-slate-500 uppercase">Dashboard</Link>
                {usuarioGuardado.rol === 'director' && (
                  <Link to="/usuarios" className="text-xs font-bold text-slate-500 uppercase">Usuarios</Link>
                )}
                <button onClick={handleLogout} className="text-xs font-bold text-rose-500 uppercase">Salir</button>
              </>
            )}
          </div>
        </nav>

        {/* Contenido de las Páginas */}
        <main className="flex-grow max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Registro protegido solo para directores */}
            <Route path="/registro" element={
              <ProtectedRoute allowedRoles={['director']}>
                <Registro />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/usuarios" element={
              <ProtectedRoute allowedRoles={['director']}>
                <Usuarios />
              </ProtectedRoute>
            } />

            {/* Ruta por defecto redirige a login o dashboard */}
            <Route path="/" element={<Navigate to={usuarioGuardado ? "/dashboard" : "/login"} replace />} />
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
