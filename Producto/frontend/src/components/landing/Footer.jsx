import { GraduationCap } from 'lucide-react';

const LINKS = ['Inicio', 'Características', 'Roles', 'Contacto'];
const HREFS = { 'Inicio': '#inicio', 'Características': '#features', 'Roles': '#roles', 'Contacto': '#contacto' };

export default function Footer() {
  return (
    <footer id="contacto" style={{
      background: 'linear-gradient(180deg, #1a1a3e 0%, var(--color-bg-deep) 100%)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      padding: '36px 32px',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 24,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="aura-orb" style={{
            width: 34, height: 34, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <GraduationCap size={18} color="white" />
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>
            EduSystem
          </span>
        </div>

        {/* Links de navegación */}
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {LINKS.map((label) => (
            <a
              key={label}
              href={HREFS[label]}
              style={{
                color: 'rgba(255,255,255,0.4)', fontSize: 13,
                textDecoration: 'none', transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>
          © {new Date().getFullYear()} EduSystem · Sistema de Gestión Escolar
        </div>
      </div>
    </footer>
  );
}
