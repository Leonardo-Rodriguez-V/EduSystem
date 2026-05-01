import { useNavigate } from 'react-router-dom';

export default function CtaBanner() {
  const navigate = useNavigate();
  return (
    <section style={{ position: 'relative', padding: '0 24px 80px' }}>
      <div className="glass" style={{
        margin: '0 auto', maxWidth: 1200,
        padding: 'clamp(40px, 5vw, 56px)',
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 32,
      }}>
        <div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, fontFamily: "'Crimson Pro', serif" }}>
            Digitaliza Tu Colegio Hoy
          </h2>
          <p className="text-translucent" style={{ marginTop: 12, maxWidth: 480, lineHeight: 1.7 }}>
            Nuestra plataforma te ofrece todas las herramientas para una gestión escolar eficiente y moderna.
          </p>
        </div>
        <button className="btn-primary" style={{ fontSize: 16, whiteSpace: 'nowrap' }}
          onClick={() => navigate('/login')}>
          Acceder al Portal →
        </button>
      </div>
    </section>
  );
}
