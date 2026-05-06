import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ position: 'relative', padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{
        margin: '0 auto', maxWidth: 1200,
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 24,
        fontSize: 14,
      }}>
        <a href="#inicio" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: 18 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: '#4f46e5' }}>
            <GraduationCap size={16} color="white" />
          </span>
          EduSystem
        </a>
        <p className="text-translucent">© {new Date().getFullYear()} EduSystem. Todos los derechos reservados.</p>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacidad', 'Términos', 'Contacto'].map((l) => (
            <a key={l} href="#" className="text-translucent" style={{ textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = ''}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
