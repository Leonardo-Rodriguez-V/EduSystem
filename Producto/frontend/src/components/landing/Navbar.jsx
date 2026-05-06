import { useState } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const links = [
  { label: 'Inicio',          href: '#inicio' },
  { label: 'Características', href: '#features' },
  { label: 'Roles',           href: '#roles' },
  { label: 'Contacto',        href: '#contacto' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; } })();

  return (
    <header style={{ position: 'fixed', top: 16, left: 16, right: 16, zIndex: 50 }}>
      <nav className="glass" style={{
        margin: '0 auto', maxWidth: 1200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        {/* Logo */}
        <a href="#inicio" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: 20 }}>
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 12,
            background: '#4f46e5', boxShadow: '0 4px 20px rgba(79,70,229,0.5)',
          }}>
            <GraduationCap size={18} color="white" />
          </span>
          EduSystem
        </a>

        {/* Links desktop */}
        <ul className="nav-desktop" style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
          {links.map(({ label, href }) => (
            <li key={label}>
              <a href={href} className="text-translucent" style={{ textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.classList.contains('text-translucent') && (e.target.style.color = '')}>
                {label}
              </a>
            </li>
          ))}
        </ul>

        <button className="btn-primary" style={{ fontSize: 14, padding: '8px 18px' }}
          onClick={() => navigate(usuario ? '/dashboard' : '/login')}>
          {usuario ? 'Ir al Dashboard' : 'Iniciar Sesión'}
        </button>

        {/* Hamburger móvil */}
        <button className="nav-mobile-btn" onClick={() => setOpen(!open)}
          style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="glass" style={{ margin: '8px 0 0', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {links.map(({ label, href }) => (
            <a key={label} href={href} onClick={() => setOpen(false)} className="text-translucent" style={{ textDecoration: 'none', fontSize: 16 }}>
              {label}
            </a>
          ))}
          <button className="btn-primary" onClick={() => navigate(usuario ? '/dashboard' : '/login')}>
            {usuario ? 'Ir al Dashboard' : 'Iniciar Sesión'}
          </button>
        </div>
      )}
    </header>
  );
}
