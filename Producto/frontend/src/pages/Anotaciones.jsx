import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

const TIPO_CONFIG = {
  positiva:    { label: 'Positiva',    bg: 'rgba(21,128,61,0.12)',   color: '#15803d', dot: '#10b981' },
  negativa:    { label: 'Negativa',    bg: 'rgba(220,38,38,0.1)',    color: '#dc2626', dot: '#ef4444' },
  observacion: { label: 'Observación', bg: 'rgba(99,102,241,0.1)',   color: '#4f46e5', dot: '#6366f1' },
};

const s = {
  title:    { fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)' },
  sub:      { fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.5, marginTop: '2px' },
  card:     { background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' },
  label:    { fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.6, marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '.4px' },
  select:   { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-muted)', color: 'var(--color-foreground)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  input:    { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-muted)', color: 'var(--color-foreground)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-muted)', color: 'var(--color-foreground)', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '90px' },
  btnPri:   { padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: 'var(--color-primary)', color: '#fff' },
  btnDel:   { padding: '4px 9px', borderRadius: '6px', border: '1px solid var(--color-destructive)', cursor: 'pointer', fontSize: '11px', background: 'transparent', color: 'var(--color-destructive)', fontWeight: 600 },
  btnSec:   { padding: '4px 9px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: '11px', background: 'transparent', color: 'var(--color-foreground)', fontWeight: 600 },
};

export default function Anotaciones() {
  const usuario    = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();
  const esProfesor = usuario.rol === 'profesor';
  const esDirector = usuario.rol === 'director';
  const esApoderado = usuario.rol === 'apoderado';
  const puedeEscribir = esProfesor || esDirector;

  const [cursos,       setCursos]       = useState([]);
  const [cursoSel,     setCursoSel]     = useState(null);
  const [alumnos,      setAlumnos]      = useState([]);
  const [alumnoSel,    setAlumnoSel]    = useState(null);
  const [anotaciones,  setAnotaciones]  = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [filtroTipo,   setFiltroTipo]   = useState('todos');
  const [confirmId,    setConfirmId]    = useState(null);

  const [form,      setForm]      = useState({ texto: '', tipo: 'observacion' });
  const [enviando,  setEnviando]  = useState(false);
  const [mensaje,   setMensaje]   = useState({ texto: '', tipo: '' });

  // Cargar cursos y primer hijo (apoderado)
  useEffect(() => {
    if (esApoderado) {
      apiFetch(`/alumnos/apoderado/${usuario.id}`).then(r => r?.json()).then(data => {
        if (!Array.isArray(data) || data.length === 0) { setCargando(false); return; }
        setAlumnos(data);
        setAlumnoSel(data[0]);
        setCargando(false);
      }).catch(() => setCargando(false));
      return;
    }
    const url = esProfesor ? `/cursos?id_profesor=${usuario.id}` : '/cursos';
    apiFetch(url).then(r => r?.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setCursos(data);
        setCursoSel(data[0]);
      }
      setCargando(false);
    }).catch(() => setCargando(false));
  }, []);

  // Cargar alumnos al cambiar curso
  useEffect(() => {
    if (!cursoSel) return;
    apiFetch(`/alumnos?id_curso=${cursoSel.id}`).then(r => r?.json()).then(data => {
      if (Array.isArray(data)) { setAlumnos(data); setAlumnoSel(data[0] || null); }
    });
  }, [cursoSel]);

  // Cargar anotaciones al cambiar alumno
  useEffect(() => {
    if (!alumnoSel) return;
    apiFetch(`/anotaciones?id_alumno=${alumnoSel.id}`).then(r => r?.json()).then(data => {
      if (Array.isArray(data)) setAnotaciones(data);
    });
  }, [alumnoSel]);

  const guardar = async () => {
    if (!form.texto.trim() || !alumnoSel) return;
    setEnviando(true);
    try {
      const res  = await apiFetch('/anotaciones', {
        method: 'POST',
        body: JSON.stringify({ id_alumno: alumnoSel.id, id_profesor: usuario.id, texto: form.texto, tipo: form.tipo }),
      });
      const data = await res?.json();
      if (res?.ok) {
        setAnotaciones(prev => [{ ...data, nombre_profesor: usuario.nombre_completo, nombre_alumno: alumnoSel.nombre_completo }, ...prev]);
        setForm({ texto: '', tipo: 'observacion' });
        setMensaje({ texto: 'Anotación guardada.', tipo: 'exito' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 2500);
      } else {
        setMensaje({ texto: data?.error || 'Error al guardar.', tipo: 'error' });
      }
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (id) => {
    const res = await apiFetch(`/anotaciones/${id}`, { method: 'DELETE' });
    if (res?.ok) { setAnotaciones(prev => prev.filter(a => a.id !== id)); setConfirmId(null); }
  };

  const anotacionesFiltradas = filtroTipo === 'todos'
    ? anotaciones
    : anotaciones.filter(a => a.tipo === filtroTipo);

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';

  if (cargando) return (
    <div style={{ textAlign: 'center', padding: '60px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={s.title}>Libro de Anotaciones</div>
          <div style={s.sub}>
            {esApoderado ? 'Anotaciones de tus hijos' : esProfesor ? 'Anotaciones de tus cursos' : 'Todas las anotaciones del establecimiento'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: puedeEscribir ? '300px 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>

        {/* Panel izquierdo: selección + formulario */}
        {puedeEscribir && (
          <div>
            {/* Selector curso */}
            {cursos.length > 0 && (
              <div style={s.card}>
                <label style={s.label}>Curso</label>
                <select style={s.select} value={cursoSel?.id || ''} onChange={e => setCursoSel(cursos.find(c => c.id === parseInt(e.target.value)))}>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            {/* Selector alumno */}
            {alumnos.length > 0 && (
              <div style={s.card}>
                <label style={s.label}>Alumno</label>
                <select style={s.select} value={alumnoSel?.id || ''} onChange={e => setAlumnoSel(alumnos.find(a => a.id === parseInt(e.target.value)))}>
                  {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre_completo}</option>)}
                </select>
              </div>
            )}

            {/* Formulario nueva anotación */}
            <div style={s.card}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '14px' }}>
                Nueva anotación
              </div>

              {mensaje.texto && (
                <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
                  background: mensaje.tipo === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(21,128,61,0.1)',
                  color: mensaje.tipo === 'error' ? '#dc2626' : '#15803d',
                  border: `1px solid ${mensaje.tipo === 'error' ? 'rgba(220,38,38,0.3)' : 'rgba(21,128,61,0.3)'}`,
                }}>{mensaje.texto}</div>
              )}

              <label style={s.label}>Tipo</label>
              <select style={{ ...s.select, marginBottom: '12px' }} value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                <option value="observacion">Observación</option>
                <option value="positiva">Positiva</option>
                <option value="negativa">Negativa</option>
              </select>

              <label style={s.label}>Descripción</label>
              <textarea style={{ ...s.textarea, marginBottom: '14px' }}
                placeholder="Escribe la anotación aquí..."
                value={form.texto}
                onChange={e => setForm(p => ({ ...p, texto: e.target.value }))}
              />

              <button style={{ ...s.btnPri, width: '100%', opacity: (enviando || !alumnoSel) ? 0.6 : 1 }}
                onClick={guardar} disabled={enviando || !alumnoSel}>
                {enviando ? 'Guardando...' : 'Guardar anotación'}
              </button>
            </div>
          </div>
        )}

        {/* Panel derecho: lista de anotaciones */}
        <div>
          {/* Filtros + header alumno */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              {alumnoSel && (
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                  {alumnoSel.nombre_completo}
                  {alumnoSel.nombre_curso && <span style={{ fontSize: '12px', fontWeight: 500, opacity: 0.5, marginLeft: '8px' }}>{alumnoSel.nombre_curso}</span>}
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.45, marginTop: '2px' }}>
                {anotacionesFiltradas.length} anotacion{anotacionesFiltradas.length !== 1 ? 'es' : ''}
              </div>
            </div>

            {/* Selector apoderado con múltiples hijos */}
            {esApoderado && alumnos.length > 1 && (
              <select style={{ ...s.select, width: 'auto' }} value={alumnoSel?.id || ''} onChange={e => setAlumnoSel(alumnos.find(a => a.id === parseInt(e.target.value)))}>
                {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre_completo.split(' ')[0]}</option>)}
              </select>
            )}

            <div style={{ display: 'flex', gap: '6px' }}>
              {['todos', 'positiva', 'negativa', 'observacion'].map(t => (
                <button key={t} onClick={() => setFiltroTipo(t)}
                  style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: filtroTipo === t ? 'var(--color-primary)' : 'var(--color-muted)',
                    color: filtroTipo === t ? '#fff' : 'var(--color-foreground)',
                    opacity: filtroTipo === t ? 1 : 0.65,
                  }}>
                  {t === 'todos' ? 'Todas' : TIPO_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          {anotacionesFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: '12px', border: '2px dashed var(--color-border)' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📝</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '4px' }}>Sin anotaciones</div>
              <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.4 }}>
                {puedeEscribir ? 'Usa el formulario para agregar la primera.' : 'No hay anotaciones registradas aún.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {anotacionesFiltradas.map(an => {
                const tc = TIPO_CONFIG[an.tipo] || TIPO_CONFIG.observacion;
                return (
                  <div key={an.id} style={{ ...s.card, marginBottom: 0, borderLeft: `4px solid ${tc.dot}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '10px', background: tc.bg, color: tc.color }}>
                            {tc.label}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.45 }}>
                            {formatFecha(an.fecha)}
                          </span>
                          {an.nombre_profesor && (
                            <span style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.45 }}>
                              · {an.nombre_profesor}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-foreground)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {an.texto}
                        </p>
                      </div>

                      {puedeEscribir && (
                        <div style={{ flexShrink: 0 }}>
                          {confirmId === an.id ? (
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-destructive)', fontWeight: 600 }}>¿Eliminar?</span>
                              <button style={s.btnDel} onClick={() => eliminar(an.id)}>Sí</button>
                              <button style={s.btnSec} onClick={() => setConfirmId(null)}>No</button>
                            </div>
                          ) : (
                            <button style={s.btnDel} onClick={() => setConfirmId(an.id)}>Eliminar</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
