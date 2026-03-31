import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

const s = {
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' },
  pageTitle:  { fontSize: '20px', fontWeight: 700, color: '#1A2B4A' },
  pageSub:    { fontSize: '13px', color: '#607D8B', marginTop: '2px' },
  card:       { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: '16px' },
  label:      { fontSize: '12px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'block' },
  input:      { width: '100%', padding: '9px 14px', border: '1px solid #E8EDF2', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#2D3A4A', boxSizing: 'border-box' },
  textarea:   { width: '100%', padding: '9px 14px', border: '1px solid #E8EDF2', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#2D3A4A', boxSizing: 'border-box', resize: 'vertical', minHeight: '90px' },
  btnPri:     { padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: '#1565C0', color: '#fff' },
  btnDanger:  { padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', background: '#FFEBEE', color: '#C62828' },
};

export default function MuroAvisos() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();
  const esProfesorODirector = usuario.rol === 'profesor' || usuario.rol === 'director';

  const [avisos,   setAvisos]   = useState([]);
  const [curso,    setCurso]    = useState(null);
  const [form,     setForm]     = useState({ titulo: '', contenido: '' });
  const [enviando, setEnviando] = useState(false);
  const [mensaje,  setMensaje]  = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(true);

  /* Cargar curso del usuario */
  useEffect(() => {
    apiFetch('/cursos').then(r => r?.json()).then(data => {
      if (!Array.isArray(data) || data.length === 0) return;
      const c = data.find(c => c.id_profesor_jefe === usuario.id) || data[0];
      setCurso(c);
    }).catch(() => {});
  }, [usuario.id]);

  /* Cargar avisos cuando tenemos curso */
  useEffect(() => {
    if (!curso) return;
    apiFetch(`/avisos?id_curso=${curso.id}`)
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setAvisos(data); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [curso]);

  const publicar = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      return setMensaje({ texto: 'Completa el título y el contenido.', tipo: 'error' });
    }
    setEnviando(true);
    try {
      const res  = await apiFetch('/avisos', {
        method: 'POST',
        body: JSON.stringify({ id_curso: curso?.id, titulo: form.titulo, contenido: form.contenido }),
      });
      const data = await res?.json();
      if (res?.ok) {
        setAvisos(prev => [{ ...data, nombre_autor: usuario.nombre_completo }, ...prev]);
        setForm({ titulo: '', contenido: '' });
        setMensaje({ texto: 'Aviso publicado correctamente.', tipo: 'exito' });
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
      <div style={s.pageHeader}>
        <div>
          <div style={s.pageTitle}>Muro de Avisos — {curso?.nombre || 'Cargando...'}</div>
          <div style={s.pageSub}>Comunicaciones del curso para apoderados y alumnos</div>
        </div>
      </div>

      {/* Formulario (solo profesor/director) */}
      {esProfesorODirector && (
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
          <div style={{ color: '#90A4AE', fontSize: '14px' }}>No hay avisos publicados todavía.</div>
        </div>
      ) : (
        <div>
          {avisos.map(aviso => (
            <div key={aviso.id} style={{ ...s.card, borderLeft: '4px solid #1565C0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A2B4A' }}>{aviso.titulo}</div>
                  <div style={{ fontSize: '12px', color: '#90A4AE', marginTop: '3px' }}>
                    {formatFecha(aviso.creado_en)}
                  </div>
                </div>
                {esProfesorODirector && (
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
