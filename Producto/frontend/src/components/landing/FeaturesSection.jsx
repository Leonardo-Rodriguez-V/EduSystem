import { motion } from 'framer-motion';
import { BarChart3, CheckSquare, FileText, Calendar } from 'lucide-react';

const FEATURES = [
  { icon: BarChart3,   title: 'Dashboard',       desc: 'Ver informes detallados',  color: '#4f46e5' },
  { icon: CheckSquare, title: 'Asistencia',       desc: 'Registro y seguimiento',   color: '#22c55e' },
  { icon: FileText,    title: 'Gestión de notas', desc: 'Ingreso y control',         color: '#818cf8' },
  { icon: Calendar,    title: 'Calendario',       desc: 'Planificación y eventos',   color: '#f59e0b' },
];

export default function FeaturesSection() {
  return (
    <section id="features" style={{ background: 'transparent', padding: '90px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginBottom: 52 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(129,140,248,0.12)', borderRadius: 20,
            padding: '5px 14px', marginBottom: 16,
            border: '1px solid rgba(129,140,248,0.25)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: '0.07em' }}>
              CARACTERÍSTICAS
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900,
            fontFamily: "'Crimson Pro', serif",
            color: '#fff', margin: 0,
          }}>
            Todo lo que tu institución necesita
          </h2>
        </motion.div>

        {/* Grid de features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              className="landing-glass-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              style={{ padding: '28px 24px', cursor: 'default' }}
            >
              {/* Ícono */}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${color}1a`,
                border: `1px solid ${color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <Icon size={22} color={color} />
              </div>

              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 7 }}>
                {title}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.6 }}>
                {desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
