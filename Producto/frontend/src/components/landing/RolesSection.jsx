import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const ROLES = [
  {
    emoji: '👨‍💼',
    title: 'Director',
    color: '#4f46e5',
    desc: 'Gestiona la institución con visión global',
    features: ['Informes de gestión', 'Supervisión de personal', 'Configuración del sistema'],
  },
  {
    emoji: '👨‍🏫',
    title: 'Profesor',
    color: '#22c55e',
    desc: 'Administra tu curso de forma eficiente',
    features: ['Control de asistencia', 'Registro de calificaciones', 'Material didáctico'],
  },
  {
    emoji: '👩‍👦',
    title: 'Apoderado',
    color: '#818cf8',
    desc: 'Mantente conectado con el progreso de tu hijo',
    features: ['Seguimiento de calificaciones', 'Control de asistencias', 'Comunicaciones'],
  },
];

export default function RolesSection() {
  return (
    <section id="roles" style={{ background: '#1a1a3e', padding: '90px 32px' }}>
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
            background: 'rgba(79,70,229,0.12)', borderRadius: 20,
            padding: '5px 14px', marginBottom: 16,
            border: '1px solid rgba(79,70,229,0.25)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: '0.07em' }}>
              ROLES
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900,
            fontFamily: "'Crimson Pro', serif",
            color: '#fff', margin: 0,
          }}>
            ¿Para quién es EduSystem?
          </h2>
        </motion.div>

        {/* Cards de roles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {ROLES.map(({ emoji, title, color, desc, features }, i) => (
            <motion.div
              key={title}
              className="landing-glass-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              style={{
                padding: '36px 28px',
                borderTop: `3px solid ${color}`,
                cursor: 'default',
              }}
            >
              {/* Avatar */}
              <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>{emoji}</div>

              {/* Título y descripción */}
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                {title}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', marginBottom: 24, lineHeight: 1.5 }}>
                {desc}
              </div>

              {/* Lista de features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {features.map((feat) => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle size={16} color={color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
