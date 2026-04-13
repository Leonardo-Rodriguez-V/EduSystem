import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';
import { 
  Activity, 
  GraduationCap, 
  Bell, 
  User, 
  Calendar,
  ChevronRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

const s = {
  container:  { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  pageTitle:  { fontSize: '28px', fontWeight: 800, color: 'var(--color-foreground)', margin: 0 },
  pageSub:    { fontSize: '15px', color: '#64748b', marginTop: '4px', marginBottom: '32px' },
  bentoGrid:  { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' },
  card:       { padding: '24px', height: '100%', boxSizing: 'border-box' },
  kpiTitle:   { fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  kpiValue:   { fontSize: '42px', fontWeight: 900, color: 'var(--color-foreground)', marginBottom: '8px' },
  tbl:        { width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' },
  th:         { textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' },
  tr:         { background: 'var(--color-muted)', borderRadius: '12px' },
  td:         { padding: '12px 16px', fontSize: '14px', color: 'var(--color-foreground)' },
  badge:      (bg, color) => ({ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: bg, color, border: '1px solid var(--color-border)' }),
};

function colorEstado(e) {
  if (e === 'presente') return ['#dcfce7', '#15803d'];
  if (e === 'tardanza') return ['#fef3c7', '#b45309'];
  return ['#fee2e2', '#b91c1c'];
}

function colorNota(n) {
  const val = Number(n);
  if (!n && n !== 0) return ['#f1f5f9', '#64748b'];
  if (val >= 6) return ['#dcfce7', '#15803d'];
  if (val >= 4) return ['#fef3c7', '#b45309'];
  return ['#fee2e2', '#b91c1c'];
}

export default function PortalApoderado() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  const [alumnos,     setAlumnos]     = useState([]);
  const [alumno,      setAlumno]      = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [notas,       setNotas]       = useState([]);
  const [avisos,      setAvisos]      = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        const res = await apiFetch(`/alumnos/apoderado/${usuario.id}`);
        const data = await res?.json();
        if (Array.isArray(data) && data.length > 0) {
          setAlumnos(data);
          setAlumno(data[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    if (usuario.id) cargarAlumnos();
  }, [usuario.id]);

  useEffect(() => {
    if (!alumno) return;
    const cargarDetalles = async () => {
      setCargandoDetalle(true);
      try {
        const [resAsistencia, resNotas, resAvisos] = await Promise.all([
          apiFetch(`/asistencia/alumno/${alumno.id}`),
          apiFetch(`/notas?id_alumno=${alumno.id}`),
          alumno.id_curso ? apiFetch(`/avisos?id_curso=${alumno.id_curso}`) : Promise.resolve(null),
        ]);
        const [dataA, dataN, dataAv] = await Promise.all([
          resAsistencia?.json(),
          resNotas?.json(),
          resAvisos?.json(),
        ]);
        setAsistencias(Array.isArray(dataA) ? dataA : []);
        setNotas(Array.isArray(dataN) ? dataN : []);
        setAvisos(Array.isArray(dataAv) ? dataAv : []);
      } finally {
        setCargandoDetalle(false);
      }
    };
    cargarDetalles();
  }, [alumno]);

  const totalClases  = asistencias.length;
  const presentes    = asistencias.filter(a => a.estado === 'presente').length;
  const pctAsistencia = totalClases > 0 ? ((presentes / totalClases) * 100).toFixed(1) : '—';
  const promN = notas.length > 0
    ? (notas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notas.length).toFixed(1)
    : '—';

  if (cargando) return <div style={{ padding: '100px', textAlign: 'center' }}><TrendingUp className="animate-pulse" size={48} color="var(--color-primary)" /></div>;

  if (!alumno) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div className="clay-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px' }}>
        <User size={64} color="#94a3b8" style={{ marginBottom: '20px' }} />
        <h2 style={s.pageTitle}>Sin Alumnos Vinculados</h2>
        <p style={{ color: '#64748b' }}>No hemos encontrado estudiantes asociados a tu cuenta de apoderado.</p>
      </div>
    </div>
  );

  return (
    <div style={s.container}>
      <h1 style={s.pageTitle}>Portal del Apoderado</h1>
      <p style={s.pageSub}>Información académica en tiempo real</p>
      
      {alumnos.length > 1 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', padding: '8px' }}>
          {alumnos.map(a => (
            <button
              key={a.id}
              onClick={() => setAlumno(a)}
              className={alumno?.id === a.id ? "clay-button" : "clay-card"}
              style={{
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: alumno?.id === a.id ? 'none' : '2px solid white',
                borderRadius: '16px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '14px',
                fontWeight: 700
              }}
            >
              <User size={16} />
              {a.nombre_completo.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div style={{ ...s.bentoGrid, opacity: cargandoDetalle ? 0.6 : 1, transition: 'opacity 0.3s' }}>
        
        {/* Profile Card */}
        <div className="clay-card" style={{ ...s.card, gridColumn: 'span 4', gridRow: 'span 1', background: 'linear-gradient(135deg, var(--color-surface), var(--color-background))' }}>
          <div style={{ background: 'var(--color-primary)', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '16px' }}>
            <User size={24} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>{alumno.nombre_completo}</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{alumno.nombre_curso} · 2026</p>
        </div>

        {/* Attendance Score */}
        <div className="clay-card" style={{ ...s.card, gridColumn: 'span 4', textAlign: 'center' }}>
          <div style={s.kpiTitle}><Activity size={16} color="#059669" /> Asistencia</div>
          <div style={{ ...s.kpiValue, color: Number(pctAsistencia) < 85 ? '#dc2626' : '#059669' }}>{pctAsistencia}%</div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{presentes} de {totalClases} clases presentes</p>
        </div>

        {/* General average */}
        <div className="clay-card" style={{ ...s.card, gridColumn: 'span 4', textAlign: 'center' }}>
          <div style={s.kpiTitle}><GraduationCap size={16} color="var(--color-accent)" /> Promedio</div>
          <div style={{ ...s.kpiValue, color: colorNota(promN)[1] }}>{promN}</div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{notas.length} evaluaciones registradas</p>
        </div>

        {/* Notices / Announcements */}
        <div className="clay-card" style={{ ...s.card, gridColumn: 'span 5', gridRow: 'span 2' }}>
          <div style={s.kpiTitle}><Bell size={16} color="var(--color-primary)" /> Avisos del Curso</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {avisos.length === 0 ? (
              <p style={{ color: '#cbd5e1', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Sin avisos nuevos</p>
            ) : (
              avisos.slice(0, 4).map(a => (
                <div key={a.id} style={{ paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                   <div style={{ fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><MessageSquare size={14} color="#94a3b8" /> {a.titulo}</div>
                   <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>{a.mensaje}</p>
                   <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(a.creado_en).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Grades Table */}
        <div className="clay-card" style={{ ...s.card, gridColumn: 'span 7' }}>
          <div style={s.kpiTitle}><TrendingUp size={16} color="var(--color-primary)" /> Últimas Calificaciones</div>
          <table style={s.tbl}>
            <thead>
              <tr>
                <th style={s.th}>Evaluación</th>
                <th style={s.th}>Fecha</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Nota</th>
              </tr>
            </thead>
            <tbody>
              {notas.slice(0, 5).map(n => (
                <tr key={n.id} style={s.tr}>
                  <td style={{ ...s.td, fontWeight: 700, borderRadius: '12px 0 0 12px' }}>{n.descripcion}</td>
                  <td style={s.td}>{new Date(n.fecha).toLocaleDateString()}</td>
                  <td style={{ ...s.td, textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                    <div style={s.badge(...colorNota(n.calificacion))}>{parseFloat(n.calificacion).toFixed(1)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mini attendance history */}
        <div className="clay-card" style={{ ...s.card, gridColumn: 'span 7' }}>
          <div style={s.kpiTitle}><Calendar size={16} color="var(--color-primary)" /> Registro de Asistencia Reciente</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            {asistencias.slice(0, 14).map(as => (
              <div key={as.id} style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '12px', 
                background: colorEstado(as.estado)[0], 
                color: colorEstado(as.estado)[1],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 900,
                boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.4)'
              }} title={`${as.fecha}: ${as.estado}`}>
                {as.estado[0].toUpperCase()}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
