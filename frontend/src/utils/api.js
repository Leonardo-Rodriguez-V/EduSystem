const BASE_URL = 'http://localhost:3000/api';

// Fetch autenticado — agrega Authorization: Bearer <token> automáticamente
const apiFetch = async (endpoint, opciones = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opciones.headers,
  };

  const respuesta = await fetch(`${BASE_URL}${endpoint}`, {
    ...opciones,
    headers,
  });

  // Si el token expiró o es inválido, limpiar sesión y recargar
  if (respuesta.status === 401 || respuesta.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    return;
  }

  return respuesta;
};

export default apiFetch;
