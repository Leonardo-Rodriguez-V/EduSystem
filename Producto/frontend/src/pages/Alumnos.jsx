import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import apiFetch from '../utils/api';
import { UserPlus, Search, Users, X, Pencil, Trash2, ChevronDown } from 'lucide-react';

const s = {
  pageTitle: { fontSize: '30px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, fontFamily: "'Crimson Pro', serif" },
  pageSub:   { fontSize: '14px', color: 'var(--color-foreground)', opacity: 0.5, marginTop: '4px', fontWeight: 600 },
  card:      { background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.06)' },
  th:        { textAlign: 'left', padding: '11px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '.5px', background: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)' },
  td:        { padding: '13px 16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-foreground)', fontSize: '13.5px', verticalAlign: 'middle' },
  input:     { width: '100%', padding: '9px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: 'var(--color-foreground)', background: 'var(--color-muted)', boxSizing: 'border-box' },
  label:     { fontSize: '12px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'block' },
  select:    { width: '100%', padding: '9px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: 'var(--color-foreground)', background: 'var(--color-muted)', boxSizing: 'border-box' },
  btnPri:    { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSec:    { padding: '7px 13px', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: '12px', background: 'transparent', color: 'var(--color-foreground)', fontWeight: 600 },
};

const FORM_VACIO = { nombre_completo: '', rut: '', fecha_nacimiento: '', id_curso: '' };

export default function Alumnos() {
  const [alumnos,     setAlumnos]     = useState([]);
  const [cursos,      setCursos]      = useState([]);
  const [busqueda,    setBusqueda]    = useState('');
  const [filtroCurso, setFiltroCurso] = useState('todos');
  const [modal,       setModal]       = useState(false);
  const [editando,    setEditando]    = useState(null);
  const [form,        setForm]        = useState(FORM_VACIO);
  const [mensaje,     setMensaje]     = useState({ texto: '', tipo: '' });
  const [guardando,   setGuardando]   = useState(false);
  const [cargando,    setCargando]    = useState(true);
  const [confirmId,   setConfirmId]   = useState(null);
  const [pagina,      setPagina]      = useState(1);
  const POR_PAGINA = 50;

  const cargarDatos = () => {
    setCargando(true);
    Promise.all([
      apiFetch('/alumnos').then(r => r?.json()).catch(() => []),
      apiFetch('/cursos').then(r => r?.json()).catch(() => []),
    ]).then(([a, c]) => {
      setAlumnos(Array.isArray(a) ? a : []);
      setCursos(Array.isArray(c) ? c : []);
    }).finally(() => setCargando(false));
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirCrear  = () => { setEditando(null); setForm(FORM_VACIO); setMensaje({ texto: '', tipo: '' }); setModal(true); };
  const abrirEditar = (a) => {
    setEditando(a);
    setForm({
      nombre_completo: a.nombre_completo,
      rut: a.rut || '',
      fecha_nacimiento: a.fecha_nacimiento ? a.fecha_nacimiento.split('T')[0] : '',
      id_curso: a.id_curso || '',
    });
    setMensaje({ texto: '', tipo: '' });
    setModal(true);
  };
  const cerrar = () => { setModal(false); setEditando(null); };

  const guardar = async () => {
    if (!form.nombre_completo.trim()) return setMensaje({ texto: 'El nombre es obligatorio.', tipo: 'error' });
    if (!form.id_curso) return setMensaje({ texto: 'Debes asignar un curso.', tipo: 'error' });
    setGuardando(true);
    try {
      const body = {
        nombre_completo: form.nombre_completo.trim(),
        rut: form.rut.trim() || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        id_curso: Number(form.id_curso),
      };
      const res = editando
        ? await apiFetch(`/alumnos/${editando.id}`, { method: 'PUT',  body: JSON.stringify(body) })
        : await apiFetch('/alumnos',                 { method: 'POST', body: JSON.stringify(body) });
      const data = await res?.json();
      if (res.ok) {
        setMensaje({ texto: editando ? 'Alumno actualizado.' : 'Alumno creado.', tipo: 'exito' });
        cargarDatos();
        setTimeout(cerrar, 1200);
      } else {
        setMensaje({ texto: data?.error || data?.detail || 'Error al guardar.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    try {
      await apiFetch(`/alumnos/${id}`, { method: 'DELETE' });
      setAlumnos(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('Error al eliminar alumno.');
    } finally {
      setConfirmId(null);
    }
  };

  const alumnosFiltrados = alumnos.filter(a => {
    const t = busqueda.toLowerCase();
    const coincideTexto  = a.nombre_completo.toLowerCase().includes(t) || (a.rut || '').toLowerCase().includes(t);
    const coincideCurso  = filtroCurso === 'todos' || String(a.id_curso) === String(filtroCurso);
    return coincideTexto && coincideCurso;
  });
  const totalPaginas   = Math.ceil(alumnosFiltrados.length / POR_PAGINA);
  const paginaActual   = Math.min(pagina, totalPaginas || 1);
  const alumnosPagina  = alumnosFiltrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  const fmtFecha = (f) => f
    ? new Date(f).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '—';

  return (
    <div style={{ padding: '0 0 40px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={s.pageTitle}>Gestión de Alumnos</h1>
          <p style={s.pageSub}>{cargando ? '...' : `${alumnos.length} estudiantes registrados`}</p>
        </div>
        <button style={s.btnPri} onClick={abrirCrear}>
          <UserPlus size={18} /> Nuevo Alumno
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-foreground)', opacity: 0.4, pointerEvents: 'none' }} />
          <input style={{ ...s.input, paddingLeft: '36px' }} placeholder="Buscar por nombre o RUT..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <select style={{ ...s.select, paddingRight: '32px', appearance: 'none' }} value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}>
            <option value="todos">Todos los cursos</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.4, color: 'var(--color-foreground)' }} />
        </div>
      </div>

      {/* Tabla */}
      <div style={s.card}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-foreground)', opacity: 0.4, fontWeight: 600 }}>Cargando alumnos...</p>
          </div>
        ) : alumnosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Users size={40} style={{ opacity: 0.2, color: 'var(--color-foreground)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--color-foreground)', opacity: 0.4, fontWeight: 600 }}>
              {busqueda || filtroCurso !== 'todos' ? 'Sin resultados para la búsqueda.' : 'No hay alumnos registrados.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Nombre Completo</th>
                <th style={s.th}>RUT</th>
                <th style={s.th}>Fecha Nacimiento</th>
                <th style={s.th}>Curso</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnosPagina.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}>
                  <td style={{ ...s.td, opacity: 0.35, fontWeight: 700, fontSize: '12px' }}>{i + 1}</td>
                  <td style={{ ...s.td, fontWeight: 700 }}>{a.nombre_completo}</td>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '13px' }}>{a.rut || <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td style={s.td}>{fmtFecha(a.fecha_nacimiento)}</td>
                  <td style={s.td}>
                    <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                      {a.nombre_curso || `Curso #${a.id_curso}`}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    {confirmId === a.id ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                        <span style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>¿Eliminar?</span>
                        <button onClick={() => eliminar(a.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'var(--color-destructive)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>Sí</button>
                        <button onClick={() => setConfirmId(null)} style={s.btnSec}>No</button>
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', gap: '6px' }}>
                        <button onClick={() => abrirEditar(a)} style={{ ...s.btnSec, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Pencil size={13} /> Editar
                        </button>
                        <button onClick={() => setConfirmId(a.id)} style={{ ...s.btnSec, borderColor: 'var(--color-destructive)', color: 'var(--color-destructive)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={13} />
                        </button>
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.4, fontWeight: 600 }}>
            Página {paginaActual} de {totalPaginas} · {alumnosFiltrados.length} alumnos
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaActual === 1}
              style={{ ...s.btnSec, opacity: paginaActual === 1 ? 0.4 : 1 }}>← Anterior</button>
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}
              style={{ ...s.btnSec, opacity: paginaActual === totalPaginas ? 0.4 : 1 }}>Siguiente →</button>
          </div>
        </div>
      )}
      {!cargando && totalPaginas <= 1 && alumnosFiltrados.length > 0 && (
        <p style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.35, marginTop: '10px', fontWeight: 600 }}>
          {alumnosFiltrados.length} de {alumnos.length} alumnos
        </p>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) cerrar(); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px', border: '1px solid var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-foreground)' }}>
                {editando ? 'Editar Alumno' : 'Nuevo Alumno'}
              </div>
              <button onClick={cerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground)', opacity: 0.5, padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {mensaje.texto && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                background: mensaje.tipo === 'exito' ? 'rgba(21,128,61,0.1)' : 'rgba(220,38,38,0.1)',
                color:      mensaje.tipo === 'exito' ? '#15803d' : 'var(--color-destructive)',
                border:     `1px solid ${mensaje.tipo === 'exito' ? 'rgba(21,128,61,0.3)' : 'rgba(220,38,38,0.3)'}` }}>
                {mensaje.texto}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={s.label}>Nombre Completo *</label>
                <input style={s.input} value={form.nombre_completo} onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))} placeholder="Ej: Juan Pérez González" />
              </div>
              <div>
                <label style={s.label}>RUT</label>
                <input style={s.input} value={form.rut} onChange={e => setForm(p => ({ ...p, rut: e.target.value }))} placeholder="Ej: 12.345.678-9" />
              </div>
              <div>
                <label style={s.label}>Fecha de Nacimiento</label>
                <input style={s.input} type="date" value={form.fecha_nacimiento} onChange={e => setForm(p => ({ ...p, fecha_nacimiento: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Curso *</label>
                <select style={s.select} value={form.id_curso} onChange={e => setForm(p => ({ ...p, id_curso: e.target.value }))}>
                  <option value="">Seleccionar curso...</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.anio})</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={cerrar} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-foreground)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: guardando ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Alumno'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
