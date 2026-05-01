import { useNavigate } from 'react-router-dom';
import dashboardImg from '../../assets/dashboard-mockup.png';

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section id="inicio" style={{ position: 'relative', paddingTop: 140, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
      <div style={{ margin: '0 auto', maxWidth: 1200, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>

        {/* Texto */}
        <div>
          <h1 style={{ fontSize: 'clamp(42px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.05, margin: '0 0 24px', fontFamily: "'Crimson Pro', serif" }}>
            Moderniza y <br />
            <span style={{
              background: 'linear-gradient(to right, #a5b4fc, #c4b5fd, #f0abfc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Digitaliza Tu Colegio
            </span>
          </h1>
          <p className="text-translucent" style={{ fontSize: 18, lineHeight: 1.7, maxWidth: 480, margin: '0 0 32px' }}>
            La plataforma integral para directores, profesores y apoderados.
            Gestión escolar simple, segura y moderna.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/login')}>Acceder al Portal</button>
            <button className="btn-ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver características
            </button>
          </div>
        </div>

        {/* Mockup flotante */}
        <div className="animate-float-mockup" style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: -32,
            background: 'linear-gradient(to top right, rgba(79,70,229,0.3), rgba(217,70,239,0.2))',
            filter: 'blur(48px)', borderRadius: '50%',
          }} />
          <img
            src={dashboardImg}
            alt="EduSystem Dashboard"
            style={{ position: 'relative', width: '100%', height: 'auto', filter: 'drop-shadow(0 20px 50px rgba(79,70,229,0.45))' }}
          />
        </div>
      </div>
    </section>
  );
}
