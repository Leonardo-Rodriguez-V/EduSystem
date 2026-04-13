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
  { inicio: '08:00', fin: '09:30' },
  { inicio: '09:45', fin: '11:15' },
  { inicio: '11:30', fin: '13:00' },
  { inicio: '14:00', fin: '15:30' },
];

export default function Horarios() {
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState(null);
  const [horario, setHorario] = useState([]);
  const [, setCargando] = useState(true);

  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  useEffect(() => {
    if (usuario.rol === 'apoderado') {
      // Apoderado: mostrar solo el horario del curso de su hijo
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
    <div>
      <div style={s.header}>
        <div style={s.title}>Horario de Clases</div>
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
            <div style={s.timeCell}>
              <div>{b.inicio}</div>
              <div style={{ fontSize: '9px', opacity: 0.6 }}>a</div>
              <div>{b.fin}</div>
            </div>
            {DIAS.map((_d, dIdx) => {
              const entry = getEntry(dIdx, b.inicio);
              return (
                <div key={dIdx} style={s.cell}>
                  {entry ? (
                    <div style={s.entry()}>
                      <div style={s.entryAsig}>{entry.nombre_asignatura}</div>
                      {entry.nombre_profesor && (
                        <div style={s.entryTime}>{entry.nombre_profesor.split(' ').slice(0,2).join(' ')}</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ flex: 1, border: '1px dashed #ECEFF1', borderRadius: '8px' }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

    </div>
  );
}
