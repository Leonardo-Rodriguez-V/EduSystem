import { useState, useEffect } from 'react';
import apiFetch from '../utils/api';

const s = {
  header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  title:      { fontSize: '20px', fontWeight: 700, color: '#1A2B4A' },
  select:     { padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8EDF2', fontSize: '13.5px', fontWeight: 600, background: '#fff', color: '#1565C0', outline: 'none', cursor: 'pointer' },
  grid:       { display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gap: '1px', background: '#E8EDF2', border: '1px solid #E8EDF2', borderRadius: '12px', overflow: 'hidden' },
  headCell:   { background: '#F8FAFC', padding: '12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '0.5px' },
  timeCell:   { background: '#F8FAFC', padding: '12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#90A4AE', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  cell:       { background: '#fff', padding: '10px', minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '4px' },
  entry:      (bg) => ({ background: bg || '#E3F2FD', padding: '8px', borderRadius: '8px', borderLeft: '3px solid #1565C0' }),
  entryAsig:  { fontSize: '12px', fontWeight: 700, color: '#1A237E' },
  entryTime:  { fontSize: '10px', color: '#546E7A', marginTop: '2px' },
};

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const BLOQUES = [
  { type: 'class',  inicio: '08:00', fin: '09:30', label: 'Bloque 1' },
  { type: 'break',  inicio: '09:30', fin: '09:45', label: 'Recreo' },
  { type: 'class',  inicio: '09:45', fin: '11:15', label: 'Bloque 2' },
  { type: 'break',  inicio: '11:15', fin: '11:30', label: 'Recreo' },
  { type: 'class',  inicio: '11:30', fin: '13:00', label: 'Bloque 3' },
  { type: 'lunch',  inicio: '13:00', fin: '13:45', label: 'Almuerzo' },
  { type: 'class',  inicio: '13:45', fin: '15:15', label: 'Bloque 4' },
  { type: 'break',  inicio: '15:15', fin: '15:30', label: 'Recreo' },
  { type: 'class',  inicio: '15:30', fin: '17:00', label: 'Bloque 5' },
];

const COLORS = {
  'Lenguaje': '#FCE4EC', 'Literatura': '#FCE4EC',
  'Matemática': '#E3F2FD',
  'Ciencias': '#E8F5E9', 'Biología': '#E8F5E9', 'Física': '#E8F5E9', 'Química': '#E8F5E9',
  'Historia': '#FFF3E0', 'Filosofía': '#FFF3E0', 'Ciudadana': '#FFF3E0',
  'Inglés': '#EDE7F6',
  'Educación Física': '#F1F8E9',
  'Artes': '#FAFAFA', 'Música': '#FAFAFA', 'Tecnología': '#FAFAFA',
  'Orientación': '#E0F7FA', 'Religión': '#FBE9E7',
  'Taller': '#EFEBE9', 'Electivas': '#ECEFF1'
};

const BORDERS = {
  'Lenguaje': '#D81B60', 'Literatura': '#D81B60',
  'Matemática': '#1976D2',
  'Ciencias': '#388E3C', 'Biología': '#388E3C', 'Física': '#388E3C', 'Química': '#388E3C',
  'Historia': '#F57C00', 'Filosofía': '#F57C00', 'Ciudadana': '#F57C00',
  'Inglés': '#5E35B1',
  'Educación Física': '#689F38',
  'Artes': '#455A64', 'Música': '#455A64', 'Tecnología': '#455A64',
  'Orientación': '#0097A7', 'Religión': '#D84315',
  'Taller': '#5D4037', 'Electivas': '#455A64'
};

const getColor = (name) => {
  for (const key in COLORS) if (name.includes(key)) return COLORS[key];
  return '#F5F5F5';
};
const getBorder = (name) => {
  for (const key in BORDERS) if (name.includes(key)) return BORDERS[key];
  return '#9E9E9E';
};

export default function Horarios() {
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState(null);
  const [horario, setHorario] = useState([]);
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
      if (Array.isArray(data)) {
        setCursos(data);
        setCursoSel(data[0] || null);
      }
    }).finally(() => setCargando(false));
  }, [usuario.id, usuario.rol]);

  useEffect(() => {
    if (!cursoSel) return;
    apiFetch(`/horarios/curso/${cursoSel.id}`)
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setHorario(data); });
  }, [cursoSel]);

  const getEntry = (diaIdx, bloqueInicio) => {
    return horario.find(h => Number(h.dia_semana) === (diaIdx + 1) && h.bloque_inicio.startsWith(bloqueInicio));
  };

  return (
    <div style={{ padding: '0 10px' }}>
      <div style={s.header}>
        <div style={s.title}>Horario de Clases — {cursoSel?.nombre}</div>
        {cursos.length > 1 && (
          <select
            style={s.select}
            value={cursoSel?.id || ''}
            onChange={(e) => setCursoSel(cursos.find(c => c.id === parseInt(e.target.value)))}
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
        {/* Header row */}
        <div style={s.headCell}>Hora</div>
        {DIAS.map(d => <div key={d} style={s.headCell}>{d}</div>)}

        {/* Rows */}
        {BLOQUES.map((b, bIdx) => (
          <div key={bIdx} style={{ display: 'contents' }}>
            <div style={{ ...s.timeCell, ...(b.type !== 'class' ? { background: '#f0f4f7', color: '#78909c' } : {}) }}>
              <div style={{fontWeight: 800, fontSize: '10px', marginBottom: '4px'}}>{b.inicio}</div>
              <div style={{ fontSize: '9px', opacity: 0.6 }}>a</div>
              <div style={{fontWeight: 800, fontSize: '10px', marginTop: '4px'}}>{b.fin}</div>
            </div>

            {b.type === 'class' ? (
              DIAS.map((_d, dIdx) => {
                const entry = getEntry(dIdx, b.inicio);
                return (
                  <div key={dIdx} style={s.cell}>
                    {entry ? (
                      <div style={{
                        ...s.entry(getColor(entry.nombre_asignatura)),
                        borderLeft: `4px solid ${getBorder(entry.nombre_asignatura)}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s',
                        cursor: 'default'
                      }}>
                        <div style={s.entryAsig}>{entry.nombre_asignatura}</div>
                        {entry.nombre_profesor && (
                          <div style={s.entryTime}>
                            {entry.nombre_profesor.split(' ').slice(0,2).join(' ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ flex: 1, border: '1px dashed #E0E0E0', borderRadius: '8px', opacity: 0.5 }} />
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{
                gridColumn: 'span 5',
                background: b.type === 'lunch' ? '#FFF9C4' : '#ECEFF1',
                color: b.type === 'lunch' ? '#FBC02D' : '#90A4AE',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: b.type === 'lunch' ? '40px' : '20px'
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
