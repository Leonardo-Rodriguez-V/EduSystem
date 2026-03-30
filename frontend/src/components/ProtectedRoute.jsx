import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const usuarioRaw = localStorage.getItem('usuario');
  const token = localStorage.getItem('token');

  // Si falta cualquiera de los dos, sesión inválida
  if (!usuarioRaw || !token) {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  const usuario = JSON.parse(usuarioRaw);

  if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
    console.warn(`Acceso denegado para el rol: ${usuario.rol}`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
