import { useState } from 'react';
import apiFetch from '../utils/api';

const s = {
  input:  { width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '14px', outline: 'none', color: 'var(--color-foreground)', background: 'var(--color-muted)', boxSizing: 'border-box' },
  label:  { fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.7, marginBottom: '6px', display: 'block' },
  select: { width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '14px', outline: 'none', color: 'var(--color-foreground)', background: 'var(--color-muted)', boxSizing: 'border-box' },
};

function Registro() {
  const [form,    setForm]    = useState({ nombre_completo: '', correo: '', contraseña: '', rol: 'profesor' });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [enviando, setEnviando] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });
    if (form.contraseña.length < 8 || !/\d/.test(form.contraseña)) {
      setMensaje({ texto: 'La contraseña debe tener al menos 8 caracteres y un número.', tipo: 'error' });
      return;
    }
    setEnviando(true);
    try {
      const res   = await apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(form) });
      const datos = await res.json();
      if (res.status === 201) {
        setMensaje({ texto: 'Usuario registrado con éxito.', tipo: 'exito' });
        setForm({ nombre_completo: '', correo: '', contraseña: '', rol: 'profesor' });
      } else {
        setMensaje({ texto: datos.detail || datos.error || 'No se pudo registrar el usuario.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '480px', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '6px' }}>Registro de Usuario</div>
          <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.5 }}>Completa los datos para dar de alta en EduSync</div>
        </div>

        {mensaje.texto && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: mensaje.tipo === 'exito' ? 'rgba(21,128,61,0.1)' : 'rgba(220,38,38,0.1)',
            color:      mensaje.tipo === 'exito' ? '#15803d' : 'var(--color-destructive)',
            border:     `1px solid ${mensaje.tipo === 'exito' ? 'rgba(21,128,61,0.3)' : 'rgba(220,38,38,0.3)'}`,
          }}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={s.label}>Nombre Completo</label>
            <input style={s.input} type="text" name="nombre_completo" value={form.nombre_completo} onChange={handleChange} required placeholder="Ej: Ana Gómez" />
          </div>
          <div>
            <label style={s.label}>Correo Electrónico</label>
            <input style={s.input} type="email" name="correo" value={form.correo} onChange={handleChange} required placeholder="ana@edusync.com" />
          </div>
          <div>
            <label style={s.label}>Contraseña</label>
            <input style={s.input} type="password" name="contraseña" value={form.contraseña} onChange={handleChange} required placeholder="Mínimo 8 caracteres y un número" />
          </div>
          <div>
            <label style={s.label}>Rol en el Sistema</label>
            <select style={s.select} name="rol" value={form.rol} onChange={handleChange}>
              <option value="director">Director</option>
              <option value="profesor">Profesor</option>
              <option value="apoderado">Apoderado</option>
            </select>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.4 }}>
              Selección de roles institucionales autorizados.
            </div>
          </div>

          <button type="submit" disabled={enviando} style={{
            marginTop: '8px', padding: '12px', borderRadius: '10px', border: 'none',
            background: 'var(--color-primary)', color: '#fff', fontSize: '14px', fontWeight: 700,
            cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)', transition: 'all 0.2s',
          }}>
            {enviando ? 'Registrando...' : 'Registrar Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Registro;
