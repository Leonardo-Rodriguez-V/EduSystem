import { Navigate } from 'react-router-dom';

/**
 * Componente para proteger rutas privadas.
 * Verifica si existe un usuario en localStorage.
 * Si no existe, redirige al login.
 */
function ProtectedRoute({ children }) {
  const usuario = localStorage.getItem('usuario');

  if (!usuario) {
    // Si no hay usuario, redirigir a Login
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, renderizar los componentes hijos
  return children;
}

export default ProtectedRoute;
