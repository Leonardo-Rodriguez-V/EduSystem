import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function DashboardMockup() {
  return (
    <div style={{ padding: 16 }}>
      {/* Barra de título */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, alignItems: 'center' }}>
        {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
        ))}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 5, height: 11, marginLeft: 6 }} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Alumnos',   val: '128',  color: '#4f46e5' },
          { label: 'Asistencia', val: '94%',  color: '#22c55e' },
          { label: 'Promedio',  val: '6.1',  color: '#818cf8' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '10px 12px',
            border: `1px solid ${color}33`,
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de barras */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 10,
        padding: '12px 12px 8px', height: 88,
        display: 'flex', alignItems: 'flex-end', gap: 5,
      }}>
        {[42, 67, 53, 82, 61, 91, 74].map((h, i) => (
          <div key={i} style={{
            flex: 1, height: `${h}%`,
            background: i === 5 ? '#4f46e5' : 'rgba(79,70,229,0.28)',
            borderRadius: '4px 4px 0 0',
          }} />
        ))}
      </div>

      {/* Notificaciones mini */}
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { text: 'Nueva asistencia registrada', color: '#22c55e' },
          { text: '3 evaluaciones pendientes',   color: '#f59e0b' },
        ].map(({ text, color }, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: 8,
            padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section id="inicio" style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '100px 32px 80px',
    }}>

      {/* Contenido */}
      <div style={{
        maxWidth: 1200, width: '100%',
        display: 'flex', gap: 64, alignItems: 'center',
        position: 'relative', zIndex: 1,
        flexWrap: 'wrap',
      }}>

        {/* Columna izquierda: texto */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ flex: '1 1 340px' }}
        >
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(79,70,229,0.15)', borderRadius: 20,
            padding: '5px 14px', marginBottom: 24,
            border: '1px solid rgba(79,70,229,0.3)',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f46e5' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: '0.07em' }}>
              PLATAFORMA EDUCATIVA
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900,
            fontFamily: "'Crimson Pro', serif",
            color: '#fff', lineHeight: 1.15,
            margin: '0 0 20px', letterSpacing: '-1px',
          }}>
            Moderniza y<br />Digitaliza Tu Colegio
          </h1>

          <p style={{
            fontSize: 16, color: 'rgba(255,255,255,0.62)',
            lineHeight: 1.75, margin: '0 0 40px', maxWidth: 440,
          }}>
            La plataforma integral para directores, profesores y apoderados.
            Gestión académica moderna en un solo lugar.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button
              id="hero-acceder-btn"
              className="landing-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => navigate('/login')}
            >
              Acceder al Portal <ArrowRight size={16} />
            </button>
            <button
              id="hero-caracteristicas-btn"
              className="landing-btn-outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver características
            </button>
          </div>
        </motion.div>

        {/* Columna derecha: mockup */}
        <motion.div
          initial={{ opacity: 0, x: 30, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          style={{ flex: '1 1 380px', display: 'flex', justifyContent: 'center' }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '100%', maxWidth: 480 }}
          >
            <div className="landing-glass-card" style={{
              padding: 10,
              boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)',
            }}>
              <div style={{
                background: 'rgba(15,12,41,0.6)',
                borderRadius: 14, overflow: 'hidden',
              }}>
                {/* Topbar del mockup */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                    EduSystem · Dashboard
                  </span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                </div>
                <DashboardMockup />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
