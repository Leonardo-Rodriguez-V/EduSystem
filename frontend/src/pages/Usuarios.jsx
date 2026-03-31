import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

const s = {
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' },
  pageTitle:  { fontSize: '20px', fontWeight: 700, color: '#1A2B4A' },
  pageSub:    { fontSize: '13px', color: '#607D8B', marginTop: '2px' },
  card:       { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: '20px' },
  tbl:        { width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' },
  th:         { textAlign: 'left', padding: '10px 12px', fontSize: '11.5px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '2px solid #E8EDF2' },
  td:         { padding: '12px', borderBottom: '1px solid #E8EDF2', color: '#2D3A4A', verticalAlign: 'middle' },
  badge:      (rol) => {
    const map = { director: ['#E3F2FD','#1565C0'], profesor: ['#E8F5E9','#2E7D32'], apoderado: ['#FFF3E0','#E65100'] };
    const [bg, color] = map[rol] || ['#F5F5F5','#607D8B'];
    return { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: bg, color, textTransform: 'capitalize' };
  },
  btnPri:    { padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: '#1565C0', color: '#fff' },
  btnSec:    { padding: '7px 12px', borderRadius: '6px', border: '1px solid #E8EDF2', cursor: 'pointer', fontSize: '12px', background: '#fff', color: '#607D8B' },
  btnDanger: { padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', background: '#FFEBEE', color: '#C62828' },
  input:     { width: '100%', padding: '9px 14px', border: '1.5px solid #E8EDF2', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#2D3A4A', boxSizing: 'border-box' },
  label:     { fontSize: '12px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'block' },
  select:    { width: '100%', padding: '9px 14px', border: '1.5px solid #E8EDF2', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#2D3A4A', background: '#fff', boxSizing: 'border-box' },
};

const FORM_VACIO = { nombre_completo: '', correo: '', contraseña: '', rol: 'profesor' };

export default function Usuarios() {
  const [usuarios,  setUsuarios]  = useState([]);
  const [alumnos,   setAlumnos]   = useState([]);
  const [busqueda,  setBusqueda]  = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [form,      setForm]      = useState(FORM_VACIO);
  const [mensaje,   setMensaje]   = useState({ texto: '', tipo: '' });
  const [guardando, setGuardando] = useState(false);
  const [cargando,  setCargando]  = useState(true);

  const cargarUsuarios = () => {
    apiFetch('/usuarios').then(r => r?.json()).then(data => {
      if (Array.isArray(data)) setUsuarios(data);
    }).catch(() => {}).finally(() => setCargando(false));
  };

  const cargarAlumnos = () => {
    apiFetch('/alumnos').then(r => r?.json()).then(data => {
      if (Array.isArray(data)) setAlumnos(data);
    }).catch(() => {});
  };

  useEffect(() => { cargarUsuarios(); cargarAlumnos(); }, []);

  const abrirCrear = () => { setEditando(null); setForm(FORM_VACIO); setMensaje({ texto: '', tipo: '' }); setModal(true); };
  const abrirEditar = (u) => {
    setEditando(u);
    setForm({ nombre_completo: u.nombre_completo, correo: u.correo, contraseña: '', rol: u.rol });
    setMensaje({ texto: '', tipo: '' });
    setModal(true);
  };
  const cerrar = () => { setModal(false); setEditando(null); };

  const guardar = async () => {
    if (!form.nombre_completo.trim() || !form.correo.trim()) {
      return setMensaje({ texto: 'Nombre y correo son obligatorios.', tipo: 'error' });
    }
    if (!editando && (form.contraseña.length < 8 || !/\d/.test(form.contraseña))) {
      return setMensaje({ texto: 'La contraseña debe tener mínimo 8 caracteres y un número.', tipo: 'error' });
    }

    setGuardando(true);
    try {
      const body = editando
        ? { nombre_completo: form.nombre_completo, correo: form.correo, rol: form.rol, ...(form.contraseña ? { contraseña: form.contraseña } : {}) }
        : { nombre_completo: form.nombre_completo, correo: form.correo, contraseña: form.contraseña, rol: form.rol };

      const res  = await apiFetch(editando ? `/usuarios/${editando.id}` : '/usuarios', {
        method: editando ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      const data = await res?.json();

      if (res?.ok) {
        cargarUsuarios();
        cerrar();
      } else {
        setMensaje({ texto: data?.error || 'Error al guardar.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    const res = await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
    if (res?.ok) setUsuarios(prev => prev.filter(u => u.id !== id));
  };

  const vincularApoderado = async (idApoderado, idAlumno) => {
    const res = await apiFetch(`/alumnos/${idAlumno}`, {
      method: 'PUT',
      body: JSON.stringify({ id_apoderado: idApoderado }),
    });
    if (res?.ok) { cargarAlumnos(); }
  };

  /* Filtrado */
  const usuariosFiltrados = usuarios.filter(u => {
    const coincideBusqueda = u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
                             u.correo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === 'todos' || u.rol === filtroRol;
    return coincideBusqueda && coincideRol;
  });

  const iniciales = (nombre = '') => nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  return (
    <div>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <div style={s.pageTitle}>Gestión de Usuarios</div>
          <div style={s.pageSub}>Administra docentes, apoderados y directivos del establecimiento</div>
        </div>
        <button style={s.btnPri} onClick={abrirCrear}>+ Nuevo Usuario</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E8EDF2', borderRadius: '8px', padding: '8px 14px', flex: 1, maxWidth: '320px' }}>
          <span>🔍</span>
          <input
            placeholder="Buscar por nombre o correo..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '13.5px', width: '100%', color: '#2D3A4A' }}
          />
        </div>
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
          style={{ padding: '8px 14px', border: '1px solid #E8EDF2', borderRadius: '8px', fontSize: '13px', color: '#2D3A4A', background: '#fff', outline: 'none' }}>
          <option value="todos">Todos los roles</option>
          <option value="director">Director</option>
          <option value="profesor">Profesor</option>
          <option value="apoderado">Apoderado</option>
        </select>
        <span style={{ fontSize: '12px', color: '#90A4AE' }}>{usuariosFiltrados.length} usuarios</span>
      </div>

      {/* Tabla */}
      <div style={s.card}>
        {cargando ? (
          <p style={{ textAlign: 'center', color: '#90A4AE', padding: '30px', fontSize: '13px' }}>Cargando usuarios...</p>
        ) : (
          <table style={s.tbl}>
            <thead>
              <tr>
                <th style={s.th}>Usuario</th>
                <th style={s.th}>Correo</th>
                <th style={s.th}>Rol</th>
                <th style={s.th}>Vinculación</th>
                <th style={s.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(u => {
                const alumnoVinculado = u.rol === 'apoderado' ? alumnos.find(a => a.id_apoderado === u.id) : null;
                return (
                  <tr key={u.id}>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1565C0', fontSize: '13px', flexShrink: 0 }}>
                          {iniciales(u.nombre_completo)}
                        </div>
                        <strong style={{ fontSize: '13.5px' }}>{u.nombre_completo}</strong>
                      </div>
                    </td>
                    <td style={{ ...s.td, color: '#607D8B' }}>{u.correo}</td>
                    <td style={s.td}><span style={s.badge(u.rol)}>{u.rol}</span></td>
                    <td style={s.td}>
                      {u.rol === 'apoderado' ? (
                        <select
                          value={alumnoVinculado?.id || ''}
                          onChange={e => vincularApoderado(u.id, e.target.value)}
                          style={{ padding: '5px 10px', border: '1px solid #E8EDF2', borderRadius: '6px', fontSize: '12px', color: '#2D3A4A', background: '#fff', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="">Sin alumno</option>
                          {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre_completo}</option>)}
                        </select>
                      ) : (
                        <span style={{ color: '#B0BEC5', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={s.btnSec} onClick={() => abrirEditar(u)}>✏️ Editar</button>
                        <button style={s.btnDanger} onClick={() => eliminar(u.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {usuariosFiltrados.length === 0 && (
                <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#90A4AE', padding: '30px' }}>
                  No se encontraron usuarios
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={e => { if (e.target === e.currentTarget) cerrar(); }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '440px', boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A2B4A' }}>
                {editando ? 'Editar usuario' : 'Nuevo usuario'}
              </div>
              <button onClick={cerrar} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#90A4AE' }}>✕</button>
            </div>

            {mensaje.texto && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: mensaje.tipo === 'error' ? '#FFEBEE' : '#E8F5E9', color: mensaje.tipo === 'error' ? '#C62828' : '#2E7D32' }}>
                {mensaje.texto}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Nombre completo</label>
                <input style={s.input} placeholder="Ej. Ana Gómez" value={form.nombre_completo}
                  onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Correo electrónico</label>
                <input style={s.input} type="email" placeholder="ana@edusync.com" value={form.correo}
                  onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>{editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
                <input style={s.input} type="password" placeholder={editando ? 'Dejar vacío para no cambiar' : 'Mín. 8 chars + 1 número'}
                  value={form.contraseña} onChange={e => setForm(p => ({ ...p, contraseña: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Rol</label>
                <select style={s.select} value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}>
                  <option value="director">Director</option>
                  <option value="profesor">Profesor</option>
                  <option value="apoderado">Apoderado</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button style={s.btnSec} onClick={cerrar}>Cancelar</button>
              <button style={s.btnPri} onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
