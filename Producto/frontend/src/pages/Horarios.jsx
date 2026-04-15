import { useState, useEffect } from 'react';
import apiFetch from '../utils/api';

const s = {
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  title:     { fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)' },
  select:    { padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13.5px', fontWeight: 600, background: 'var(--color-surface)', color: 'var(--color-primary)', outline: 'none', cursor: 'pointer' },
  grid:      { display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' },
  headCell:  { background: 'var(--color-muted)', padding: '12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' },
  timeCell:  { background: 'var(--color-muted)', padding: '12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.6, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  cell:      { background: 'var(--color-surface)', padding: '10px', minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '4px' },
};

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const BLOQUES = [
  { type: 'class', inicio: '08:00', fin: '09:30', label: 'Bloque 1' },
  { type: 'break', inicio: '09:30', fin: '09:45', label: 'Recreo' },
  { type: 'class', inicio: '09:45', fin: '11:15', label: 'Bloque 2' },
  { type: 'break', inicio: '11:15', fin: '11:30', label: 'Recreo' },
  { type: 'class', inicio: '11:30', fin: '13:00', label: 'Bloque 3' },
  { type: 'lunch', inicio: '13:00', fin: '13:45', label: 'Almuerzo' },
  { type: 'class', inicio: '13:45', fin: '15:15', label: 'Bloque 4' },
  { type: 'break', inicio: '15:15', fin: '15:30', label: 'Recreo' },
  { type: 'class', inicio: '15:30', fin: '17:00', label: 'Bloque 5' },
];

// Colores saturados que funcionan en modo claro Y oscuro
const SUBJECT_COLORS = {
  'Lenguaje':    { bg: '#c2185b', text: '#fff' },
  'Literatura':  { bg: '#c2185b', text: '#fff' },
  'Matemática':  { bg: '#1565c0', text: '#fff' },
  'Biología':    { bg: '#2e7d32', text: '#fff' },
  'Química':     { bg: '#00695c', text: '#fff' },
  'Física':      { bg: '#1565c0', text: '#fff' },
  'Ciencias':    { bg: '#2e7d32', text: '#fff' },
  'Historia':    { bg: '#e65100', text: '#fff' },
  'Filosofía':   { bg: '#4a148c', text: '#fff' },
  'Ciudadana':   { bg: '#4a148c', text: '#fff' },
  'Inglés':      { bg: '#6a1b9a', text: '#fff' },
  'Física':      { bg: '#0277bd', text: '#fff' },
  'Educación Física': { bg: '#558b2f', text: '#fff' },
  'Artes':       { bg: '#4e342e', text: '#fff' },
  'Música':      { bg: '#37474f', text: '#fff' },
  'Tecnología':  { bg: '#37474f', text: '#fff' },
  'Orientación': { bg: '#00838f', text: '#fff' },
  'Religión':    { bg: '#bf360c', text: '#fff' },
  'Pensamiento': { bg: '#1565c0', text: '#fff' },
  'Lenguajes Artísticos': { bg: '#4e342e', text: '#fff' },
  'Corporalidad': { bg: '#558b2f', text: '#fff' },
  'Exploración': { bg: '#2e7d32', text: '#fff' },
  'Identidad':   { bg: '#00838f', text: '#fff' },
  'Convivencia': { bg: '#00838f', text: '#fff' },
  'Comprensión': { bg: '#e65100', text: '#fff' },
};

const getSubjectColor = (name) => {
  for (const key in SUBJECT_COLORS) {
    if (name.includes(key)) return SUBJECT_COLORS[key];
  }
  return { bg: '#455a64', text: '#fff' };
};

export default function Horarios() {
  const [cursos,   setCursos]   = useState([]);
  const [cursoSel, setCursoSel] = useState(null);
  const [horario,  setHorario]  = useState([]);
  const [, setCargando] = useState(true);

  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  useEffect(() => {
    if (usuario.rol === 'apoderado') {
      apiFetch(`/alumnos/apoderado/${usuario.id}`).then(r => r?.json()).then(data => {
        if (!Array.isArray(data) || data.length === 0) { setCargando(false); return; }
        const vistos = new Set();
        const cursosHijos = [];
        for (const a of data) {
          if (a.id_curso && !vistos.has(a.id_curso)) {
            vistos.add(a.id_curso);
            cursosHijos.push({ id: a.id_curso, nombre: a.nombre_curso, nombre_alumno: a.nombre_completo });
          }
        }
        if (cursosHijos.length === 0) { setCargando(false); return; }
        setCursos(cursosHijos);
        setCursoSel(cursosHijos[0]);
      }).catch(() => setCargando(false)).finally(() => setCargando(false));
      return;
    }
    const url = usuario.rol === 'profesor' ? `/cursos?id_profesor=${usuario.id}` : '/cursos';
    apiFetch(url).then(r => r?.json()).then(data => {
      if (Array.isArray(data)) { setCursos(data); setCursoSel(data[0] || null); }
    }).finally(() => setCargando(false));
  }, [usuario.id, usuario.rol]);

  useEffect(() => {
    if (!cursoSel) return;
    apiFetch(`/horarios/curso/${cursoSel.id}`)
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setHorario(data); });
  }, [cursoSel]);

  const getEntry = (diaIdx, bloqueInicio) =>
    horario.find(h => Number(h.dia_semana) === (diaIdx + 1) && h.bloque_inicio.startsWith(bloqueInicio));

  return (
    <div style={{ padding: '0 10px' }}>
      <div style={s.header}>
        <div style={s.title}>Horario de Clases — {cursoSel?.nombre}</div>
        {cursos.length > 1 && (
          <select
            style={s.select}
            value={cursoSel?.id || ''}
            onChange={e => setCursoSel(cursos.find(c => c.id === parseInt(e.target.value)))}
          >
            {cursos.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre_alumno ? `${c.nombre_alumno.split(' ')[0]} — ${c.nombre}` : c.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={s.grid}>
        {/* Fila de encabezado */}
        <div style={s.headCell}>Hora</div>
        {DIAS.map(d => <div key={d} style={s.headCell}>{d}</div>)}

        {/* Filas */}
        {BLOQUES.map((b, bIdx) => (
          <div key={bIdx} style={{ display: 'contents' }}>
            {/* Celda de hora */}
            <div style={{
              ...s.timeCell,
              ...(b.type !== 'class' ? {
                background: b.type === 'lunch' ? 'rgba(251,192,45,0.15)' : 'var(--color-muted)',
              } : {})
            }}>
              {b.type === 'class' ? (
                <>
                  <div style={{ fontWeight: 800, fontSize: '10px', marginBottom: '2px' }}>{b.inicio}</div>
                  <div style={{ fontSize: '9px', opacity: 0.5 }}>—</div>
                  <div style={{ fontWeight: 800, fontSize: '10px', marginTop: '2px' }}>{b.fin}</div>
                </>
              ) : (
                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.6 }}>
                  {b.label}
                </div>
              )}
            </div>

            {b.type === 'class' ? (
              DIAS.map((_d, dIdx) => {
                const entry = getEntry(dIdx, b.inicio);
                const color = entry ? getSubjectColor(entry.nombre_asignatura) : null;
                return (
                  <div key={dIdx} style={s.cell}>
                    {entry ? (
                      <div style={{
                        background: color.bg,
                        color: color.text,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.3 }}>
                          {entry.nombre_asignatura}
                        </div>
                        {entry.nombre_profesor && (
                          <div style={{ fontSize: '10px', opacity: 0.85, marginTop: 'auto' }}>
                            {entry.nombre_profesor.split(' ').slice(0, 2).join(' ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        flex: 1,
                        border: '1px dashed var(--color-border)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'var(--color-foreground)',
                        opacity: 0.25,
                      }}>
                        Libre
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{
                gridColumn: 'span 5',
                background: b.type === 'lunch' ? 'rgba(251,192,45,0.12)' : 'var(--color-muted)',
                color: b.type === 'lunch' ? '#b8860b' : 'var(--color-foreground)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: b.type === 'lunch' ? 1 : 0.5,
                height: b.type === 'lunch' ? '36px' : '18px',
              }}>
                {b.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
