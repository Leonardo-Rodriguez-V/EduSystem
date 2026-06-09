import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiFetch from '../utils/api';
import {
  X, GraduationCap, Activity, MessageSquare, BookOpen,
  ThumbsUp, ThumbsDown, AlertCircle, Calendar, User,
} from 'lucide-react';

function colorNota(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return { bg: 'var(--color-muted)', text: 'var(--color-foreground)' };
  if (v >= 6)   return { bg: 'rgba(21,128,61,0.15)',  text: '#15803d' };
  if (v >= 4)   return { bg: 'rgba(180,83,9,0.12)',   text: '#b45309' };
  return               { bg: 'rgba(185,28,28,0.12)', text: '#b91c1c' };
}

function colorAsist(e) {
  if (e === 'presente') return { bg: 'rgba(21,128,61,0.15)',  text: '#15803d' };
  if (e === 'tardanza') return { bg: 'rgba(180,83,9,0.15)',   text: '#b45309' };
  return                       { bg: 'rgba(185,28,28,0.15)', text: '#b91c1c' };
}

function colorAnotacion(tipo) {
  if (tipo === 'positiva') return { bg: 'rgba(21,128,61,0.12)',  text: '#15803d', Icon: ThumbsUp  };
  if (tipo === 'negativa') return { bg: 'rgba(185,28,28,0.12)', text: '#b91c1c', Icon: ThumbsDown };
  return                          { bg: 'rgba(99,102,241,0.10)', text: '#6366f1', Icon: AlertCircle };
}

function agrupar(notas) {
  const m = {};
  for (const n of notas) {
    const k = n.nombre_asignatura || 'Sin asignatura';
    if (!m[k]) m[k] = [];
    m[k].push(n);
  }
  return m;
}

const TAB = [
  { id: 'notas',       label: 'Notas',        Icon: GraduationCap },
  { id: 'asistencia',  label: 'Asistencia',   Icon: Activity      },
  { id: 'anotaciones', label: 'Anotaciones',  Icon: MessageSquare },
];

export default function FichaAlumno({ alumno, onClose }) {
  const [notas,       setNotas]       = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [anotaciones, setAnotaciones] = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [tab,         setTab]         = useState('notas');

  useEffect(() => {
    if (!alumno?.id) return;
    Promise.all([
      apiFetch(`/notas?id_alumno=${alumno.id}`).then(r => r?.json()).catch(() => []),
      apiFetch(`/asistencia/alumno/${alumno.id}`).then(r => r?.json()).catch(() => []),
      apiFetch(`/anotaciones?id_alumno=${alumno.id}`).then(r => r?.json()).catch(() => []),
    ]).then(([n, a, anot]) => {
      setNotas(Array.isArray(n) ? n : []);
      setAsistencias(Array.isArray(a) ? a : []);
      setAnotaciones(Array.isArray(anot) ? anot : []);
    }).finally(() => setCargando(false));
  }, [alumno?.id]);

  const promGen = notas.length
    ? (notas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notas.length).toFixed(1)
    : null;
  const total    = asistencias.length;
  const pres     = asistencias.filter(a => a.estado === 'presente').length;
  const pctAsist = total > 0 ? Math.round((pres / total) * 100) : null;
  const notaAgrup = agrupar(notas);
  const anotPos   = anotaciones.filter(a => a.tipo === 'positiva').length;
  const anotNeg   = anotaciones.filter(a => a.tipo === 'negativa').length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{ background: 'var(--color-surface)', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '88vh', overflowY: 'auto', border: '1px solid var(--color-border)', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>

          {/* Header del alumno */}
          <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 10, borderRadius: '24px 24px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '18px', flexShrink: 0 }}>
                {alumno.nombre_completo.split(' ').slice(0, 2).map(p => p[0]).join('')}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--color-foreground)', fontFamily: "'Crimson Pro', serif" }}>
                  {alumno.nombre_completo}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.5, fontWeight: 600 }}>
                  {alumno.nombre_curso || `Curso #${alumno.id_curso}`}{alumno.rut ? ` · ${alumno.rut}` : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground)', opacity: 0.5, padding: '4px', borderRadius: '8px' }}>
              <X size={22} />
            </button>
          </div>

          {/* KPIs rápidos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '20px 28px', borderBottom: '1px solid var(--color-border)' }}>
            {/* Promedio */}
            <div style={{ textAlign: 'center', padding: '14px', background: 'var(--color-muted)', borderRadius: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <GraduationCap size={12} /> Promedio
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: promGen ? colorNota(promGen).text : 'var(--color-foreground)', opacity: promGen ? 1 : 0.3 }}>
                {promGen ?? '—'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.4, marginTop: '2px' }}>{notas.length} eval.</div>
            </div>

            {/* Asistencia */}
            <div style={{ textAlign: 'center', padding: '14px', background: 'var(--color-muted)', borderRadius: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Activity size={12} /> Asistencia
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: pctAsist !== null ? (pctAsist >= 85 ? '#15803d' : '#b91c1c') : 'var(--color-foreground)', opacity: pctAsist !== null ? 1 : 0.3 }}>
                {pctAsist !== null ? `${pctAsist}%` : '—'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.4, marginTop: '2px' }}>{pres} / {total} clases</div>
            </div>

            {/* Anotaciones */}
            <div style={{ textAlign: 'center', padding: '14px', background: 'var(--color-muted)', borderRadius: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <MessageSquare size={12} /> Anotaciones
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '4px' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#15803d' }}>{anotPos}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#15803d' }}>Positivas</div>
                </div>
                <div style={{ width: '1px', background: 'var(--color-border)' }} />
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#b91c1c' }}>{anotNeg}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#b91c1c' }}>Negativas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', padding: '16px 28px 0' }}>
            {TAB.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                  background: tab === id ? 'var(--color-primary)' : 'var(--color-muted)',
                  color:      tab === id ? '#fff' : 'var(--color-foreground)',
                  transition: 'all 0.15s' }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Contenido del tab */}
          <div style={{ padding: '20px 28px 28px' }}>

            {cargando ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              </div>
            ) : (
              <>
                {/* NOTAS */}
                {tab === 'notas' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {Object.keys(notaAgrup).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-foreground)', opacity: 0.35, fontWeight: 600 }}>
                        <GraduationCap size={36} style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                        Sin notas registradas
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.entries(notaAgrup).map(([asig, ns]) => {
                          const prom = (ns.reduce((s, n) => s + parseFloat(n.calificacion), 0) / ns.length).toFixed(1);
                          const { text: tc } = colorNota(prom);
                          return (
                            <div key={asig} style={{ background: 'var(--color-muted)', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                  <BookOpen size={14} color="var(--color-primary)" /> {asig}
                                </span>
                                <span style={{ fontWeight: 900, color: tc, fontSize: '15px' }}>Prom: {prom}</span>
                              </div>
                              <div style={{ padding: '8px 0' }}>
                                {[...ns].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(n => {
                                  const { bg, text } = colorNota(n.calificacion);
                                  return (
                                    <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
                                      <span style={{ fontSize: '13px', color: 'var(--color-foreground)', fontWeight: 600 }}>{n.descripcion || '—'}</span>
                                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.45 }}>{n.fecha ? new Date(n.fecha).toLocaleDateString('es-CL') : '—'}</span>
                                        <span style={{ fontWeight: 800, background: bg, color: text, padding: '3px 12px', borderRadius: '8px', fontSize: '13px' }}>{parseFloat(n.calificacion).toFixed(1)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ASISTENCIA */}
                {tab === 'asistencia' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {asistencias.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-foreground)', opacity: 0.35, fontWeight: 600 }}>
                        <Calendar size={36} style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                        Sin registros de asistencia
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                          {asistencias.slice().reverse().map(as => {
                            const c = colorAsist(as.estado);
                            const etq = as.justificacion ? 'J' : as.estado === 'tardanza' ? 'T' : as.estado === 'ausente' ? 'A' : 'P';
                            return (
                              <div key={as.id}
                                title={`${as.fecha}: ${as.estado}${as.justificacion ? ` — ${as.justificacion}` : ''}`}
                                style={{ width: '40px', height: '40px', borderRadius: '10px', background: as.justificacion ? 'rgba(99,102,241,0.15)' : c.bg, color: as.justificacion ? '#6366f1' : c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, border: as.justificacion ? '2px solid #6366f1' : '2px solid transparent' }}>
                                {etq}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                          {[{ l: 'P = Presente', c: '#15803d' }, { l: 'A = Ausente', c: '#b91c1c' }, { l: 'T = Tardanza', c: '#b45309' }, { l: 'J = Justificada', c: '#6366f1' }].map(x => (
                            <span key={x.l} style={{ fontSize: '11px', fontWeight: 700, color: x.c }}>{x.l}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* ANOTACIONES */}
                {tab === 'anotaciones' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {anotaciones.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-foreground)', opacity: 0.35, fontWeight: 600 }}>
                        <MessageSquare size={36} style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                        Sin anotaciones
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {anotaciones.map(an => {
                          const { bg, text, Icon } = colorAnotacion(an.tipo);
                          return (
                            <div key={an.id} style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderLeft: `4px solid ${text}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: bg, color: text }}>
                                  <Icon size={11} />
                                  {an.tipo === 'positiva' ? 'Positiva' : an.tipo === 'negativa' ? 'Negativa' : 'Observación'}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-foreground)', lineHeight: 1.5 }}>{an.texto}</p>
                              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.4, display: 'flex', gap: '12px' }}>
                                <span>{an.nombre_profesor || 'Sin profesor'}</span>
                                <span>{an.fecha ? new Date(an.fecha).toLocaleDateString('es-CL') : '—'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
