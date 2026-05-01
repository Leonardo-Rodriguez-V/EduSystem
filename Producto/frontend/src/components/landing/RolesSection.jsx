import { Check, UserCog, BookOpen, Users } from 'lucide-react';
import laptopImg from '../../assets/laptop.png';

const roles = [
  {
    icon: UserCog, title: 'Director',
    items: ['Informes de gestión', 'Supervisión de personal', 'Configuración del sistema'],
  },
  {
    icon: BookOpen, title: 'Profesor',
    items: ['Control de asistencia', 'Registro de calificaciones', 'Material didáctico'],
  },
  {
    icon: Users, title: 'Apoderado',
    items: ['Seguimiento de calificaciones', 'Control de asistencias', 'Comunicaciones'],
  },
];

export default function RolesSection() {
  return (
    <section id="roles" style={{ position: 'relative', padding: '96px 24px' }}>
      <div style={{ margin: '0 auto', maxWidth: 1200 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, fontFamily: "'Crimson Pro', serif" }}>
            Una plataforma, tres miradas
          </h2>
          <p className="text-translucent" style={{ marginTop: 12, fontSize: 16 }}>
            Diseñada para cada actor de la comunidad escolar.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          {/* Imagen laptop de fondo */}
          <img
            src={laptopImg}
            alt=""
            aria-hidden
            loading="lazy"
            style={{
              position: 'absolute', left: 0, right: 0, bottom: -40,
              margin: '0 auto', width: '110%', maxWidth: 'none',
              opacity: 0.35, pointerEvents: 'none', userSelect: 'none',
            }}
          />

          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {roles.map(({ icon: Icon, title, items }) => (
              <div key={title} className="glass" style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #d946ef)',
                  boxShadow: '0 8px 30px rgba(139,92,246,0.5)',
                  marginBottom: 20,
                }}>
                  <Icon size={28} color="white" />
                </div>
                <h3 style={{ fontSize: 28, fontWeight: 600, marginBottom: 20, fontFamily: "'Crimson Pro', serif" }}>{title}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.map((item) => (
                    <li key={item} className="text-translucent" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15 }}>
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(129,140,248,0.4)',
                        flexShrink: 0,
                      }}>
                        <Check size={11} color="#a5b4fc" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
