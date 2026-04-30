import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';

const LINKS = [
  { label: 'Inicio',          href: '#inicio' },
  { label: 'Características', href: '#features' },
  { label: 'Roles',           href: '#roles' },
  { label: 'Contacto',        href: '#contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const usuario = (() => {
    try { return JSON.parse(localStorage.getItem('usuario')); }
    catch { return null; }
  })();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const irAlPortal = () => navigate(usuario ? '/dashboard' : '/login');

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '64px', padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(15,12,41,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
      transition: 'all 0.35s ease',
    }}>

      {/* Logo */}
      <div
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div className="aura-orb" style={{
          width: 38, height: 38, borderRadius: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <GraduationCap size={20} color="white" />
        </div>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px' }}>
          EduSystem
        </span>
      </div>

      {/* Links desktop */}
      <div className="nav-desktop" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        {LINKS.map(({ label, href }) => (
          <a key={label} href={href} style={{
            color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500,
            textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.65)'}
          >
            {label}
          </a>
        ))}
        <button
          id="navbar-cta-btn"
          className="landing-btn-primary"
          style={{ padding: '9px 22px', fontSize: 14 }}
          onClick={irAlPortal}
        >
          {usuario ? 'Ir al Dashboard' : 'Iniciar Sesión'}
        </button>
      </div>

      {/* Botón hamburguesa móvil */}
      <button
        className="nav-mobile-btn"
        onClick={() => setMenuAbierto(!menuAbierto)}
        style={{
          display: 'none', background: 'none', border: 'none',
          color: '#fff', cursor: 'pointer', padding: 4,
        }}
      >
        {menuAbierto ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menú desplegable móvil */}
      {menuAbierto && (
        <div style={{
          position: 'absolute', top: '64px', left: 0, right: 0,
          background: 'rgba(15,12,41,0.97)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {LINKS.map(({ label, href }) => (
            <a key={label} href={href}
              onClick={() => setMenuAbierto(false)}
              style={{
                color: 'rgba(255,255,255,0.85)', fontSize: 16,
                fontWeight: 500, textDecoration: 'none',
              }}>
              {label}
            </a>
          ))}
          <button className="landing-btn-primary" onClick={irAlPortal}>
            {usuario ? 'Ir al Dashboard' : 'Iniciar Sesión'}
          </button>
        </div>
      )}
    </nav>
  );
}
