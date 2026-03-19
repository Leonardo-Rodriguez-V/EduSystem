import { Navigate } from 'react-router-dom';

/**
 * Componente para proteger rutas privadas y restringir por roles.
 * @param {Array} allowedRoles - Lista de roles permitidos (opcional)
 */
function ProtectedRoute({ children, allowedRoles }) {
  const usuarioRaw = localStorage.getItem('usuario');
  
  if (!usuarioRaw) {
    return <Navigate to="/login" replace />;
  }

  const usuario = JSON.parse(usuarioRaw);

  // Si se especifican roles permitidos y el rol del usuario no está incluido
  if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
    console.warn(`Acceso denegado para el rol: ${usuario.rol}`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
