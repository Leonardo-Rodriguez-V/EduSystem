import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CtaBanner() {
  const navigate = useNavigate();

  return (
    <section style={{ background: '#1a1a3e', padding: '0 32px 80px' }}>
      <motion.div
        className="landing-glass-card"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '44px 52px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 32, flexWrap: 'wrap',
          background: 'rgba(79,70,229,0.1)',
          borderColor: 'rgba(79,70,229,0.25)',
          boxShadow: '0 0 60px rgba(79,70,229,0.12)',
        }}
      >
        <div>
          <h3 style={{
            fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900,
            fontFamily: "'Crimson Pro', serif",
            color: '#fff', margin: '0 0 10px',
          }}>
            Digitaliza Tu Colegio Hoy
          </h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.58)', margin: 0, maxWidth: 480 }}>
            Nuestra plataforma te ofrece todas las herramientas para una gestión escolar eficiente y moderna.
          </p>
        </div>
        <button
          id="cta-banner-btn"
          className="landing-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '14px 32px' }}
          onClick={() => navigate('/login')}
        >
          Acceder al Portal <ArrowRight size={16} />
        </button>
      </motion.div>
    </section>
  );
}
