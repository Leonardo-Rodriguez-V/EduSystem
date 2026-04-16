import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

const s = {
  pageTitle:  { fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)' },
  pageSub:    { fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.5, marginTop: '2px' },
  card:       { background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' },
  th:         { textAlign: 'left', padding: '11px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '.5px', background: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)' },
  td:         { padding: '12px 14px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-foreground)', verticalAlign: 'middle', fontSize: '13.5px' },
  btnPri:     { padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: 'var(--color-primary)', color: '#fff' },
  btnSec:     { padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: '12px', background: 'transparent', color: 'var(--color-foreground)', fontWeight: 600 },
  btnDanger:  { padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-destructive)', cursor: 'pointer', fontSize: '12px', background: 'transparent', color: 'var(--color-destructive)', fontWeight: 600 },
  btnCancel:  { padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: '12px', background: 'transparent', color: 'var(--color-foreground)', fontWeight: 600 },
  input:      { width: '100%', padding: '9px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: 'var(--color-foreground)', background: 'var(--color-muted)', boxSizing: 'border-box' },
  label:      { fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'block' },
  select:     { width: '100%', padding: '9px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: 'var(--color-foreground)', background: 'var(--color-muted)', boxSizing: 'border-box' },
};

const ROL_COLORS = {
  director:  { bg: 'rgba(79,70,229,0.12)',  color: '#4f46e5' },
  profesor:  { bg: 'rgba(21,128,61,0.12)',  color: '#15803d' },
  apoderado: { bg: 'rgba(234,88,12,0.12)',  color: '#ea580c' },
};

const FORM_VACIO = { nombre_completo: '', correo: '', contraseña: '', rol: 'profesor' };

export default function Usuarios() {
  const [usuarios,   setUsuarios]   = useState([]);
  const [busqueda,   setBusqueda]   = useState('');
  const [filtroRol,  setFiltroRol]  = useState('todos');
  const [modal,      setModal]      = useState(false);
  const [editando,   setEditando]   = useState(null);
  const [form,       setForm]       = useState(FORM_VACIO);
  const [mensaje,    setMensaje]    = useState({ texto: '', tipo: '' });
  const [guardando,  setGuardando]  = useState(false);
  const [cargando,   setCargando]   = useState(true);
  const [confirmId,  setConfirmId]  = useState(null);

  const cargarUsuarios = () => {
    apiFetch('/usuarios').then(r => r?.json()).then(data => {
      if (Array.isArray(data)) setUsuarios(data);
    }).catch(() => {}).finally(() => setCargando(false));
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const abrirCrear  = () => { setEditando(null); setForm(FORM_VACIO); setMensaje({ texto: '', tipo: '' }); setModal(true); };
  const abrirEditar = (u) => { setEditando(u); setForm({ nombre_completo: u.nombre_completo, correo: u.correo, contraseña: '', rol: u.rol }); setMensaje({ texto: '', tipo: '' }); setModal(true); };
  const cerrar      = () => { setModal(false); setEditando(null); };

  const guardar = async () => {
    if (!form.nombre_completo.trim() || !form.correo.trim())
      return setMensaje({ texto: 'Nombre y correo son obligatorios.', tipo: 'error' });
    if (!editando && (form.contraseña.length < 8 || !/\d/.test(form.contraseña)))
      return setMensaje({ texto: 'La contraseña debe tener mínimo 8 caracteres y un número.', tipo: 'error' });

    setGuardando(true);
    try {
      const body = editando
        ? { nombre_completo: form.nombre_completo, correo: form.correo, rol: form.rol, ...(form.contraseña ? { contraseña: form.contraseña } : {}) }
        : { nombre_completo: form.nombre_completo, correo: form.correo, contraseña: form.contraseña, rol: form.rol };

      const res  = await apiFetch(editando ? `/usuarios/${editando.id}` : '/usuarios', { method: editando ? 'PUT' : 'POST', body: JSON.stringify(body) });
      const data = await res?.json();
      if (res?.ok) { cargarUsuarios(); cerrar(); }
      else setMensaje({ texto: data?.error || 'Error al guardar.', tipo: 'error' });
    } catch {
      setMensaje({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    const res = await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
    if (res?.ok) { setUsuarios(prev => prev.filter(u => u.id !== id)); setConfirmId(null); }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincide = u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || u.correo.toLowerCase().includes(busqueda.toLowerCase());
    return coincide && (filtroRol === 'todos' || u.rol === filtroRol);
  });

  const iniciales = (n = '') => n.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <div style={s.pageTitle}>Gestión de Usuarios</div>
          <div style={s.pageSub}>Administra docentes, apoderados y directivos del establecimiento</div>
        </div>
        <button style={s.btnPri} onClick={abrirCrear}>+ Nuevo Usuario</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 14px', flex: 1, maxWidth: '320px' }}>
          <span style={{ opacity: 0.5 }}>🔍</span>
          <input placeholder="Buscar por nombre o correo..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '13.5px', width: '100%', color: 'var(--color-foreground)', background: 'transparent' }} />
        </div>
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
          style={{ padding: '8px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--color-foreground)', background: 'var(--color-surface)', outline: 'none' }}>
          <option value="todos">Todos los roles</option>
          <option value="director">Director</option>
          <option value="profesor">Profesor</option>
          <option value="apoderado">Apoderado</option>
        </select>
        <span style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.4 }}>{usuariosFiltrados.length} usuarios</span>
      </div>

      {/* Tabla */}
      <div style={s.card}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.4 }}>Cargando usuarios...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr>
                <th style={s.th}>Usuario</th>
                <th style={s.th}>Correo</th>
                <th style={s.th}>Rol</th>
                <th style={s.th}>Curso / Asignaturas</th>
                <th style={s.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(u => {
                const rc = ROL_COLORS[u.rol] || { bg: 'rgba(100,100,100,0.1)', color: '#888' };
                return (
                  <tr key={u.id} style={{ transition: 'background 0.1s' }}>
                    {/* Avatar + nombre */}
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: rc.color, fontSize: '12px', flexShrink: 0 }}>
                          {iniciales(u.nombre_completo)}
                        </div>
                        <strong style={{ fontSize: '13.5px', color: 'var(--color-foreground)' }}>{u.nombre_completo}</strong>
                      </div>
                    </td>

                    {/* Correo */}
                    <td style={{ ...s.td, color: 'var(--color-foreground)', opacity: 0.6, fontSize: '13px' }}>{u.correo}</td>

                    {/* Badge rol */}
                    <td style={s.td}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: rc.bg, color: rc.color, textTransform: 'capitalize' }}>
                        {u.rol}
                      </span>
                    </td>

                    {/* Curso / asignaturas */}
                    <td style={s.td}>
                      {u.rol === 'profesor' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {u.curso_jefatura && (
                            <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: 'rgba(79,70,229,0.1)', color: '#4f46e5' }}>
                              Jefe: {u.curso_jefatura}
                            </span>
                          )}
                          {u.asignaturas_que_imparte && (
                            <span style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.65, lineHeight: 1.4 }}>
                              {u.asignaturas_que_imparte}
                            </span>
                          )}
                          {!u.curso_jefatura && !u.asignaturas_que_imparte && (
                            <span style={{ color: 'var(--color-foreground)', opacity: 0.3, fontSize: '12px' }}>—</span>
                          )}
                        </div>
                      ) : u.rol === 'apoderado' ? (
                        <span style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.6 }}>
                          {u.total_hijos > 0 ? `${u.total_hijos} hijo${u.total_hijos > 1 ? 's' : ''}` : 'Sin hijos vinculados'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-foreground)', opacity: 0.3, fontSize: '12px' }}>—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td style={s.td}>
                      {confirmId === u.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(220,38,38,0.07)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(220,38,38,0.2)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-destructive)', fontWeight: 600 }}>¿Eliminar?</span>
                          <button style={s.btnDanger} onClick={() => eliminar(u.id)}>Sí</button>
                          <button style={s.btnCancel} onClick={() => setConfirmId(null)}>No</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={s.btnSec} onClick={() => abrirEditar(u)}>Editar</button>
                          <button style={s.btnDanger} onClick={() => setConfirmId(u.id)}>Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {usuariosFiltrados.length === 0 && (
                <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', opacity: 0.4, padding: '30px' }}>No se encontraron usuarios</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) cerrar(); }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', border: '1px solid var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                {editando ? 'Editar usuario' : 'Nuevo usuario'}
              </div>
              <button onClick={cerrar} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-foreground)', opacity: 0.5 }}>✕</button>
            </div>

            {mensaje.texto && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
                background: mensaje.tipo === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(21,128,61,0.1)',
                color: mensaje.tipo === 'error' ? 'var(--color-destructive)' : '#15803d',
                border: `1px solid ${mensaje.tipo === 'error' ? 'rgba(220,38,38,0.3)' : 'rgba(21,128,61,0.3)'}`,
              }}>
                {mensaje.texto}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '8px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Nombre completo</label>
                <input style={s.input} placeholder="Ej. Ana Gómez" value={form.nombre_completo} onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Correo electrónico</label>
                <input style={s.input} type="email" placeholder="ana@edusync.com" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>{editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
                <input style={s.input} type="password" placeholder={editando ? 'Dejar vacío para no cambiar' : 'Mín. 8 chars + 1 número'} value={form.contraseña} onChange={e => setForm(p => ({ ...p, contraseña: e.target.value }))} />
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button style={s.btnSec} onClick={cerrar}>Cancelar</button>
              <button style={{ ...s.btnPri, opacity: guardando ? 0.7 : 1 }} onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
