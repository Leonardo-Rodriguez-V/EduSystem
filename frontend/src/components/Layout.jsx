import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/* ──────────────────────────────────────────────
   Navegación por rol
────────────────────────────────────────────── */
const NAV_ITEMS = {
  director: [
    { label: 'Dashboard',        icon: '🏠', path: '/dashboard' },
    { label: 'Gestión Usuarios', icon: '👥', path: '/usuarios' },
    { label: 'Asistencia',       icon: '📋', path: '/asistencia' },
    { label: 'Notas',            icon: '📝', path: '/notas' },
    { label: 'Muro de Avisos',   icon: '📢', path: '/muro-avisos' },
    { label: 'Nuevo Usuario',    icon: '➕', path: '/registro' },
  ],
  profesor: [
    { label: 'Dashboard',      icon: '🏠', path: '/dashboard' },
    { label: 'Asistencia',     icon: '📋', path: '/asistencia' },
    { label: 'Notas',          icon: '📝', path: '/notas' },
    { label: 'Muro de Avisos', icon: '📢', path: '/muro-avisos' },
  ],
  apoderado: [
    { label: 'Dashboard',      icon: '🏠', path: '/dashboard' },
    { label: 'Mi Hijo',        icon: '👦', path: '/notas' },
    { label: 'Muro de Avisos', icon: '📢', path: '/muro-avisos' },
  ],
  alumno: [
    { label: 'Dashboard',  icon: '🏠', path: '/dashboard' },
    { label: 'Mis Notas',  icon: '📝', path: '/notas' },
  ],
};

const TITULO_POR_RUTA = {
  '/dashboard':    'Dashboard',
  '/usuarios':     'Gestión de Usuarios',
  '/asistencia':   'Pasar Lista',
  '/notas':        'Notas',
  '/muro-avisos':  'Muro de Avisos',
  '/reportes':     'Reportes',
  '/registro':     'Nuevo Usuario',
};

/* Obtiene las iniciales del nombre para el avatar */
function iniciales(nombre = '') {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

/* ──────────────────────────────────────────────
   Componente principal
────────────────────────────────────────────── */
export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const usuario = (() => {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const navItems = NAV_ITEMS[usuario?.rol] || [];
  const tituloPagina = TITULO_POR_RUTA[location.pathname] || 'EduSync';
  const rolLabel = {
    director: 'Portal Director',
    profesor: 'Portal Profesor',
    apoderado: 'Portal Apoderado',
    alumno: 'Portal Alumno',
  }[usuario?.rol] || 'EduSync';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F4F8', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '240px', minHeight: '100vh', background: '#0D47A1',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', left: 0, top: 0, zIndex: 100,
        transform: sidebarAbierto ? 'translateX(0)' : undefined,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,.15)' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '.5px' }}>EduSync</div>
          <div style={{ fontSize: '11px', color: '#BBDEFB', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{rolLabel}</div>
        </div>

        {/* Usuario */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%', background: '#42A5F5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#0D47A1', fontSize: '14px', flexShrink: 0,
          }}>
            {iniciales(usuario?.nombre_completo)}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{usuario?.nombre_completo}</div>
            <div style={{ fontSize: '11px', color: '#BBDEFB' }}>{usuario?.correo}</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {navItems.map(item => {
            const activo = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarAbierto(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 18px', cursor: 'pointer', textDecoration: 'none',
                  color: activo ? '#fff' : 'rgba(255,255,255,.75)',
                  fontSize: '13.5px',
                  background: activo ? 'rgba(255,255,255,.13)' : 'transparent',
                  borderLeft: activo ? '3px solid #42A5F5' : '3px solid transparent',
                  transition: 'all .2s',
                }}
              >
                <span style={{ fontSize: '17px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Cerrar sesión */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 8px', cursor: 'pointer', background: 'none', border: 'none',
              color: 'rgba(255,255,255,.6)', fontSize: '13px', borderRadius: '6px',
              width: '100%', transition: '.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,.6)'; }}
          >
            🔓 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Topbar */}
        <div style={{
          background: '#fff', padding: '14px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #E8EDF2', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1A2B4A' }}>{tituloPagina}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{
              fontSize: '12px', color: '#607D8B', background: '#F5F7FA',
              padding: '6px 12px', borderRadius: '20px',
            }}>
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Página */}
        <div style={{ padding: '24px 28px', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '12px', color: '#B0BEC5', fontSize: '12px', borderTop: '1px solid #E8EDF2', background: '#fff' }}>
          © 2024 EduSync — Sistema de Gestión Escolar
        </footer>
      </div>
    </div>
  );
}
