const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class PlanError extends Error {
  constructor() {
    super('plan_requerido');
    this.code = 'plan_requerido';
  }
}

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

  if (respuesta.status === 403) {
    const body = await respuesta.json().catch(() => ({}));
    if (body.error === 'plan_requerido') throw new PlanError();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    return;
  }

  if (respuesta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    return;
  }

  return respuesta;
};

export default apiFetch;
