import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

const s = {
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' },
  pageTitle:  { fontSize: '20px', fontWeight: 700, color: '#1A2B4A' },
  pageSub:    { fontSize: '13px', color: '#607D8B', marginTop: '2px' },
  card:       { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: '16px' },
  label:      { fontSize: '12px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'block' },
  input:      { width: '100%', padding: '9px 14px', border: '1px solid #E8EDF2', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#2D3A4A', boxSizing: 'border-box' },
  textarea:   { width: '100%', padding: '9px 14px', border: '1px solid #E8EDF2', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#2D3A4A', boxSizing: 'border-box', resize: 'vertical', minHeight: '90px' },
  select:     { padding: '8px 14px', border: '1px solid #E8EDF2', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#1565C0', fontWeight: 600, background: '#F5F7FA', cursor: 'pointer' },
  btnPri:     { padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: '#1565C0', color: '#fff' },
  btnDanger:  { padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', background: '#FFEBEE', color: '#C62828' },
};

export default function MuroAvisos() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();
  const esDirector = usuario.rol === 'director';
  const esProfesor = usuario.rol === 'profesor';
  const puedePublicar = esDirector || esProfesor;

  const esApoderado = usuario.rol === 'apoderado';

  const [cursos,    setCursos]    = useState([]);
  const [cursoSel,  setCursoSel]  = useState(null);   // curso que se está viendo
  const [cursoPost, setCursoPost] = useState(null);   // curso al que se publicará
  const [avisos,    setAvisos]    = useState([]);
  const [form,      setForm]      = useState({ titulo: '', contenido: '' });
  const [enviando,  setEnviando]  = useState(false);
  const [mensaje,   setMensaje]   = useState({ texto: '', tipo: '' });
  const [cargando,  setCargando]  = useState(true);

  // 1. Cargar cursos según rol
  useEffect(() => {
    if (esApoderado) {
      // Apoderado: cargar cursos de sus hijos
      apiFetch(`/alumnos/apoderado/${usuario.id}`).then(r => r?.json()).then(data => {
        if (!Array.isArray(data) || data.length === 0) { setCargando(false); return; }
        const vistos = new Set();
        const cursosHijos = [];
        for (const a of data) {
          if (a.id_curso && !vistos.has(a.id_curso)) {
            vistos.add(a.id_curso);
            cursosHijos.push({ id: a.id_curso, nombre: a.nombre_curso });
          }
        }
        if (cursosHijos.length === 0) { setCargando(false); return; }
        setCursos(cursosHijos);
        setCursoSel(cursosHijos[0]);
      }).catch(() => setCargando(false));
      return;
    }
    const url = esDirector ? '/cursos' : `/cursos?id_profesor=${usuario.id}`;
    apiFetch(url).then(r => r?.json()).then(data => {
      if (!Array.isArray(data) || data.length === 0) { setCargando(false); return; }
      setCursos(data);
      // Profesor → su curso jefe por defecto; Director → primer curso
      const def = data.find(c => c.id_profesor_jefe === usuario.id) || data[0];
      setCursoSel(def);
      setCursoPost(def);
    }).catch(() => setCargando(false));
  }, [usuario.id, esDirector, esApoderado]);

  // 2. Cargar avisos cuando cambia el curso seleccionado
  useEffect(() => {
    if (!cursoSel) return;
    setCargando(true);
    apiFetch(`/avisos?id_curso=${cursoSel.id}`)
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setAvisos(data); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [cursoSel]);

  const publicar = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      return setMensaje({ texto: 'Completa el título y el contenido.', tipo: 'error' });
    }
    if (!cursoPost) {
      return setMensaje({ texto: 'Selecciona un curso para publicar.', tipo: 'error' });
    }
    setEnviando(true);
    try {
      const res  = await apiFetch('/avisos', {
        method: 'POST',
        body: JSON.stringify({
          id_curso:  cursoPost.id,
          id_autor:  usuario.id,
          titulo:    form.titulo,
          contenido: form.contenido,
        }),
      });
      const data = await res?.json();
      if (res?.ok) {
        // Si el aviso es del curso que estamos viendo, lo agregamos a la lista
        if (cursoPost.id === cursoSel?.id) {
          setAvisos(prev => [{ ...data, nombre_autor: usuario.nombre_completo, nombre_curso: cursoPost.nombre }, ...prev]);
        }
        setForm({ titulo: '', contenido: '' });
        setMensaje({ texto: `Aviso publicado en ${cursoPost.nombre}.`, tipo: 'exito' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      } else {
        setMensaje({ texto: data?.error || 'Error al publicar.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este aviso?')) return;
    const res = await apiFetch(`/avisos/${id}`, { method: 'DELETE' });
    if (res?.ok) setAvisos(prev => prev.filter(a => a.id !== id));
  };

  const formatFecha = (f) => {
    if (!f) return '';
    return new Date(f).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* Header con selector de curso para ver avisos */}
      <div style={s.pageHeader}>
        <div>
          <div style={s.pageTitle}>Muro de Avisos</div>
          <div style={s.pageSub}>Comunicaciones del curso para apoderados</div>
        </div>
        {cursos.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#607D8B' }}>Ver curso:</span>
            <select
              style={s.select}
              value={cursoSel?.id || ''}
              onChange={e => setCursoSel(cursos.find(c => c.id === parseInt(e.target.value)))}
            >
              {cursos.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Formulario (solo profesor/director) */}
      {puedePublicar && (
        <div style={s.card}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A2B4A', marginBottom: '16px' }}>
            📢 Publicar nuevo aviso
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

          {/* Selector de curso destino (siempre visible al publicar) */}
          {cursos.length > 1 && (
            <div style={{ marginBottom: '12px' }}>
              <label style={s.label}>Publicar en el curso</label>
              <select
                style={{ ...s.select, width: '100%', boxSizing: 'border-box' }}
                value={cursoPost?.id || ''}
                onChange={e => setCursoPost(cursos.find(c => c.id === parseInt(e.target.value)))}
              >
                {cursos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={s.label}>Título</label>
            <input style={s.input} placeholder="Ej. Reunión de apoderados, Prueba aplazada..."
              value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={s.label}>Contenido</label>
            <textarea style={s.textarea} placeholder="Escribe el aviso aquí..."
              value={form.contenido} onChange={e => setForm(p => ({ ...p, contenido: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={s.btnPri} onClick={publicar} disabled={enviando}>
              {enviando ? 'Publicando...' : '📤 Publicar aviso'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de avisos */}
      {cargando ? (
        <p style={{ color: '#90A4AE', textAlign: 'center', padding: '40px', fontSize: '13px' }}>Cargando avisos...</p>
      ) : avisos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '2px dashed #E8EDF2' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <div style={{ color: '#90A4AE', fontSize: '14px' }}>No hay avisos publicados en este curso.</div>
        </div>
      ) : (
        <div>
          {avisos.map(aviso => (
            <div key={aviso.id} style={{ ...s.card, borderLeft: '4px solid #1565C0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A2B4A' }}>{aviso.titulo}</div>
                  <div style={{ fontSize: '12px', color: '#90A4AE', marginTop: '3px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>{formatFecha(aviso.creado_en)}</span>
                    {aviso.nombre_autor && <span>✍️ {aviso.nombre_autor}</span>}
                    {esDirector && aviso.nombre_curso && (
                      <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '1px 8px', borderRadius: '10px', fontWeight: 600 }}>
                        {aviso.nombre_curso}
                      </span>
                    )}
                  </div>
                </div>
                {puedePublicar && (
                  <button style={s.btnDanger} onClick={() => eliminar(aviso.id)}>🗑️ Eliminar</button>
                )}
              </div>
              <p style={{ fontSize: '14px', color: '#455A64', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                {aviso.mensaje}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
