import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

/* ── Estilos reutilizables ── */
const s = {
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' },
  pageTitle:  { fontSize: '20px', fontWeight: 700, color: '#1A2B4A' },
  pageSub:    { fontSize: '13px', color: '#607D8B', marginTop: '2px' },
  card:       { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: '20px' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  cardTitle:  { fontSize: '15px', fontWeight: 600, color: '#1A2B4A' },
  tbl:        { width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' },
  th:         { textAlign: 'left', padding: '10px 12px', fontSize: '11.5px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '2px solid #E8EDF2' },
  td:         { padding: '10px 12px', borderBottom: '1px solid #E8EDF2', color: '#2D3A4A', verticalAlign: 'middle' },
  badge:      (bg, color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: bg, color }),
  btnPri:     { padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: '#1565C0', color: '#fff' },
  btnSec:     { padding: '6px 12px', borderRadius: '6px', border: '1px solid #E8EDF2', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: '#fff', color: '#607D8B' },
  btnDanger:  { padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', background: '#FFEBEE', color: '#C62828' },
  input:      { width: '100%', padding: '9px 14px', border: '1px solid #E8EDF2', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#2D3A4A', boxSizing: 'border-box' },
  label:      { fontSize: '12px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'block' },
};

function colorNota(n) {
  if (!n && n !== 0) return ['#F5F7FA', '#607D8B'];
  if (n >= 6)   return ['#E8F5E9', '#2E7D32'];
  if (n >= 4)   return ['#FFF8E1', '#F57F17'];
  return ['#FFEBEE', '#C62828'];
}

export default function Notas() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  const [curso,      setCurso]      = useState(null);
  const [alumnos,    setAlumnos]    = useState([]);
  const [notas,      setNotas]      = useState({});   // { id_alumno: [nota, ...] }
  const [alumnoSel,  setAlumnoSel]  = useState(null); // alumno seleccionado para modal
  const [modalAbierto, setModal]    = useState(false);
  const [form,       setForm]       = useState({ descripcion: '', calificacion: '', fecha: new Date().toISOString().split('T')[0] });
  const [editando,   setEditando]   = useState(null); // id de nota en edición
  const [cargando,   setCargando]   = useState(true);
  const [guardando,  setGuardando]  = useState(false);
  const [mensaje,    setMensaje]    = useState({ texto: '', tipo: '' });

  /* 1. Cargar curso del profesor */
  useEffect(() => {
    apiFetch('/cursos').then(r => r?.json()).then(data => {
      if (!Array.isArray(data) || data.length === 0) return;
      const c = data.find(c => c.id_profesor_jefe === usuario.id) || data[0];
      setCurso(c);
    }).catch(() => {});
  }, [usuario.id]);

  /* 2. Cargar alumnos cuando tenemos curso */
  useEffect(() => {
    if (!curso) return;
    apiFetch(`/alumnos?id_curso=${curso.id}`)
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setAlumnos(data); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [curso]);

  /* 3. Cargar notas de todos los alumnos cuando tenemos alumnos */
  useEffect(() => {
    if (alumnos.length === 0) return;
    Promise.all(
      alumnos.map(a =>
        apiFetch(`/notas?id_alumno=${a.id}`)
          .then(r => r?.json())
          .then(data => ({ id: a.id, notas: Array.isArray(data) ? data : [] }))
          .catch(() => ({ id: a.id, notas: [] }))
      )
    ).then(resultados => {
      const mapa = {};
      resultados.forEach(r => { mapa[r.id] = r.notas; });
      setNotas(mapa);
    });
  }, [alumnos]);

  const promedio = (id) => {
    const ns = notas[id];
    if (!ns || ns.length === 0) return null;
    return (ns.reduce((s, n) => s + parseFloat(n.calificacion), 0) / ns.length).toFixed(1);
  };

  const abrirModal = (alumno, nota = null) => {
    setAlumnoSel(alumno);
    if (nota) {
      setEditando(nota.id);
      setForm({ descripcion: nota.descripcion, calificacion: nota.calificacion, fecha: nota.fecha?.split('T')[0] || '' });
    } else {
      setEditando(null);
      setForm({ descripcion: '', calificacion: '', fecha: new Date().toISOString().split('T')[0] });
    }
    setModal(true);
    setMensaje({ texto: '', tipo: '' });
  };

  const cerrarModal = () => { setModal(false); setAlumnoSel(null); setEditando(null); };

  const guardar = async () => {
    const cal = parseFloat(form.calificacion);
    if (!form.descripcion.trim()) return setMensaje({ texto: 'Ingresa una descripción.', tipo: 'error' });
    if (isNaN(cal) || cal < 1 || cal > 7) return setMensaje({ texto: 'La calificación debe ser entre 1.0 y 7.0.', tipo: 'error' });

    setGuardando(true);
    try {
      const endpoint = editando ? `/notas/${editando}` : '/notas';
      const method   = editando ? 'PUT' : 'POST';
      const body     = editando
        ? { descripcion: form.descripcion, calificacion: cal, fecha: form.fecha }
        : { id_alumno: alumnoSel.id, descripcion: form.descripcion, calificacion: cal, fecha: form.fecha };

      const res  = await apiFetch(endpoint, { method, body: JSON.stringify(body) });
      const data = await res?.json();

      if (res?.ok) {
        // Actualizar estado local sin recargar todo
        setNotas(prev => {
          const lista = prev[alumnoSel.id] ? [...prev[alumnoSel.id]] : [];
          if (editando) {
            const idx = lista.findIndex(n => n.id === editando);
            if (idx !== -1) lista[idx] = data;
          } else {
            lista.push(data);
          }
          return { ...prev, [alumnoSel.id]: lista };
        });
        cerrarModal();
      } else {
        setMensaje({ texto: data?.error || 'Error al guardar.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (alumnoId, notaId) => {
    if (!window.confirm('¿Eliminar esta nota?')) return;
    const res = await apiFetch(`/notas/${notaId}`, { method: 'DELETE' });
    if (res?.ok) {
      setNotas(prev => ({ ...prev, [alumnoId]: prev[alumnoId].filter(n => n.id !== notaId) }));
    }
  };

  /* ── Promedio general del curso ── */
  const promediosCurso = alumnos.map(a => promedio(a.id)).filter(p => p !== null).map(Number);
  const promedioCurso  = promediosCurso.length > 0
    ? (promediosCurso.reduce((s, p) => s + p, 0) / promediosCurso.length).toFixed(1)
    : '—';

  return (
    <div>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <div style={s.pageTitle}>Notas — {curso?.nombre || 'Cargando...'}</div>
          <div style={s.pageSub}>Ingresa y administra las calificaciones de tus alumnos</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px' }}>Promedio del curso</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: colorNota(Number(promedioCurso))[1] }}>{promedioCurso}</div>
          </div>
        </div>
      </div>

      {/* Tabla alumnos */}
      <div style={s.card}>
        {cargando ? (
          <p style={{ color: '#90A4AE', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Cargando alumnos...</p>
        ) : alumnos.length === 0 ? (
          <p style={{ color: '#90A4AE', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No hay alumnos en este curso.</p>
        ) : (
          <table style={s.tbl}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Alumno</th>
                <th style={s.th}>RUT</th>
                <th style={s.th}>Notas</th>
                <th style={s.th}>Promedio</th>
                <th style={s.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a, i) => {
                const ns  = notas[a.id] || [];
                const prom = promedio(a.id);
                const [bg, color] = colorNota(Number(prom));
                return (
                  <tr key={a.id}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={s.td}><strong>{a.nombre_completo}</strong></td>
                    <td style={s.td}>{a.rut}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {ns.map(n => (
                          <span
                            key={n.id}
                            title={`${n.descripcion} — ${n.fecha?.split('T')[0] || ''}`}
                            onClick={() => abrirModal(a, n)}
                            style={{ ...s.badge(...colorNota(n.calificacion)), cursor: 'pointer' }}
                          >
                            {parseFloat(n.calificacion).toFixed(1)}
                          </span>
                        ))}
                        {ns.length === 0 && <span style={{ color: '#90A4AE', fontSize: '12px' }}>Sin notas</span>}
                      </div>
                    </td>
                    <td style={s.td}>
                      {prom ? <span style={s.badge(bg, color)}>{prom}</span> : <span style={{ color: '#90A4AE', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={s.td}>
                      <button style={s.btnPri} onClick={() => abrirModal(a)}>+ Nota</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal agregar / editar nota */}
      {modalAbierto && alumnoSel && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}
          onClick={e => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '420px', boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A2B4A' }}>
                  {editando ? 'Editar nota' : 'Nueva nota'}
                </div>
                <div style={{ fontSize: '12px', color: '#607D8B', marginTop: '2px' }}>{alumnoSel.nombre_completo}</div>
              </div>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#90A4AE' }}>✕</button>
            </div>

            {mensaje.texto && (
              <div style={{
                marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
                background: mensaje.tipo === 'error' ? '#FFEBEE' : '#E8F5E9',
                color: mensaje.tipo === 'error' ? '#C62828' : '#2E7D32',
              }}>
                {mensaje.texto}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={s.label}>Descripción</label>
              <input style={s.input} placeholder="Ej. Prueba 1, Control, Trabajo..."
                value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={s.label}>Calificación (1.0 – 7.0)</label>
                <input style={s.input} type="number" min="1" max="7" step="0.1" placeholder="Ej. 6.5"
                  value={form.calificacion} onChange={e => setForm(p => ({ ...p, calificacion: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Fecha</label>
                <input style={s.input} type="date"
                  value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button style={s.btnSec} onClick={cerrarModal}>Cancelar</button>
              {editando && (
                <button style={s.btnDanger} onClick={() => { eliminar(alumnoSel.id, editando); cerrarModal(); }}>
                  Eliminar
                </button>
              )}
              <button style={s.btnPri} onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar nota'}
              </button>
            </div>

            {/* Historial de notas del alumno seleccionado */}
            {(notas[alumnoSel.id] || []).length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #E8EDF2', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Notas registradas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(notas[alumnoSel.id] || []).map(n => (
                    <div key={n.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', background: '#F5F7FA', borderRadius: '8px',
                    }}>
                      <span style={{ fontSize: '13px', color: '#2D3A4A' }}>{n.descripcion}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={s.badge(...colorNota(n.calificacion))}>{parseFloat(n.calificacion).toFixed(1)}</span>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#90A4AE' }}
                          onClick={() => abrirModal(alumnoSel, n)}>✏️</button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                          onClick={() => eliminar(alumnoSel.id, n.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
