import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';
import {
  Activity, GraduationCap, Bell, User,
  Calendar, TrendingUp, MessageSquare, BookOpen,
  ThumbsUp, ThumbsDown, AlertCircle,
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

function colorAnotacion(tipo) {
  if (tipo === 'positiva') return { bg: 'rgba(21,128,61,0.12)',  text: '#15803d', icon: ThumbsUp };
  if (tipo === 'negativa') return { bg: 'rgba(185,28,28,0.12)', text: '#b91c1c', icon: ThumbsDown };
  return { bg: 'rgba(99,102,241,0.10)', text: '#6366f1', icon: AlertCircle };
}

const s = {
  container: { padding: '0 0 48px', maxWidth: '1200px', margin: '0 auto' },
  pageTitle: { fontSize: '30px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, fontFamily: "'Crimson Pro', serif" },
  pageSub:   { fontSize: '15px', color: 'var(--color-foreground)', opacity: 0.5, marginTop: '4px', marginBottom: '32px', fontWeight: 600 },
  card:      { padding: '24px', height: '100%', boxSizing: 'border-box' },
  kpiTitle:  { fontSize: '12px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  kpiValue:  { fontSize: '42px', fontWeight: 900, color: 'var(--color-foreground)', marginBottom: '8px', lineHeight: 1 },
  tbl:       { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' },
  th:        { textAlign: 'left', padding: '0 16px', fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.08em' },
  tr:        { background: 'var(--color-muted)', borderRadius: '12px' },
  td:        { padding: '12px 16px', fontSize: '14px', color: 'var(--color-foreground)', fontWeight: 600 },
};

// Agrupación de notas por asignatura
function agruparNotas(notas) {
  const map = {};
  for (const n of notas) {
    const asig = n.nombre_asignatura || 'Sin asignatura';
    if (!map[asig]) map[asig] = [];
    map[asig].push(n);
  }
  return map;
}

export default function PortalAlumno() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  const [alumno,       setAlumno]       = useState(null);
  const [asistencias,  setAsistencias]  = useState([]);
  const [notas,        setNotas]        = useState([]);
  const [avisos,       setAvisos]       = useState([]);
  const [anotaciones,  setAnotaciones]  = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [tabActiva,    setTabActiva]    = useState('resumen');

  useEffect(() => {
    if (!usuario.id) return;
    // El alumno es el mismo usuario — buscamos sus datos como alumno por RUT o id directo
    apiFetch(`/alumnos/por-usuario/${usuario.id}`)
      .then(r => r?.json())
      .then(data => {
        if (data && data.id) setAlumno(data);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [usuario.id]);

  useEffect(() => {
    if (!alumno) return;
    Promise.all([
      apiFetch(`/asistencia/alumno/${alumno.id}`).then(r => r?.json()).catch(() => []),
      apiFetch(`/notas?id_alumno=${alumno.id}`).then(r => r?.json()).catch(() => []),
      alumno.id_curso
        ? apiFetch(`/avisos?id_curso=${alumno.id_curso}`).then(r => r?.json()).catch(() => [])
        : Promise.resolve([]),
      apiFetch(`/anotaciones?id_alumno=${alumno.id}`).then(r => r?.json()).catch(() => []),
    ]).then(([dataA, dataN, dataAv, dataAnot]) => {
      setAsistencias(Array.isArray(dataA)    ? dataA    : []);
      setNotas(Array.isArray(dataN)          ? dataN    : []);
      setAvisos(Array.isArray(dataAv)        ? dataAv   : []);
      setAnotaciones(Array.isArray(dataAnot) ? dataAnot : []);
    });
  }, [alumno]);

  const totalClases   = asistencias.length;
  const presentes     = asistencias.filter(a => a.estado === 'presente').length;
  const ausentes      = asistencias.filter(a => a.estado === 'ausente').length;
  const tardanzas     = asistencias.filter(a => a.estado === 'tardanza').length;
  const pctAsistencia = totalClases > 0 ? ((presentes / totalClases) * 100).toFixed(1) : '—';
  const asistColor    = Number(pctAsistencia) < 85 ? '#ef4444' : '#10b981';

  const promN = notas.length > 0
    ? (notas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notas.length).toFixed(1)
    : '—';
  const [notaBg, notaText] = colorNota(promN);

  const notasPorAsig     = agruparNotas(notas);
  const anotPositivas    = anotaciones.filter(a => a.tipo === 'positiva').length;
  const anotNegativas    = anotaciones.filter(a => a.tipo === 'negativa').length;

  const TABS = [
    { id: 'resumen',    label: 'Resumen',     icon: User },
    { id: 'notas',      label: 'Notas',       icon: GraduationCap },
    { id: 'asistencia', label: 'Asistencia',  icon: Activity },
    { id: 'anotaciones',label: 'Anotaciones', icon: MessageSquare },
    { id: 'avisos',     label: 'Avisos',      icon: Bell },
  ];

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
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '8px' }}>Perfil no configurado</h2>
        <p style={{ color: 'var(--color-foreground)', opacity: 0.5, fontSize: '14px' }}>Tu cuenta de alumno aún no está vinculada. Contacta al director de tu establecimiento.</p>
      </div>
    </div>
  );

  return (
    <div style={s.container}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--color-primary)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '22px', fontWeight: 900, flexShrink: 0 }}>
          {alumno.nombre_completo.split(' ').slice(0, 2).map(p => p[0]).join('')}
        </div>
        <div>
          <h1 style={s.pageTitle}>{alumno.nombre_completo}</h1>
          <p style={{ ...s.pageSub, marginBottom: 0 }}>{alumno.nombre_curso} · {alumno.rut || 'Sin RUT'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', overflowX: 'auto', padding: '2px' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTabActiva(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap',
              background: tabActiva === id ? 'var(--color-primary)' : 'var(--color-muted)',
              color:      tabActiva === id ? '#fff' : 'var(--color-foreground)',
              transition: 'all 0.15s',
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ── */}
      {tabActiva === 'resumen' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>

          {/* KPI Asistencia */}
          <div className="clay-card" style={{ ...s.card, gridColumn: 'span 4', textAlign: 'center' }}>
            <div style={s.kpiTitle}><Activity size={15} color="#10b981" /> Asistencia</div>
            <div style={{ ...s.kpiValue, color: asistColor }}>{pctAsistencia}%</div>
            <p style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.45, margin: 0 }}>{presentes} de {totalClases} clases</p>
            {Number(pctAsistencia) < 85 && (
              <div style={{ marginTop: '10px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(185,28,28,0.1)', color: '#b91c1c', fontSize: '11px', fontWeight: 700 }}>
                Bajo el 85% mínimo
              </div>
            )}
          </div>

          {/* KPI Promedio */}
          <div className="clay-card" style={{ ...s.card, gridColumn: 'span 4', textAlign: 'center' }}>
            <div style={s.kpiTitle}><GraduationCap size={15} color="var(--color-primary)" /> Promedio General</div>
            <div style={{ ...s.kpiValue, color: notaText }}>{promN}</div>
            <p style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.45, margin: 0 }}>{notas.length} evaluaciones</p>
          </div>

          {/* KPI Anotaciones */}
          <div className="clay-card" style={{ ...s.card, gridColumn: 'span 4', textAlign: 'center' }}>
            <div style={s.kpiTitle}><MessageSquare size={15} color="#6366f1" /> Anotaciones</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#15803d' }}>{anotPositivas}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', opacity: 0.8 }}>Positivas</div>
              </div>
              <div style={{ width: '1px', background: 'var(--color-border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#b91c1c' }}>{anotNegativas}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', opacity: 0.8 }}>Negativas</div>
              </div>
            </div>
          </div>

          {/* Promedios por asignatura */}
          <div className="clay-card" style={{ ...s.card, gridColumn: 'span 6' }}>
            <div style={s.kpiTitle}><BookOpen size={15} color="var(--color-primary)" /> Promedio por Asignatura</div>
            {Object.keys(notasPorAsig).length === 0 ? (
              <p style={{ color: 'var(--color-foreground)', opacity: 0.35, fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin notas registradas</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(notasPorAsig).map(([asig, ns]) => {
                  const prom = (ns.reduce((s, n) => s + parseFloat(n.calificacion), 0) / ns.length).toFixed(1);
                  const [bg, tc] = colorNota(prom);
                  const pct = Math.max(0, Math.min(100, ((parseFloat(prom) - 1) / 6) * 100));
                  return (
                    <div key={asig}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>{asig}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: tc, background: bg, padding: '2px 10px', borderRadius: '8px' }}>{prom}</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: tc, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Avisos recientes */}
          <div className="clay-card" style={{ ...s.card, gridColumn: 'span 6' }}>
            <div style={s.kpiTitle}><Bell size={15} color="var(--color-primary)" /> Avisos Recientes</div>
            {avisos.length === 0 ? (
              <p style={{ color: 'var(--color-foreground)', opacity: 0.35, fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin avisos</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {avisos.slice(0, 3).map(a => (
                  <div key={a.id} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-foreground)' }}>{a.titulo}</div>
                    <p style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.55, margin: '4px 0 0', lineHeight: 1.5 }}>{a.mensaje}</p>
                    <span style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.35, fontWeight: 600 }}>
                      {new Date(a.creado_en).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB: NOTAS ── */}
      {tabActiva === 'notas' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {Object.keys(notasPorAsig).length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '60px', borderRadius: '20px' }}>
              <GraduationCap size={48} style={{ opacity: 0.2, marginBottom: '12px', color: 'var(--color-foreground)' }} />
              <p style={{ color: 'var(--color-foreground)', opacity: 0.4, fontWeight: 600 }}>Sin notas registradas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.entries(notasPorAsig).map(([asig, ns]) => {
                const prom = (ns.reduce((s, n) => s + parseFloat(n.calificacion), 0) / ns.length).toFixed(1);
                const [, promColor] = colorNota(prom);
                return (
                  <div key={asig} className="clay-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px', background: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={16} color="var(--color-primary)" /> {asig}
                      </div>
                      <span style={{ fontWeight: 900, fontSize: '16px', color: promColor }}>Prom: {prom}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Evaluación</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase' }}>Fecha</th>
                          <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase' }}>Nota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...ns].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(n => {
                          const [bg, tc] = colorNota(n.calificacion);
                          return (
                            <tr key={n.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--color-foreground)', fontSize: '13.5px' }}>{n.descripcion || '—'}</td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '12.5px', color: 'var(--color-foreground)', opacity: 0.6 }}>
                                {n.fecha ? new Date(n.fecha).toLocaleDateString('es-CL') : '—'}
                              </td>
                              <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                                <span style={{ fontWeight: 800, color: tc, background: bg, padding: '4px 14px', borderRadius: '10px', fontSize: '14px' }}>
                                  {parseFloat(n.calificacion).toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── TAB: ASISTENCIA ── */}
      {tabActiva === 'asistencia' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total clases', value: totalClases, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
              { label: 'Presentes',    value: presentes,   color: '#15803d', bg: 'rgba(21,128,61,0.12)' },
              { label: 'Ausentes',     value: ausentes,    color: '#b91c1c', bg: 'rgba(185,28,28,0.12)' },
              { label: 'Tardanzas',    value: tardanzas,   color: '#b45309', bg: 'rgba(180,83,9,0.12)' },
            ].map(k => (
              <div key={k.label} className="clay-card" style={{ padding: '20px', textAlign: 'center', borderRadius: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>{k.label}</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="clay-card" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={15} color="var(--color-primary)" /> Registro de Clases
            </div>
            {asistencias.length === 0 ? (
              <p style={{ color: 'var(--color-foreground)', opacity: 0.35, fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin registros</p>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {asistencias.slice().reverse().map(as => {
                  const c = colorEstado(as.estado);
                  const etiqueta = as.estado === 'tardanza' ? 'T' : as.estado === 'ausente' ? 'A' : 'P';
                  return (
                    <div key={as.id}
                      title={`${as.fecha}: ${as.estado}${as.justificacion ? ` — ${as.justificacion}` : ''}`}
                      style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: as.justificacion ? 'rgba(99,102,241,0.15)' : c.bg,
                        color: as.justificacion ? 'var(--color-primary)' : c.text,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 900,
                        border: as.justificacion ? '2px solid var(--color-primary)' : '2px solid transparent',
                      }}>
                      {as.justificacion ? 'J' : etiqueta}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { lbl: 'P = Presente',   col: '#15803d' },
                { lbl: 'A = Ausente',    col: '#b91c1c' },
                { lbl: 'T = Tardanza',   col: '#b45309' },
                { lbl: 'J = Justificada',col: '#6366f1' },
              ].map(l => (
                <span key={l.lbl} style={{ fontSize: '11px', fontWeight: 700, color: l.col }}>{l.lbl}</span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB: ANOTACIONES ── */}
      {tabActiva === 'anotaciones' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {anotaciones.length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '60px', borderRadius: '20px' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '12px', color: 'var(--color-foreground)' }} />
              <p style={{ color: 'var(--color-foreground)', opacity: 0.4, fontWeight: 600 }}>Sin anotaciones registradas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {anotaciones.map(an => {
                const { bg, text, icon: Icon } = colorAnotacion(an.tipo);
                return (
                  <motion.div key={an.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="clay-card"
                    style={{ padding: '18px 22px', borderRadius: '16px', borderLeft: `4px solid ${text}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, background: bg, color: text }}>
                            <Icon size={12} />
                            {an.tipo === 'positiva' ? 'Positiva' : an.tipo === 'negativa' ? 'Negativa' : 'Observación'}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--color-foreground)', margin: 0, lineHeight: 1.5 }}>{an.texto}</p>
                        <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.45, marginTop: '8px', display: 'flex', gap: '14px' }}>
                          <span>{an.nombre_profesor || 'Sin profesor'}</span>
                          <span>{an.fecha ? new Date(an.fecha).toLocaleDateString('es-CL') : '—'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── TAB: AVISOS ── */}
      {tabActiva === 'avisos' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {avisos.length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '60px', borderRadius: '20px' }}>
              <Bell size={48} style={{ opacity: 0.2, marginBottom: '12px', color: 'var(--color-foreground)' }} />
              <p style={{ color: 'var(--color-foreground)', opacity: 0.4, fontWeight: 600 }}>Sin avisos en el curso</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {avisos.map(a => (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="clay-card"
                  style={{ padding: '20px 24px', borderRadius: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-foreground)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={15} color="var(--color-primary)" /> {a.titulo}
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--color-foreground)', opacity: 0.65, margin: '0 0 10px', lineHeight: 1.6 }}>{a.mensaje}</p>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.35 }}>
                    {new Date(a.creado_en).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
