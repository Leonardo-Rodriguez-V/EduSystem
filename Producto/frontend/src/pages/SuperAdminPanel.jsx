import { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, PowerOff, Power, X, Check } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const PLAN_COLORS = {
  basico:       { bg: 'rgba(99,102,241,0.12)',  color: '#a5b4fc', label: 'Básico' },
  profesional:  { bg: 'rgba(139,92,246,0.12)',  color: '#c4b5fd', label: 'Profesional' },
  enterprise:   { bg: 'rgba(236,72,153,0.12)',  color: '#f9a8d4', label: 'Enterprise' },
};

const VACIO = { nombre: '', rut: '', direccion: '', telefono: '', email: '', plan: 'basico' };

export default function SuperAdminPanel() {
  const token = localStorage.getItem('token');
  const [colegios, setColegios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | { modo: 'crear'|'editar', datos }
  const [form, setForm]         = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const cargar = async () => {
    try {
      const res = await fetch(`${API}/colegios`, { headers });
      if (res.ok) setColegios(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => { setForm(VACIO); setModal({ modo: 'crear' }); };
  const abrirEditar = (c) => {
    setForm({ nombre: c.nombre, rut: c.rut || '', direccion: c.direccion || '', telefono: c.telefono || '', email: c.email || '', plan: c.plan });
    setModal({ modo: 'editar', id: c.id });
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    try {
      const url = modal.modo === 'crear' ? `${API}/colegios` : `${API}/colegios/${modal.id}`;
      const method = modal.modo === 'crear' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (res.ok) { setModal(null); cargar(); }
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (c) => {
    const res = await fetch(`${API}/colegios/${c.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ activo: !c.activo }),
    });
    if (res.ok) cargar();
  };

  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(165,180,252,0.15)', borderRadius: 20, padding: '24px 28px' };

  return (
    <div style={{ maxWidth: 1100, margin: '32px auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: "'Crimson Pro', serif", color: 'var(--color-foreground)' }}>
            Panel Superadmin
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-foreground)', opacity: 0.5, fontSize: 14 }}>
            Gestión de colegios registrados en EduSync
          </p>
        </div>
        <button onClick={abrirCrear} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
          borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
        }}>
          <Plus size={16} /> Nuevo Colegio
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total colegios', valor: colegios.length },
          { label: 'Activos', valor: colegios.filter(c => c.activo).length },
          { label: 'Inactivos', valor: colegios.filter(c => !c.activo).length },
          { label: 'Total usuarios', valor: colegios.reduce((s, c) => s + Number(c.total_usuarios || 0), 0) },
        ].map(({ label, valor }) => (
          <div key={label} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#a5b4fc' }}>{valor}</div>
            <div style={{ fontSize: 12, color: 'var(--color-foreground)', opacity: 0.5, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={card}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-foreground)', opacity: 0.4 }}>Cargando...</p>
        ) : colegios.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-foreground)', opacity: 0.4 }}>No hay colegios registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Colegio', 'RUT', 'Plan', 'Usuarios', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--color-foreground)', opacity: 0.45, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(165,180,252,0.1)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colegios.map(c => {
                  const plan = PLAN_COLORS[c.plan] || PLAN_COLORS.basico;
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(165,180,252,0.07)', opacity: c.activo ? 1 : 0.5 }}>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={16} color="#a5b4fc" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-foreground)' }}>{c.nombre}</div>
                            {c.email && <div style={{ fontSize: 12, color: 'var(--color-foreground)', opacity: 0.4 }}>{c.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px', color: 'var(--color-foreground)', opacity: 0.6 }}>{c.rut || '—'}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ background: plan.bg, color: plan.color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          {plan.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: 'var(--color-foreground)', fontWeight: 600 }}>{c.total_usuarios || 0}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          background: c.activo ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: c.activo ? '#34d399' : '#f87171',
                          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        }}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => abrirEditar(c)} title="Editar" style={{ background: 'rgba(99,102,241,0.12)', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', color: '#a5b4fc', display: 'flex' }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => toggleActivo(c)} title={c.activo ? 'Desactivar' : 'Activar'} style={{ background: c.activo ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', color: c.activo ? '#f87171' : '#34d399', display: 'flex' }}>
                            {c.activo ? <PowerOff size={14} /> : <Power size={14} />}
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

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid rgba(165,180,252,0.2)', borderRadius: 24, padding: 36, width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-foreground)' }}>
                {modal.modo === 'crear' ? 'Nuevo Colegio' : 'Editar Colegio'}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground)', opacity: 0.5 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Nombre *', key: 'nombre', placeholder: 'Colegio San Andrés' },
                { label: 'RUT', key: 'rut', placeholder: '12.345.678-9' },
                { label: 'Dirección', key: 'direccion', placeholder: 'Av. Principal 123' },
                { label: 'Teléfono', key: 'telefono', placeholder: '+56 2 2345 6789' },
                { label: 'Email', key: 'email', placeholder: 'contacto@colegio.cl' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-foreground)', opacity: 0.5, marginBottom: 6 }}>{label}</label>
                  <input
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(165,180,252,0.2)', borderRadius: 10, padding: '10px 14px', color: 'var(--color-foreground)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-foreground)', opacity: 0.5, marginBottom: 6 }}>Plan</label>
                <select
                  value={form.plan}
                  onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                  style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid rgba(165,180,252,0.2)', borderRadius: 10, padding: '10px 14px', color: 'var(--color-foreground)', fontSize: 14, outline: 'none' }}
                >
                  <option value="basico">Básico</option>
                  <option value="profesional">Profesional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(165,180,252,0.2)', background: 'transparent', color: 'var(--color-foreground)', fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando || !form.nombre.trim()} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Check size={15} /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
