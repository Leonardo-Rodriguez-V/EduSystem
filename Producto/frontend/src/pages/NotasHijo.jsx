import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import apiFetch from '../utils/api';
import { User, GraduationCap, TrendingUp, AlertTriangle } from 'lucide-react';

function colorNota(n) {
  const v = Number(n);
  if (!n && n !== 0) return { bg: 'var(--color-muted)', text: 'var(--color-foreground)', border: 'var(--color-border)', op: 0.5 };
  if (v >= 6)  return { bg: 'rgba(21,128,61,0.15)',   text: '#15803d', border: 'rgba(21,128,61,0.4)',   op: 1 };
  if (v >= 4)  return { bg: 'rgba(180,83,9,0.12)',    text: '#b45309', border: 'rgba(180,83,9,0.35)',    op: 1 };
  return         { bg: 'rgba(185,28,28,0.12)',  text: '#b91c1c', border: 'rgba(185,28,28,0.35)',  op: 1 };
}

const ASIG_COLORS = [
  { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  accent: '#6366f1' },
  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', accent: '#10b981' },
  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', accent: '#f59e0b' },
  { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  accent: '#ef4444' },
  { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', accent: '#a855f7' },
  { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.3)', accent: '#0ea5e9' },
  { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', accent: '#ec4899' },
  { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.3)', accent: '#14b8a6' },
];

export default function NotasHijo() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  const [hijos,     setHijos]     = useState([]);
  const [hijoSel,   setHijoSel]   = useState(null);
  const [notas,     setNotas]     = useState([]);
  const [asigs,     setAsigs]     = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [cargandoN, setCargandoN] = useState(false);

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
    setCargandoN(true);
    Promise.all([
      apiFetch(`/notas?id_alumno=${hijoSel.id}`).then(r => r?.json()).catch(() => []),
      hijoSel.id_curso
        ? apiFetch(`/notas/asignaturas-curso/${hijoSel.id_curso}`).then(r => r?.json()).catch(() => [])
        : Promise.resolve([]),
    ]).then(([n, a]) => {
      setNotas(Array.isArray(n) ? n : []);
      setAsigs(Array.isArray(a) ? a : []);
    }).finally(() => setCargandoN(false));
  }, [hijoSel]);

  const notasPorAsig = {};
  for (const n of notas) {
    const key = n.id_asignatura ?? 'sin_asig';
    const nombre = n.nombre_asignatura ?? 'Sin asignatura';
    if (!notasPorAsig[key]) notasPorAsig[key] = { nombre, notas: [] };
    notasPorAsig[key].notas.push(n);
  }

  const asignaturasConNotas = [...asigs];
  for (const key of Object.keys(notasPorAsig)) {
    if (key !== 'sin_asig' && !asigs.find(a => String(a.id) === String(key))) {
      asignaturasConNotas.push({ id: key, nombre: notasPorAsig[key].nombre });
    }
  }
  if (notasPorAsig['sin_asig']) {
    asignaturasConNotas.push({ id: 'sin_asig', nombre: 'Sin asignatura' });
  }

  const calcProm = (notasArr) => {
    if (!notasArr || notasArr.length === 0) return null;
    return (notasArr.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notasArr.length).toFixed(1);
  };

  const promGlobal = calcProm(notas);
  const totalEvals = notas.length;
  const bajaNota   = notas.filter(n => parseFloat(n.calificacion) < 4).length;
  const colPG      = colorNota(promGlobal);

  const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : '';

  if (cargando) return (
    <div style={{ padding: '80px', textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
    </div>
  );

  if (!hijoSel) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div className="clay-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px', borderRadius: '28px' }}>
        <GraduationCap size={56} color="var(--color-primary)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-foreground)' }}>Sin alumnos vinculados</h2>
        <p style={{ color: 'var(--color-foreground)', opacity: 0.5, marginTop: '8px' }}>No se encontraron estudiantes asociados a tu cuenta.</p>
      </div>
    </div>
  );

  return (
    <motion.div style={{ padding: '0 0 40px', maxWidth: '1200px', margin: '0 auto' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
          Notas de {hijoSel.nombre_completo.split(' ')[0]}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-foreground)', opacity: 0.5, marginTop: '4px', fontWeight: 600 }}>
          {hijoSel.nombre_curso || 'Curso'} · Año Lectivo 2026
        </p>
      </div>

      {/* Selector de hijo */}
      {hijos.length > 1 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {hijos.map(h => (
            <button
              key={h.id}
              onClick={() => setHijoSel(h)}
              style={{
                padding: '10px 20px', borderRadius: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '14px', fontWeight: 700, border: 'none',
                background: hijoSel?.id === h.id ? 'var(--color-primary)' : 'var(--color-muted)',
                color: hijoSel?.id === h.id ? '#fff' : 'var(--color-foreground)',
                transition: 'all 0.2s',
              }}
            >
              <User size={15} />
              {h.nombre_completo.split(' ').slice(0, 2).join(' ')}
              <span style={{ fontSize: '11px', opacity: 0.7 }}>{h.nombre_curso}</span>
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px 28px', boxShadow: 'var(--clay-shadow)', display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '180px', border: '1px solid var(--color-border)' }}>
          <div style={{ background: colPG.bg, borderRadius: '14px', padding: '14px', border: `2px solid ${colPG.border}` }}>
            <GraduationCap size={22} color={colPG.text} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Promedio General</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: colPG.text, lineHeight: 1 }}>{promGlobal ?? '—'}</div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px 28px', boxShadow: 'var(--clay-shadow)', display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '180px', border: '1px solid var(--color-border)' }}>
          <div style={{ background: 'rgba(14,165,233,0.15)', borderRadius: '14px', padding: '14px', border: '2px solid rgba(14,165,233,0.3)' }}>
            <TrendingUp size={22} color="#0ea5e9" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Evaluaciones</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0ea5e9', lineHeight: 1 }}>{totalEvals}</div>
          </div>
        </motion.div>

        {bajaNota > 0 && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px 28px', boxShadow: 'var(--clay-shadow)', display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '180px', border: '1px solid rgba(185,28,28,0.3)' }}>
            <div style={{ background: 'rgba(185,28,28,0.12)', borderRadius: '14px', padding: '14px', border: '2px solid rgba(185,28,28,0.3)' }}>
              <AlertTriangle size={22} color="#b91c1c" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>Bajo 4.0</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#b91c1c', lineHeight: 1 }}>{bajaNota}</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Grid asignaturas */}
      {cargandoN ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-foreground)', opacity: 0.4, fontSize: '14px', fontWeight: 600 }}>Cargando notas...</p>
        </div>
      ) : asignaturasConNotas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: '20px', border: '2px dashed var(--color-border)' }}>
          <GraduationCap size={48} color="var(--color-primary)" style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ color: 'var(--color-foreground)', opacity: 0.4, fontSize: '14px', fontWeight: 600 }}>No hay asignaturas ni notas registradas aún.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {asignaturasConNotas.map((asig, idx) => {
            const notasAsig = notasPorAsig[asig.id]?.notas ?? [];
            const prom      = calcProm(notasAsig);
            const colProm   = colorNota(prom);
            const asigColor = ASIG_COLORS[idx % ASIG_COLORS.length];

            return (
              <motion.div
                key={asig.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 * idx }}
                style={{ background: 'var(--color-surface)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--clay-shadow)', border: '1px solid var(--color-border)' }}
              >
                {/* Header con franja de color */}
                <div style={{ borderTop: `4px solid ${asigColor.accent}`, padding: '16px 20px', background: asigColor.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-foreground)' }}>{asig.nombre}</span>
                  <span style={{
                    fontSize: '20px', fontWeight: 900,
                    color: colProm.text, background: colProm.bg,
                    border: `2px solid ${colProm.border}`,
                    borderRadius: '12px', padding: '4px 14px', minWidth: '52px', textAlign: 'center'
                  }}>
                    {prom ?? '—'}
                  </span>
                </div>

                {/* Lista de notas */}
                {notasAsig.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: 'var(--color-foreground)', opacity: 0.35, fontSize: '13px', fontStyle: 'italic' }}>
                    Sin evaluaciones aún
                  </p>
                ) : (
                  notasAsig.map((n, i) => {
                    const c = colorNota(n.calificacion);
                    return (
                      <div key={n.id ?? i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 20px',
                        borderBottom: i < notasAsig.length - 1 ? '1px solid var(--color-border)' : 'none'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>{n.descripcion}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.45, marginTop: '2px' }}>{fmtFecha(n.fecha)}</div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: c.text, background: c.bg, padding: '4px 12px', borderRadius: '8px', border: `1px solid ${c.border}` }}>
                          {parseFloat(n.calificacion).toFixed(1)}
                        </span>
                      </div>
                    );
                  })
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
