import { useState, useEffect } from 'react';
import apiFetch from '../utils/api';

const s = {
  header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  title:      { fontSize: '20px', fontWeight: 700, color: '#1A2B4A' },
  select:     { padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8EDF2', fontSize: '13.5px', fontWeight: 600, background: '#fff', color: '#1565C0', outline: 'none', cursor: 'pointer' },
  card:       { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: '16px' },
  asigBadge:  { fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', background: '#E3F2FD', color: '#1565C0', padding: '3px 8px', borderRadius: '12px', marginBottom: '8px', display: 'inline-block' },
  evalTitle:  { fontSize: '15px', fontWeight: 700, color: '#1A237E' },
  evalDate:   { fontSize: '13px', color: '#607D8B', margin: '4px 0' },
  evalDesc:   { fontSize: '13.5px', color: '#455A64', marginTop: '8px' },
  btnPlus:    { background: '#1565C0', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  modal:      { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCont:  { background: '#fff', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 40px rgba(0,0,0,.2)' },
  input:      { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E8EDF2', marginBottom: '12px', boxSizing: 'border-box' },
};

export default function Calendario() {
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [asignaturas, setAsignaturas] = useState([]);
  const [form, setForm] = useState({ id_asignatura: '', titulo: '', descripcion: '', fecha: '' });

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
      }).catch(() => {}).finally(() => setCargando(false));
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
    apiFetch(`/evaluaciones/curso/${cursoSel.id}`)
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setEvaluaciones(data); });
      
    if (usuario.rol === 'profesor') {
      apiFetch(`/notas/config/asignaturas?id_profesor=${usuario.id}&id_curso=${cursoSel.id}`)
        .then(r => r?.json())
        .then(data => { if (Array.isArray(data)) setAsignaturas(data); });
    }
  }, [cursoSel, usuario.id, usuario.rol]);

  const guardar = async () => {
    const res = await apiFetch('/evaluaciones', {
      method: 'POST',
      body: JSON.stringify({ ...form, id_curso: cursoSel.id, id_profesor: usuario.id })
    });
    if (res?.ok) {
      const nueva = await res.json();
      setEvaluaciones(prev => [...prev, nueva]);
      setModal(false);
      setForm({ id_asignatura: '', titulo: '', descripcion: '', fecha: '' });
    }
  };

  return (
    <div>
      <div style={s.header}>
        <div style={s.title}>Calendario de Evaluaciones</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {cursos.length > 1 && (
            <select 
              style={s.select} 
              value={cursoSel?.id || ''} 
              onChange={(e) => setCursoSel(cursos.find(c => c.id === parseInt(e.target.value)))}
            >
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          )}
          {usuario.rol === 'profesor' && <button style={s.btnPlus} onClick={() => setModal(true)}>+ Nueva Evaluación</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {evaluaciones.length === 0 ? (
          <p style={{ color: '#90A4AE', fontSize: '14px' }}>No hay evaluaciones programadas.</p>
        ) : (
          evaluaciones.map(ev => (
            <div key={ev.id} style={s.card}>
              <span style={s.asigBadge}>{ev.nombre_asignatura}</span>
              <div style={s.evalTitle}>{ev.titulo}</div>
              <div style={s.evalDate}>📅 {new Date(ev.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div style={s.evalDesc}>{ev.descripcion}</div>
              <div style={{ borderTop: '1px solid #F5F7FA', marginTop: '12px', paddingTop: '8px', fontSize: '11px', color: '#B0BEC5' }}>
                Profesor: {ev.nombre_profesor || 'Asignado'}
              </div>
            </div>
          ))
        )}
      </div>

      {modal && (
        <div style={s.modal}>
          <div style={s.modalCont}>
            <h3 style={{ marginTop: 0 }}>Programar Evaluación</h3>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Asignatura</label>
            <select 
              style={s.input} 
              value={form.id_asignatura} 
              onChange={e => setForm({...form, id_asignatura: e.target.value})}
            >
              <option value="">Selecciona...</option>
              {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Título</label>
            <input style={s.input} value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="Ej: Prueba Unidad 1" />
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Fecha</label>
            <input type="date" style={s.input} value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Descripción</label>
            <textarea style={{...s.input, height: '80px'}} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Contenidos..." />
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button style={{...s.btnPlus, background: '#E0E0E0', color: '#424242'}} onClick={() => setModal(false)}>Cancelar</button>
              <button style={{...s.btnPlus, flex: 1}} onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
