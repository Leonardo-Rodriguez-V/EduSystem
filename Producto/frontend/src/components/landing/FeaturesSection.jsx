import { BarChart3, CheckSquare, FileEdit, CalendarDays } from 'lucide-react';

const features = [
  { icon: BarChart3,   title: 'Dashboard',       desc: 'Ver informes detallados de tu institución en tiempo real.' },
  { icon: CheckSquare, title: 'Asistencia',       desc: 'Registro y seguimiento diario de estudiantes y personal.' },
  { icon: FileEdit,    title: 'Gestión de notas', desc: 'Ingreso y control de calificaciones por curso y materia.' },
  { icon: CalendarDays,title: 'Calendario',       desc: 'Planificación de eventos académicos y actividades.' },
];

export default function FeaturesSection() {
  return (
    <section id="features" style={{ position: 'relative', padding: '80px 24px' }}>
      <div style={{ margin: '0 auto', maxWidth: 1200 }}>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, marginBottom: 48, fontFamily: "'Crimson Pro', serif" }}>
          Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass" style={{ padding: 24 }}>
              <div style={{
                marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              }}>
                <Icon size={22} color="white" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, fontFamily: "'Crimson Pro', serif" }}>{title}</h3>
              <p className="text-translucent" style={{ fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
