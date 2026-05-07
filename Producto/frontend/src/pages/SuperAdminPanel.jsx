import { useState, useEffect, useCallback, useMemo } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const planLabels = {
  basico: { label: 'Básico', color: '#6366f1' },
  profesional: { label: 'Profesional', color: '#8b5cf6' },
  enterprise: { label: 'Enterprise', color: '#d946ef' },
};

export default function SuperAdminPanel() {
  const [colegios, setColegios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | 'crear' | 'editar'
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState({ nombre: '', rut: '', direccion: '', telefono: '', email: '', plan: 'basico' });

  const token = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('usuario'))?.token; } catch { return null; }
  }, []);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const cargarColegios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/colegios`, { headers });
      if (!res.ok) throw new Error('Error al cargar colegios');
      setColegios(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { cargarColegios(); }, [cargarColegios]);

  const abrirCrear = () => {
    setForm({ nombre: '', rut: '', direccion: '', telefono: '', email: '', plan: 'basico' });
    setSeleccionado(null);
    setModal('crear');
  };

  const abrirEditar = (colegio) => {
    setForm({ nombre: colegio.nombre, rut: colegio.rut || '', direccion: colegio.direccion || '', telefono: colegio.telefono || '', email: colegio.email || '', plan: colegio.plan });
    setSeleccionado(colegio);
    setModal('editar');
  };

  const guardar = async () => {
    const url = modal === 'crear' ? `${API}/api/colegios` : `${API}/api/colegios/${seleccionado.id}`;
    const method = modal === 'crear' ? 'POST' : 'PUT';
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify({ ...form, activo: true }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setModal(null);
      cargarColegios();
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };

  const desactivar = async (id, nombre) => {
    if (!confirm(`¿Desactivar el colegio "${nombre}"? Sus usuarios no podrán acceder.`)) return;
    try {
      await fetch(`${API}/api/colegios/${id}`, { method: 'DELETE', headers });
      cargarColegios();
    } catch {
      alert('Error al desactivar colegio');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Panel SuperAdmin</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>Gestión de colegios del sistema</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">+ Nuevo Colegio</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total colegios', value: colegios.length },
          { label: 'Activos', value: colegios.filter(c => c.activo).length },
          { label: 'Enterprise', value: colegios.filter(c => c.plan === 'enterprise').length },
          { label: 'Total usuarios', value: colegios.reduce((s, c) => s + Number(c.total_usuarios || 0), 0) },
        ].map(({ label, value }) => (
          <div key={label} className="glass" style={{ padding: '20px 24px' }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Cargando colegios...</p>
      ) : error ? (
        <p style={{ color: '#f87171', textAlign: 'center' }}>{error}</p>
      ) : (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Colegio', 'RUT', 'Plan', 'Usuarios', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colegios.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{c.nombre}</td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)' }}>{c.rut || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: planLabels[c.plan]?.color + '33', color: planLabels[c.plan]?.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {planLabels[c.plan]?.label || c.plan}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)' }}>{c.total_usuarios}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: c.activo ? '#4ade80' : '#f87171', fontWeight: 600, fontSize: 12 }}>
                      {c.activo ? '● Activo' : '● Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => abrirEditar(c)} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>Editar</button>
                      {c.activo && (
                        <button onClick={() => desactivar(c.id, c.nombre)} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(248,113,113,0.4)', background: 'transparent', color: '#f87171', cursor: 'pointer' }}>
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass" style={{ padding: 32, width: '100%', maxWidth: 480, borderRadius: 20 }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>{modal === 'crear' ? 'Nuevo Colegio' : 'Editar Colegio'}</h2>
            {[
              { key: 'nombre', label: 'Nombre *', type: 'text' },
              { key: 'rut', label: 'RUT', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'telefono', label: 'Teléfono', type: 'text' },
              { key: 'direccion', label: 'Dirección', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Plan</label>
              <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14 }}>
                <option value="basico">Básico</option>
                <option value="profesional">Profesional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn-ghost">Cancelar</button>
              <button onClick={guardar} className="btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
