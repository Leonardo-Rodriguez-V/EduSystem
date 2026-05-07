import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import apiFetch from '../utils/api';
import {
  User, GraduationCap, CalendarCheck, AlertTriangle,
  TrendingUp, Clock, CheckCircle, XCircle, FileDown,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function descargarPDF(ruta, nombre) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}

function colorNota(n) {
  const v = Number(n);
  if (!n && n !== 0) return { text: 'var(--color-foreground)', bg: 'var(--color-muted)', border: 'var(--color-border)' };
  if (v >= 6)  return { text: '#15803d', bg: 'rgba(21,128,61,0.15)',  border: 'rgba(21,128,61,0.4)' };
  if (v >= 4)  return { text: '#b45309', bg: 'rgba(180,83,9,0.12)',   border: 'rgba(180,83,9,0.35)' };
  return         { text: '#b91c1c', bg: 'rgba(185,28,28,0.12)', border: 'rgba(185,28,28,0.35)' };
}

function calcEdad(fechaNac) {
  if (!fechaNac) return null;
  const diff = Date.now() - new Date(fechaNac).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PerfilHijo() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  const [hijos,       setHijos]       = useState([]);
  const [hijoSel,     setHijoSel]     = useState(null);
  const [asistencia,  setAsistencia]  = useState([]);
  const [notas,       setNotas]       = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [cargandoD,   setCargandoD]   = useState(false);

  useEffect(() => {
    apiFetch(`/alumnos/apoderado/${usuario.id}`)
      .then(r => r?.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setHijos(data);
          setHijoSel(data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [usuario.id]);

  useEffect(() => {
    if (!hijoSel) return;
    setCargandoD(true);
    Promise.all([
      apiFetch(`/asistencia/alumno/${hijoSel.id}`).then(r => r?.json()).catch(() => []),
      apiFetch(`/notas?id_alumno=${hijoSel.id}`).then(r => r?.json()).catch(() => []),
    ]).then(([a, n]) => {
      setAsistencia(Array.isArray(a) ? a : []);
      setNotas(Array.isArray(n) ? n : []);
    }).finally(() => setCargandoD(false));
  }, [hijoSel]);

  const presentes  = asistencia.filter(a => a.estado === 'presente').length;
  const ausentes   = asistencia.filter(a => a.estado === 'ausente').length;
  const tardanzas  = asistencia.filter(a => a.estado === 'tardanza').length;
  const totalDias  = asistencia.length;
  const pctAsist   = totalDias > 0 ? Math.round((presentes / totalDias) * 100) : null;

  const promGlobal = notas.length > 0
    ? (notas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notas.length).toFixed(1)
    : null;

  const colProm    = colorNota(promGlobal);
  const ultimasNotas = [...notas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

  const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const fmtFechaNac = (f) => f ? new Date(f).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const estadoAcademico = () => {
    if (!promGlobal) return null;
    const p = Number(promGlobal);
    const bajasNotas = notas.filter(n => parseFloat(n.calificacion) < 4).length;
    if (p >= 5.5 && (pctAsist === null || pctAsist >= 85)) return { label: 'Rendimiento óptimo', color: '#15803d', bg: 'rgba(21,128,61,0.12)', border: 'rgba(21,128,61,0.3)' };
    if (p >= 4 && bajasNotas <= 2) return { label: 'Rendimiento regular', color: '#b45309', bg: 'rgba(180,83,9,0.1)', border: 'rgba(180,83,9,0.3)' };
    return { label: 'Requiere atención', color: '#b91c1c', bg: 'rgba(185,28,28,0.1)', border: 'rgba(185,28,28,0.3)' };
  };
  const estado = estadoAcademico();

  if (cargando) return (
    <div style={{ padding: '80px', textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
    </div>
  );

  if (!hijoSel) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div className="clay-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px', borderRadius: '28px' }}>
        <User size={56} color="var(--color-primary)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-foreground)' }}>Sin alumnos vinculados</h2>
        <p style={{ color: 'var(--color-foreground)', opacity: 0.5, marginTop: '8px' }}>No se encontraron estudiantes asociados a tu cuenta.</p>
      </div>
    </div>
  );

  return (
    <motion.div style={{ padding: '0 0 48px', maxWidth: '1100px', margin: '0 auto' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* Selector de hijo */}
      {hijos.length > 1 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {hijos.map(h => (
            <button key={h.id} onClick={() => setHijoSel(h)} style={{
              padding: '10px 20px', borderRadius: '16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: 700, border: 'none',
              background: hijoSel?.id === h.id ? 'var(--color-primary)' : 'var(--color-muted)',
              color: hijoSel?.id === h.id ? '#fff' : 'var(--color-foreground)',
              transition: 'all 0.2s',
            }}>
              <User size={15} />
              {h.nombre_completo.split(' ').slice(0, 2).join(' ')}
              <span style={{ fontSize: '11px', opacity: 0.7 }}>{h.nombre_curso}</span>
            </button>
          ))}
        </div>
      )}

      {cargandoD ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          {/* Tarjeta de perfil principal */}
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
            style={{
              background: 'var(--color-surface)', borderRadius: '24px', padding: '28px 32px',
              boxShadow: 'var(--clay-shadow)', border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap',
              marginBottom: '24px',
            }}>
            {/* Avatar */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--color-primary), #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            }}>
              <User size={36} color="#fff" />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
                {hijoSel.nombre_completo}
              </h1>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.6, fontWeight: 600 }}>
                  <GraduationCap size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  {hijoSel.nombre_curso || 'Curso no asignado'}
                </span>
                {hijoSel.rut && (
                  <span style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.6, fontWeight: 600 }}>
                    RUT: {hijoSel.rut}
                  </span>
                )}
                {hijoSel.fecha_nacimiento && (
                  <span style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.6, fontWeight: 600 }}>
                    {fmtFechaNac(hijoSel.fecha_nacimiento)}
                    {calcEdad(hijoSel.fecha_nacimiento) !== null && ` · ${calcEdad(hijoSel.fecha_nacimiento)} años`}
                  </span>
                )}
              </div>
            </div>

            {/* Badge estado académico + botones PDF */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              {estado && (
                <div style={{
                  padding: '10px 20px', borderRadius: '16px',
                  background: estado.bg, border: `2px solid ${estado.border}`,
                  fontWeight: 800, fontSize: '13px', color: estado.color,
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  {estado.label.includes('óptimo') ? <CheckCircle size={16} /> :
                   estado.label.includes('Requiere') ? <AlertTriangle size={16} /> :
                   <TrendingUp size={16} />}
                  {estado.label}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={() => descargarPDF(`/reportes/notas/${hijoSel.id}`, `notas_${hijoSel.nombre_completo}.pdf`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', border: 'none', background: 'rgba(99,102,241,0.12)', color: '#6366f1', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                  <FileDown size={14} /> Notas PDF
                </button>
                <button onClick={() => descargarPDF(`/reportes/asistencia/${hijoSel.id}`, `asistencia_${hijoSel.nombre_completo}.pdf`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                  <FileDown size={14} /> Asistencia PDF
                </button>
              </div>
            </div>
          </motion.div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {/* Promedio */}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--clay-shadow)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: colProm.bg, borderRadius: '14px', padding: '12px', border: `2px solid ${colProm.border}` }}>
                <GraduationCap size={20} color={colProm.text} />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Promedio</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: colProm.text, lineHeight: 1 }}>{promGlobal ?? '—'}</div>
              </div>
            </motion.div>

            {/* Asistencia % */}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.13 }}
              style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--clay-shadow)', border: `1px solid ${pctAsist !== null && pctAsist < 75 ? 'rgba(185,28,28,0.3)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: pctAsist !== null && pctAsist < 75 ? 'rgba(185,28,28,0.12)' : 'rgba(14,165,233,0.15)', borderRadius: '14px', padding: '12px', border: `2px solid ${pctAsist !== null && pctAsist < 75 ? 'rgba(185,28,28,0.3)' : 'rgba(14,165,233,0.3)'}` }}>
                <CalendarCheck size={20} color={pctAsist !== null && pctAsist < 75 ? '#b91c1c' : '#0ea5e9'} />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Asistencia</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: pctAsist !== null && pctAsist < 75 ? '#b91c1c' : '#0ea5e9', lineHeight: 1 }}>
                  {pctAsist !== null ? `${pctAsist}%` : '—'}
                </div>
              </div>
            </motion.div>

            {/* Días presentes */}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.16 }}
              style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--clay-shadow)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(21,128,61,0.12)', borderRadius: '14px', padding: '12px', border: '2px solid rgba(21,128,61,0.3)' }}>
                <CheckCircle size={20} color="#15803d" />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Presentes</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#15803d', lineHeight: 1 }}>{presentes}</div>
              </div>
            </motion.div>

            {/* Ausencias */}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.19 }}
              style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--clay-shadow)', border: `1px solid ${ausentes > 5 ? 'rgba(185,28,28,0.3)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: ausentes > 5 ? 'rgba(185,28,28,0.12)' : 'var(--color-muted)', borderRadius: '14px', padding: '12px', border: `2px solid ${ausentes > 5 ? 'rgba(185,28,28,0.3)' : 'var(--color-border)'}` }}>
                <XCircle size={20} color={ausentes > 5 ? '#b91c1c' : 'var(--color-foreground)'} style={{ opacity: ausentes > 5 ? 1 : 0.5 }} />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Ausencias</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: ausentes > 5 ? '#b91c1c' : 'var(--color-foreground)', lineHeight: 1 }}>{ausentes}</div>
              </div>
            </motion.div>

            {/* Tardanzas */}
            {tardanzas > 0 && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }}
                style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--clay-shadow)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: 'rgba(180,83,9,0.1)', borderRadius: '14px', padding: '12px', border: '2px solid rgba(180,83,9,0.3)' }}>
                  <Clock size={20} color="#b45309" />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Tardanzas</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#b45309', lineHeight: 1 }}>{tardanzas}</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Fila inferior: barra asistencia + últimas notas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            {/* Detalle asistencia */}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--clay-shadow)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-foreground)', margin: '0 0 20px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                Asistencia del año
              </h3>

              {totalDias === 0 ? (
                <p style={{ color: 'var(--color-foreground)', opacity: 0.4, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Sin registros de asistencia aún</p>
              ) : (
                <>
                  {/* Barra visual */}
                  <div style={{ display: 'flex', height: '14px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', gap: '2px' }}>
                    {presentes > 0 && <div style={{ flex: presentes, background: '#15803d', borderRadius: '6px 0 0 6px' }} title={`Presentes: ${presentes}`} />}
                    {tardanzas > 0 && <div style={{ flex: tardanzas, background: '#f59e0b' }} title={`Tardanzas: ${tardanzas}`} />}
                    {ausentes  > 0 && <div style={{ flex: ausentes,  background: '#b91c1c', borderRadius: '0 6px 6px 0' }} title={`Ausentes: ${ausentes}`} />}
                  </div>

                  {/* Leyenda */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Presente', count: presentes, color: '#15803d' },
                      { label: 'Tardanza', count: tardanzas, color: '#f59e0b' },
                      { label: 'Ausente',  count: ausentes,  color: '#b91c1c' },
                    ].filter(item => item.count > 0).map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.7 }}>
                          {item.label}: <strong style={{ opacity: 1 }}>{item.count}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.4, marginTop: '12px', fontWeight: 600 }}>
                    Total de días registrados: {totalDias}
                  </p>
                </>
              )}
            </motion.div>

            {/* Últimas evaluaciones */}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.28 }}
              style={{ background: 'var(--color-surface)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--clay-shadow)', border: '1px solid var(--color-border)' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-foreground)', margin: 0, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  Últimas evaluaciones
                </h3>
              </div>
              {ultimasNotas.length === 0 ? (
                <p style={{ color: 'var(--color-foreground)', opacity: 0.4, fontSize: '13px', textAlign: 'center', padding: '32px 20px' }}>Sin evaluaciones registradas</p>
              ) : (
                ultimasNotas.map((n, i) => {
                  const c = colorNota(n.calificacion);
                  return (
                    <div key={n.id ?? i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 24px',
                      borderBottom: i < ultimasNotas.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-foreground)' }}>{n.descripcion || 'Evaluación'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.45, marginTop: '2px' }}>
                          {n.nombre_asignatura || ''}{n.nombre_asignatura && n.fecha ? ' · ' : ''}{fmtFecha(n.fecha)}
                        </div>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: c.text, background: c.bg, padding: '4px 14px', borderRadius: '10px', border: `1px solid ${c.border}`, flexShrink: 0 }}>
                        {parseFloat(n.calificacion).toFixed(1)}
                      </span>
                    </div>
                  );
                })
              )}
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
