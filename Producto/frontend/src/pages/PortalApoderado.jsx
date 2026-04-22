import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';
import {
  Activity,
  GraduationCap,
  Bell,
  User,
  Calendar,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';

function colorEstado(e) {
  if (e === 'presente') return { bg: 'rgba(21,128,61,0.15)',  text: '#15803d' };
  if (e === 'tardanza') return { bg: 'rgba(180,83,9,0.15)',   text: '#b45309' };
  return                       { bg: 'rgba(185,28,28,0.15)', text: '#b91c1c' };
}

function colorNota(n) {
  const val = Number(n);
  if (!n && n !== 0) return ['var(--color-muted)', 'var(--color-foreground)'];
  if (val >= 6) return ['rgba(21,128,61,0.15)',  '#15803d'];
  if (val >= 4) return ['rgba(180,83,9,0.12)',   '#b45309'];
  return               ['rgba(185,28,28,0.12)', '#b91c1c'];
}

const s = {
  container: { padding: '0 0 40px', maxWidth: '1200px', margin: '0 auto' },
  pageTitle: { fontSize: '30px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, fontFamily: "'Crimson Pro', serif" },
  pageSub:   { fontSize: '15px', color: 'var(--color-foreground)', opacity: 0.5, marginTop: '4px', marginBottom: '32px', fontWeight: 600 },
  bentoGrid: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' },
  card:      { padding: '24px', height: '100%', boxSizing: 'border-box' },
  kpiTitle:  { fontSize: '12px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  kpiValue:  { fontSize: '42px', fontWeight: 900, color: 'var(--color-foreground)', marginBottom: '8px', lineHeight: 1 },
  tbl:       { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' },
  th:        { textAlign: 'left', padding: '0 16px', fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.08em' },
  tr:        { background: 'var(--color-muted)', borderRadius: '12px' },
  td:        { padding: '12px 16px', fontSize: '14px', color: 'var(--color-foreground)', fontWeight: 600 },
};

export default function PortalApoderado() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  const [alumnos,          setAlumnos]          = useState([]);
  const [alumno,           setAlumno]           = useState(null);
  const [asistencias,      setAsistencias]      = useState([]);
  const [notas,            setNotas]            = useState([]);
  const [avisos,           setAvisos]           = useState([]);
  const [cargando,         setCargando]         = useState(true);
  const [cargandoDetalle,  setCargandoDetalle]  = useState(false);
  const [justModal,        setJustModal]        = useState(null); // asistencia a justificar
  const [justTexto,        setJustTexto]        = useState('');
  const [guardandoJust,    setGuardandoJust]    = useState(false);

  useEffect(() => {
    if (!usuario.id) return;
    apiFetch(`/alumnos/apoderado/${usuario.id}`)
      .then(r => r?.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAlumnos(data);
          setAlumno(data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [usuario.id]);

  useEffect(() => {
    if (!alumno) return;
    setCargandoDetalle(true);
    Promise.all([
      apiFetch(`/asistencia/alumno/${alumno.id}`).then(r => r?.json()).catch(() => []),
      apiFetch(`/notas?id_alumno=${alumno.id}`).then(r => r?.json()).catch(() => []),
      alumno.id_curso
        ? apiFetch(`/avisos?id_curso=${alumno.id_curso}`).then(r => r?.json()).catch(() => [])
        : Promise.resolve([]),
    ]).then(([dataA, dataN, dataAv]) => {
      setAsistencias(Array.isArray(dataA) ? dataA : []);
      setNotas(Array.isArray(dataN) ? dataN : []);
      setAvisos(Array.isArray(dataAv) ? dataAv : []);
    }).finally(() => setCargandoDetalle(false));
  }, [alumno]);

  const totalClases    = asistencias.length;
  const presentes      = asistencias.filter(a => a.estado === 'presente').length;
  const pctAsistencia  = totalClases > 0 ? ((presentes / totalClases) * 100).toFixed(1) : '—';
  const promN = notas.length > 0
    ? (notas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notas.length).toFixed(1)
    : '—';
  const asistColor = Number(pctAsistencia) < 85 ? '#ef4444' : '#10b981';
  const [notaBg, notaText] = colorNota(promN);

  const abrirJustificar = (as) => {
    setJustModal(as);
    setJustTexto(as.justificacion || '');
  };

  const guardarJustificacion = async () => {
    if (!justModal || !justTexto.trim()) return;
    setGuardandoJust(true);
    try {
      const res = await apiFetch(`/asistencia/${justModal.id}/justificar`, {
        method: 'PUT',
        body: JSON.stringify({ justificacion: justTexto }),
      });
      if (res?.ok) {
        setAsistencias(prev => prev.map(a => a.id === justModal.id ? { ...a, justificacion: justTexto } : a));
        setJustModal(null);
      }
    } finally {
      setGuardandoJust(false);
    }
  };

  if (cargando) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
    </div>
  );

  if (!alumno) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div className="clay-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px', borderRadius: '28px' }}>
        <div style={{ background: 'var(--color-muted)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--color-primary)' }}>
          <User size={40} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '8px' }}>Sin Alumnos Vinculados</h2>
        <p style={{ color: 'var(--color-foreground)', opacity: 0.5, fontSize: '14px' }}>No se encontraron estudiantes asociados a tu cuenta.</p>
      </div>
    </div>
  );

  return (
    <div style={s.container}>

      {/* Modal justificar inasistencia */}
      {justModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setJustModal(null)}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', border: '1px solid var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '6px' }}>Justificar inasistencia</div>
            <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.5, marginBottom: '18px' }}>
              Fecha: {new Date(justModal.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <textarea
              value={justTexto}
              onChange={e => setJustTexto(e.target.value)}
              placeholder="Ej: El alumno tuvo una consulta médica, se adjunta certificado..."
              style={{ width: '100%', minHeight: '100px', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-muted)', color: 'var(--color-foreground)', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '18px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setJustModal(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-foreground)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={guardarJustificacion} disabled={guardandoJust || !justTexto.trim()}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px', opacity: (guardandoJust || !justTexto.trim()) ? 0.6 : 1 }}>
                {guardandoJust ? 'Guardando...' : 'Guardar justificación'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 style={s.pageTitle}>Portal del Apoderado</h1>
      <p style={s.pageSub}>Información académica en tiempo real</p>

      {/* Selector de hijo */}
      {alumnos.length > 1 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', padding: '4px' }}>
          {alumnos.map(a => (
            <button
              key={a.id}
              onClick={() => setAlumno(a)}
              style={{
                padding: '10px 20px',
                display: 'flex', alignItems: 'center', gap: '8px',
                borderRadius: '16px', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: '14px', fontWeight: 700, border: 'none',
                background: alumno?.id === a.id ? 'var(--color-primary)' : 'var(--color-muted)',
                color: alumno?.id === a.id ? '#fff' : 'var(--color-foreground)',
                transition: 'all 0.2s',
              }}
            >
              <User size={16} />
              {a.nombre_completo.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div style={{ ...s.bentoGrid, opacity: cargandoDetalle ? 0.6 : 1, transition: 'opacity 0.3s' }}>

        {/* Perfil del alumno */}
        <motion.div className="clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ ...s.card, gridColumn: 'span 4' }}>
          <div style={{ background: 'var(--color-primary)', width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '16px', fontSize: '20px', fontWeight: 900 }}>
            {alumno.nombre_completo.split(' ').slice(0, 2).map(p => p[0]).join('')}
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-foreground)', margin: '0 0 6px' }}>{alumno.nombre_completo}</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.5, margin: 0, fontWeight: 600 }}>{alumno.nombre_curso} · 2026</p>
        </motion.div>

        {/* Asistencia */}
        <motion.div className="clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ ...s.card, gridColumn: 'span 4', textAlign: 'center' }}>
          <div style={s.kpiTitle}><Activity size={15} color="#10b981" /> Asistencia</div>
          <div style={{ ...s.kpiValue, color: asistColor }}>{pctAsistencia}%</div>
          <p style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.45, margin: 0 }}>{presentes} de {totalClases} clases</p>
        </motion.div>

        {/* Promedio */}
        <motion.div className="clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ ...s.card, gridColumn: 'span 4', textAlign: 'center' }}>
          <div style={s.kpiTitle}><GraduationCap size={15} color="var(--color-primary)" /> Promedio</div>
          <div style={{ ...s.kpiValue, color: notaText }}>{promN}</div>
          <p style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.45, margin: 0 }}>{notas.length} evaluaciones</p>
        </motion.div>

        {/* Avisos del curso */}
        <motion.div className="clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ ...s.card, gridColumn: 'span 5', gridRow: 'span 2' }}>
          <div style={s.kpiTitle}><Bell size={15} color="var(--color-primary)" /> Avisos del Curso</div>
          {avisos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <Bell size={32} color="var(--color-foreground)" style={{ opacity: 0.2, marginBottom: '10px' }} />
              <p style={{ color: 'var(--color-foreground)', opacity: 0.35, fontSize: '14px', fontWeight: 600 }}>Sin avisos nuevos</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
              {avisos.slice(0, 4).map(a => (
                <div key={a.id} style={{ paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={13} color="var(--color-primary)" />
                    {a.titulo}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.55, marginTop: '6px', lineHeight: 1.5 }}>{a.mensaje}</p>
                  <span style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.35, fontWeight: 600 }}>
                    {new Date(a.creado_en).toLocaleDateString('es-CL')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Últimas calificaciones */}
        <motion.div className="clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ ...s.card, gridColumn: 'span 7' }}>
          <div style={s.kpiTitle}><TrendingUp size={15} color="var(--color-primary)" /> Últimas Calificaciones</div>
          {notas.length === 0 ? (
            <p style={{ color: 'var(--color-foreground)', opacity: 0.35, fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Sin notas registradas</p>
          ) : (
            <table style={s.tbl}>
              <thead>
                <tr>
                  <th style={s.th}>Evaluación</th>
                  <th style={s.th}>Fecha</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Nota</th>
                </tr>
              </thead>
              <tbody>
                {notas.slice(0, 5).map(n => {
                  const [bg, text] = colorNota(n.calificacion);
                  return (
                    <tr key={n.id} style={s.tr}>
                      <td style={{ ...s.td, fontWeight: 700, borderRadius: '12px 0 0 12px' }}>{n.descripcion}</td>
                      <td style={s.td}>{new Date(n.fecha).toLocaleDateString('es-CL')}</td>
                      <td style={{ ...s.td, textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, background: bg, color: text }}>
                          {parseFloat(n.calificacion).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Historial de asistencia reciente */}
        <motion.div className="clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ ...s.card, gridColumn: 'span 7' }}>
          <div style={s.kpiTitle}><Calendar size={15} color="var(--color-primary)" /> Asistencia Reciente</div>
          {asistencias.length === 0 ? (
            <p style={{ color: 'var(--color-foreground)', opacity: 0.35, fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Sin registros de asistencia</p>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', marginBottom: '12px' }}>
                {asistencias.slice(0, 21).map(as => {
                  const c = colorEstado(as.estado);
                  const esAusente = as.estado === 'ausente';
                  const justificada = esAusente && as.justificacion;
                  return (
                    <div key={as.id}
                      title={as.justificacion ? `Justificado: ${as.justificacion}` : `${as.fecha}: ${as.estado}`}
                      onClick={() => esAusente ? abrirJustificar(as) : undefined}
                      style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: justificada ? 'rgba(99,102,241,0.15)' : c.bg,
                        color: justificada ? 'var(--color-primary)' : c.text,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 900,
                        cursor: esAusente ? 'pointer' : 'default',
                        border: justificada ? '2px solid var(--color-primary)' : '2px solid transparent',
                        position: 'relative',
                        transition: 'all 0.15s',
                      }}>
                      {justificada ? 'J' : as.estado[0].toUpperCase()}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.45, fontWeight: 600 }}>
                Haz clic en una <span style={{ color: 'var(--color-destructive)', fontWeight: 700 }}>A</span> para justificar la inasistencia · <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>J</span> = justificada
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
