import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Plus, Pencil, PowerOff, Power, X, Check,
  Search, Download, Users, GraduationCap, BookOpen,
  ChevronRight, UserPlus, Calendar, Mail, Phone, MapPin,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const PLAN_COLORS = {
  basico:      { bg: 'rgba(99,102,241,0.12)',  color: '#a5b4fc', label: 'Básico' },
  profesional: { bg: 'rgba(139,92,246,0.12)',  color: '#c4b5fd', label: 'Profesional' },
  enterprise:  { bg: 'rgba(236,72,153,0.12)',  color: '#f9a8d4', label: 'Enterprise' },
};

const ROL_LABEL = { director: 'Director', profesor: 'Profesor', apoderado: 'Apoderado', alumno: 'Alumno' };
const ROL_COLOR = {
  director:  { bg: 'rgba(99,102,241,0.15)',  color: '#a5b4fc' },
  profesor:  { bg: 'rgba(16,185,129,0.15)',  color: '#34d399' },
  apoderado: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
  alumno:    { bg: 'rgba(14,165,233,0.15)',  color: '#38bdf8' },
};

const VACIO = { nombre: '', rut: '', direccion: '', telefono: '', email: '', plan: 'basico', plan_expira: '' };
const VACIO_DIR = { nombre: '', correo: '', contraseña: '' };

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(165,180,252,0.2)', borderRadius: 10,
  padding: '10px 14px', color: 'var(--color-foreground)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--color-foreground)', opacity: 0.5, marginBottom: 6,
};

function Campo({ label, valor, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={valor} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

export default function SuperAdminPanel() {
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const [colegios, setColegios]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroPlan, setFiltroPlan]     = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(VACIO);
  const [formDir, setFormDir]           = useState(VACIO_DIR);
  const [conDirector, setConDirector]   = useState(false);
  const [detalle, setDetalle]           = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [guardando, setGuardando]       = useState(false);
  const [error, setError]               = useState('');
  const [errorCarga, setErrorCarga]     = useState('');

  const cargar = async () => {
    setErrorCarga('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${API}/colegios`, { headers, signal: controller.signal });
      if (res.ok) {
        setColegios(await res.json());
      } else {
        const d = await res.json().catch(() => ({}));
        setErrorCarga(d.error || `Error ${res.status} al cargar colegios`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorCarga('El servidor tardó demasiado en responder. Intenta de nuevo.');
      } else {
        setErrorCarga('No se pudo conectar con el servidor. Intenta recargar la página.');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => colegios.filter(c => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || c.nombre.toLowerCase().includes(q)
      || (c.rut || '').toLowerCase().includes(q)
      || (c.email || '').toLowerCase().includes(q)
      || (c.nombre_director || '').toLowerCase().includes(q);
    const matchPlan   = filtroPlan === 'todos'   || c.plan === filtroPlan;
    const matchEstado = filtroEstado === 'todos' || (filtroEstado === 'activo' ? c.activo : !c.activo);
    return matchQ && matchPlan && matchEstado;
  }), [colegios, busqueda, filtroPlan, filtroEstado]);

  const stats = useMemo(() => ({
    total:    colegios.length,
    activos:  colegios.filter(c => c.activo).length,
    inactivos: colegios.filter(c => !c.activo).length,
    usuarios: colegios.reduce((s, c) => s + Number(c.total_usuarios || 0), 0),
    alumnos:  colegios.reduce((s, c) => s + Number(c.total_alumnos  || 0), 0),
    cursos:   colegios.reduce((s, c) => s + Number(c.total_cursos   || 0), 0),
  }), [colegios]);

  const abrirCrear = () => {
    setForm(VACIO); setFormDir(VACIO_DIR); setConDirector(false); setError('');
    setModal({ modo: 'crear' });
  };

  const abrirEditar = (c, e) => {
    e.stopPropagation();
    setForm({
      nombre: c.nombre, rut: c.rut || '', direccion: c.direccion || '',
      telefono: c.telefono || '', email: c.email || '', plan: c.plan,
      plan_expira: c.plan_expira ? c.plan_expira.split('T')[0] : '',
    });
    setError('');
    setModal({ modo: 'editar', id: c.id });
  };

  const abrirDetalle = async (c) => {
    setDetalle({ colegio: c, usuarios: null, cursos: null });
    setLoadingDetalle(true);
    try {
      const res = await fetch(`${API}/colegios/${c.id}`, { headers });
      if (res.ok) setDetalle(await res.json());
    } finally { setLoadingDetalle(false); }
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true); setError('');
    try {
      const url = modal.modo === 'crear' ? `${API}/colegios` : `${API}/colegios/${modal.id}`;
      const body = { ...form };
      if (modal.modo === 'crear' && conDirector) body.director = formDir;
      const res = await fetch(url, { method: modal.modo === 'crear' ? 'POST' : 'PUT', headers, body: JSON.stringify(body) });
      if (res.ok) { setModal(null); cargar(); }
      else { const d = await res.json(); setError(d.error || 'Error al guardar'); }
    } finally { setGuardando(false); }
  };

  const toggleActivo = async (c, e) => {
    e.stopPropagation();
    await fetch(`${API}/colegios/${c.id}`, { method: 'PUT', headers, body: JSON.stringify({ activo: !c.activo }) });
    cargar();
  };

  const exportarCSV = () => {
    const cabeceras = ['Nombre','RUT','Plan','Email','Teléfono','Director','Usuarios','Alumnos','Cursos','Estado','Creado en'];
    const filas = colegios.map(c => [
      c.nombre, c.rut || '', c.plan, c.email || '', c.telefono || '',
      c.nombre_director || '', c.total_usuarios || 0, c.total_alumnos || 0, c.total_cursos || 0,
      c.activo ? 'Activo' : 'Inactivo',
      new Date(c.creado_en).toLocaleDateString('es-CL'),
    ]);
    const csv = [cabeceras, ...filas].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('﻿' + csv);
    a.download = `colegios_edusync_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(165,180,252,0.15)', borderRadius: 20, padding: '24px 28px' };
  const selectStyle = { ...inputStyle, background: 'var(--color-surface)' };

  return (
    <div style={{ maxWidth: 1200, margin: '32px auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: "'Crimson Pro', serif", color: 'var(--color-foreground)' }}>
            Panel Superadmin
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-foreground)', opacity: 0.5, fontSize: 14 }}>
            Gestión de colegios registrados en EduSync
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportarCSV} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(165,180,252,0.25)', borderRadius: 11, color: '#a5b4fc', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <Download size={14} /> Exportar CSV
          </button>
          <button onClick={abrirCrear} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 11, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}>
            <Plus size={15} /> Nuevo Colegio
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
        {[
          { label: 'Total colegios', valor: stats.total,    icon: Building2, color: '#a5b4fc' },
          { label: 'Activos',        valor: stats.activos,  icon: Power,     color: '#34d399' },
          { label: 'Inactivos',      valor: stats.inactivos,icon: PowerOff,  color: '#f87171' },
          { label: 'Usuarios',       valor: stats.usuarios, icon: Users,     color: '#c4b5fd' },
          { label: 'Alumnos',        valor: stats.alumnos,  icon: GraduationCap, color: '#38bdf8' },
          { label: 'Cursos',         valor: stats.cursos,   icon: BookOpen,  color: '#fbbf24' },
        ].map(({ label, valor, icon: Icon, color }) => (
          <div key={label} style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{valor}</div>
              <div style={{ fontSize: 11, color: 'var(--color-foreground)', opacity: 0.5, marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(165,180,252,0.5)', pointerEvents: 'none' }} />
          <input
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, RUT, email o director..."
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
        <select value={filtroPlan} onChange={e => setFiltroPlan(e.target.value)} style={{ ...selectStyle, width: 160 }}>
          <option value="todos">Todos los planes</option>
          <option value="basico">Básico</option>
          <option value="profesional">Profesional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ ...selectStyle, width: 140 }}>
          <option value="todos">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* ── Tabla ── */}
      <div style={card}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-foreground)', opacity: 0.4, padding: '32px 0' }}>Cargando...</p>
        ) : errorCarga ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: '#f87171', fontSize: 14, marginBottom: 16 }}>{errorCarga}</p>
            <button onClick={cargar} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(165,180,252,0.3)', borderRadius: 10, padding: '9px 20px', color: '#a5b4fc', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Reintentar
            </button>
          </div>
        ) : filtrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-foreground)', opacity: 0.4, padding: '32px 0' }}>
            {busqueda || filtroPlan !== 'todos' || filtroEstado !== 'todos' ? 'Sin resultados para este filtro.' : 'No hay colegios registrados.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Colegio','Director','Plan','Usuarios','Alumnos','Cursos','Estado',''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--color-foreground)', opacity: 0.45, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(165,180,252,0.1)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => {
                  const plan = PLAN_COLORS[c.plan] || PLAN_COLORS.basico;
                  return (
                    <tr key={c.id} onClick={() => abrirDetalle(c)}
                      style={{ borderBottom: '1px solid rgba(165,180,252,0.07)', opacity: c.activo ? 1 : 0.5, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={15} color="#a5b4fc" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-foreground)' }}>{c.nombre}</div>
                            {c.rut && <div style={{ fontSize: 11, color: 'var(--color-foreground)', opacity: 0.4 }}>{c.rut}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        {c.nombre_director
                          ? <div><div style={{ fontWeight: 600, color: 'var(--color-foreground)', fontSize: 13 }}>{c.nombre_director}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-foreground)', opacity: 0.4 }}>{c.correo_director}</div></div>
                          : <span style={{ color: 'var(--color-foreground)', opacity: 0.3, fontSize: 12 }}>Sin director</span>}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ background: plan.bg, color: plan.color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{plan.label}</span>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 600, color: 'var(--color-foreground)' }}>{c.total_usuarios || 0}</td>
                      <td style={{ padding: '14px', fontWeight: 600, color: 'var(--color-foreground)' }}>{c.total_alumnos || 0}</td>
                      <td style={{ padding: '14px', fontWeight: 600, color: 'var(--color-foreground)' }}>{c.total_cursos || 0}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ background: c.activo ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: c.activo ? '#34d399' : '#f87171', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button onClick={e => abrirEditar(c, e)} title="Editar" style={{ background: 'rgba(99,102,241,0.12)', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', color: '#a5b4fc', display: 'flex' }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={e => toggleActivo(c, e)} title={c.activo ? 'Desactivar' : 'Activar'} style={{ background: c.activo ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', color: c.activo ? '#f87171' : '#34d399', display: 'flex' }}>
                            {c.activo ? <PowerOff size={13} /> : <Power size={13} />}
                          </button>
                          <button onClick={() => abrirDetalle(c)} title="Ver detalle" style={{ background: 'rgba(165,180,252,0.08)', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', color: 'rgba(165,180,252,0.6)', display: 'flex' }}>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal crear/editar ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid rgba(165,180,252,0.2)', borderRadius: 24, padding: 36, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-foreground)' }}>
                {modal.modo === 'crear' ? 'Nuevo Colegio' : 'Editar Colegio'}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground)', opacity: 0.5 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Campo label="Nombre *"    valor={form.nombre}    onChange={v => setForm(f => ({...f, nombre: v}))}    placeholder="Colegio San Andrés" />
              <Campo label="RUT"         valor={form.rut}       onChange={v => setForm(f => ({...f, rut: v}))}       placeholder="12.345.678-9" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Campo label="Teléfono"  valor={form.telefono}  onChange={v => setForm(f => ({...f, telefono: v}))}  placeholder="+56 2 2345 6789" />
                <Campo label="Email"     valor={form.email}     onChange={v => setForm(f => ({...f, email: v}))}     placeholder="dir@colegio.cl" />
              </div>
              <Campo label="Dirección"   valor={form.direccion} onChange={v => setForm(f => ({...f, direccion: v}))} placeholder="Av. Principal 123, Santiago" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Plan</label>
                  <select value={form.plan} onChange={e => setForm(f => ({...f, plan: e.target.value}))} style={selectStyle}>
                    <option value="basico">Básico</option>
                    <option value="profesional">Profesional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <Campo label="Vencimiento plan" type="date" valor={form.plan_expira} onChange={v => setForm(f => ({...f, plan_expira: v}))} placeholder="" />
              </div>

              {/* Sección director (solo al crear) */}
              {modal.modo === 'crear' && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => setConDirector(d => !d)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: conDirector ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${conDirector ? 'rgba(165,180,252,0.4)' : 'rgba(165,180,252,0.15)'}`, borderRadius: 10, padding: '9px 16px', color: conDirector ? '#a5b4fc' : 'var(--color-foreground)', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <UserPlus size={15} />
                    {conDirector ? 'Quitar director inicial' : 'Crear director inicial'}
                  </button>
                  {conDirector && (
                    <div style={{ marginTop: 14, padding: '18px', background: 'rgba(99,102,241,0.06)', borderRadius: 12, border: '1px solid rgba(165,180,252,0.15)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Campo label="Nombre director *" valor={formDir.nombre}    onChange={v => setFormDir(d => ({...d, nombre: v}))}    placeholder="Ana Martínez" />
                      <Campo label="Correo director *"  valor={formDir.correo}    onChange={v => setFormDir(d => ({...d, correo: v}))}    placeholder="director@colegio.cl" type="email" />
                      <Campo label="Contraseña *"        valor={formDir.contraseña} onChange={v => setFormDir(d => ({...d, contraseña: v}))} placeholder="Mínimo 8 caracteres y un número" type="password" />
                    </div>
                  )}
                </div>
              )}

              {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0, background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(165,180,252,0.2)', background: 'transparent', color: 'var(--color-foreground)', fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando || !form.nombre.trim()} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: guardando ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 700, cursor: guardando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Check size={15} /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer detalle ── */}
      {detalle && (
        <>
          <div onClick={() => setDetalle(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 150 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '95vw', background: 'var(--color-surface)', borderLeft: '1px solid rgba(165,180,252,0.15)', zIndex: 160, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Cabecera drawer */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={22} color="#a5b4fc" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--color-foreground)' }}>{detalle.colegio?.nombre}</h2>
                  {(() => { const p = PLAN_COLORS[detalle.colegio?.plan] || PLAN_COLORS.basico; return (
                    <span style={{ background: p.bg, color: p.color, padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{p.label}</span>
                  ); })()}
                </div>
              </div>
              <button onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground)', opacity: 0.4, flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>

            {loadingDetalle ? (
              <p style={{ textAlign: 'center', color: 'var(--color-foreground)', opacity: 0.4 }}>Cargando detalle...</p>
            ) : (
              <>
                {/* Info colegio */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(165,180,252,0.1)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: Building2, label: 'RUT',        val: detalle.colegio?.rut },
                    { icon: Mail,      label: 'Email',      val: detalle.colegio?.email },
                    { icon: Phone,     label: 'Teléfono',   val: detalle.colegio?.telefono },
                    { icon: MapPin,    label: 'Dirección',  val: detalle.colegio?.direccion },
                    { icon: Calendar,  label: 'Plan expira',val: detalle.colegio?.plan_expira ? new Date(detalle.colegio.plan_expira).toLocaleDateString('es-CL') : null },
                  ].filter(i => i.val).map(({ icon: Icon, label, val }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={13} color="rgba(165,180,252,0.5)" style={{ flexShrink: 0 }} />
                      <span style={{ color: 'var(--color-foreground)', opacity: 0.45, fontSize: 12, minWidth: 80 }}>{label}</span>
                      <span style={{ color: 'var(--color-foreground)', fontSize: 13, fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Métricas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Usuarios',  val: detalle.usuarios?.length || 0,                          color: '#c4b5fd' },
                    { label: 'Alumnos',   val: detalle.cursos?.reduce((s, c) => s + Number(c.total_alumnos || 0), 0) || 0, color: '#38bdf8' },
                    { label: 'Cursos',    val: detalle.cursos?.length || 0,                            color: '#fbbf24' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(165,180,252,0.1)', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-foreground)', opacity: 0.45, marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Usuarios por rol */}
                {detalle.usuarios?.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-foreground)', opacity: 0.45 }}>Usuarios</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detalle.usuarios.map(u => {
                        const r = ROL_COLOR[u.rol] || { bg: 'rgba(165,180,252,0.1)', color: '#a5b4fc' };
                        return (
                          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(165,180,252,0.07)' }}>
                            <span style={{ background: r.bg, color: r.color, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                              {ROL_LABEL[u.rol] || u.rol}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nombre_completo}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-foreground)', opacity: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.correo}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cursos */}
                {detalle.cursos?.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-foreground)', opacity: 0.45 }}>Cursos</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detalle.cursos.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(165,180,252,0.07)' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)' }}>{c.nombre}</div>
                          <span style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                            {c.total_alumnos} alumnos
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
