import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import apiFetch from '../utils/api';
import { User, GraduationCap, TrendingUp } from 'lucide-react';

function colorNota(n) {
  const v = Number(n);
  if (!n && n !== 0) return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
  if (v >= 6)  return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
  if (v >= 4)  return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
  return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
}

const s = {
  page:      { padding: '0 0 40px', maxWidth: '1200px', margin: '0 auto' },
  header:    { marginBottom: '28px' },
  title:     { fontSize: '26px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, fontFamily: "'Crimson Pro', serif" },
  sub:       { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  selector:  { display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card:      { background: 'var(--color-surface)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.1)' },
  cardHead:  (color) => ({ background: color, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }),
  asigName:  { fontWeight: 800, fontSize: '15px', color: '#1e293b' },
  promBadge: (c) => ({ fontSize: '22px', fontWeight: 900, color: c.text, background: c.bg, border: `2px solid ${c.border}`, borderRadius: '12px', padding: '4px 14px', minWidth: '52px', textAlign: 'center' }),
  notaRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--color-border)' },
  notaDesc:  { fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' },
  notaFecha: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' },
  notaBadge: (c) => ({ fontSize: '14px', fontWeight: 800, color: c.text, background: c.bg, padding: '4px 12px', borderRadius: '8px', border: `1px solid ${c.border}` }),
  empty:     { padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' },
  promedioGlobal: { display: 'flex', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' },
  kpi:       { background: 'var(--color-surface)', borderRadius: '16px', padding: '16px 24px', boxShadow: 'var(--clay-shadow)', display: 'flex', alignItems: 'center', gap: '16px', flex: '1', minWidth: '180px' },
};

const CABECERAS_COLOR = [
  '#e0f2fe', '#fce7f3', '#f0fdf4', '#fef9c3', '#ede9fe',
  '#ffedd5', '#f0f9ff', '#ecfdf5', '#fff1f2', '#f5f3ff',
];

export default function NotasHijo() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  const [hijos,     setHijos]     = useState([]);
  const [hijoSel,   setHijoSel]   = useState(null);
  const [notas,     setNotas]     = useState([]);
  const [asigs,     setAsigs]     = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [cargandoN, setCargandoN] = useState(false);

  // Cargar hijos
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

  // Cargar notas y asignaturas cuando cambia el hijo seleccionado
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

  // Agrupar notas por asignatura
  const notasPorAsig = {};
  for (const n of notas) {
    const key = n.id_asignatura ?? 'sin_asig';
    const nombre = n.nombre_asignatura ?? 'Sin asignatura';
    if (!notasPorAsig[key]) notasPorAsig[key] = { nombre, notas: [] };
    notasPorAsig[key].notas.push(n);
  }

  // Combinar con todas las asignaturas del curso (para mostrar las que no tienen notas)
  const asignaturasConNotas = [...asigs];
  // agregar asignaturas que vengan de notas pero no estén en la lista del curso
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
    const sum = notasArr.reduce((s, n) => s + parseFloat(n.calificacion), 0);
    return (sum / notasArr.length).toFixed(1);
  };

  // KPIs globales
  const promGlobal = calcProm(notas);
  const totalEvals = notas.length;
  const bajaNota   = notas.filter(n => parseFloat(n.calificacion) < 4).length;

  const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : '';

  if (cargando) return (
    <div style={{ padding: '80px', textAlign: 'center' }}>
      <TrendingUp className="animate-pulse" size={48} color="var(--color-primary)" />
    </div>
  );

  if (!hijoSel) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div className="clay-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px' }}>
        <GraduationCap size={56} color="#94a3b8" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-foreground)' }}>Sin alumnos vinculados</h2>
        <p style={{ color: '#64748b', marginTop: '8px' }}>No se encontraron estudiantes asociados a tu cuenta.</p>
      </div>
    </div>
  );

  return (
    <motion.div style={s.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Notas de {hijoSel.nombre_completo.split(' ')[0]}</h1>
        <p style={s.sub}>{hijoSel.nombre_curso || 'Curso'} · Año Lectivo 2026</p>
      </div>

      {/* Selector de hijo */}
      {hijos.length > 1 && (
        <div style={s.selector}>
          {hijos.map(h => (
            <button
              key={h.id}
              onClick={() => setHijoSel(h)}
              className={hijoSel?.id === h.id ? 'clay-button' : 'clay-card'}
              style={{
                padding: '10px 20px', borderRadius: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '14px', fontWeight: 700,
                border: hijoSel?.id === h.id ? 'none' : '2px solid transparent',
              }}
            >
              <User size={15} />
              {h.nombre_completo.split(' ').slice(0, 2).join(' ')}
              <span style={{ fontSize: '11px', opacity: 0.7, fontWeight: 600 }}>
                {h.nombre_curso}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={s.promedioGlobal}>
        <motion.div style={s.kpi} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <div style={{ background: colorNota(promGlobal).bg, borderRadius: '12px', padding: '12px', border: `2px solid ${colorNota(promGlobal).border}` }}>
            <GraduationCap size={22} color={colorNota(promGlobal).text} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Promedio General</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: colorNota(promGlobal).text }}>{promGlobal ?? '—'}</div>
          </div>
        </motion.div>
        <motion.div style={s.kpi} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <div style={{ background: '#e0f2fe', borderRadius: '12px', padding: '12px', border: '2px solid #bae6fd' }}>
            <TrendingUp size={22} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Evaluaciones</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0284c7' }}>{totalEvals}</div>
          </div>
        </motion.div>
        {bajaNota > 0 && (
          <motion.div style={s.kpi} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '12px', border: '2px solid #fca5a5' }}>
              <GraduationCap size={22} color="#b91c1c" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Notas bajo 4.0</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#b91c1c' }}>{bajaNota}</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Grid de asignaturas */}
      {cargandoN ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Cargando notas...</p>
      ) : asignaturasConNotas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: '20px', border: '2px dashed var(--color-border)' }}>
          <GraduationCap size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>No hay asignaturas ni notas registradas aún.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {asignaturasConNotas.map((asig, idx) => {
            const notasAsig = notasPorAsig[asig.id]?.notas ?? [];
            const prom      = calcProm(notasAsig);
            const colHead   = CABECERAS_COLOR[idx % CABECERAS_COLOR.length];
            const colProm   = colorNota(prom);
            return (
              <motion.div
                key={asig.id}
                style={s.card}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 * idx }}
              >
                {/* Cabecera */}
                <div style={s.cardHead(colHead)}>
                  <span style={s.asigName}>{asig.nombre}</span>
                  <span style={s.promBadge(prom ? colProm : { bg: '#f1f5f9', text: '#94a3b8', border: '#e2e8f0' })}>
                    {prom ?? '—'}
                  </span>
                </div>

                {/* Lista de notas */}
                {notasAsig.length === 0 ? (
                  <p style={s.empty}>Sin evaluaciones aún</p>
                ) : (
                  notasAsig.map((n, i) => {
                    const c = colorNota(n.calificacion);
                    return (
                      <div key={n.id ?? i} style={{ ...s.notaRow, borderBottom: i < notasAsig.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                        <div>
                          <div style={s.notaDesc}>{n.descripcion}</div>
                          <div style={s.notaFecha}>{fmtFecha(n.fecha)}</div>
                        </div>
                        <span style={s.notaBadge(c)}>{parseFloat(n.calificacion).toFixed(1)}</span>
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
