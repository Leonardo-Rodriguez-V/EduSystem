import { useState } from 'react';
import { motion } from 'framer-motion';
import apiFetch from '../utils/api';
import { User, Mail, Lock, Save, CheckCircle, Shield } from 'lucide-react';

const ROL_LABEL = { director: 'Director', profesor: 'Profesor', apoderado: 'Apoderado', alumno: 'Alumno' };
const ROL_COLOR = {
  director:  { bg: 'rgba(79,70,229,0.12)',  color: '#4f46e5' },
  profesor:  { bg: 'rgba(21,128,61,0.12)',  color: '#15803d' },
  apoderado: { bg: 'rgba(234,88,12,0.12)',  color: '#ea580c' },
  alumno:    { bg: 'rgba(14,165,233,0.12)', color: '#0ea5e9' },
};

const s = {
  input: { width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '14px', outline: 'none', color: 'var(--color-foreground)', background: 'var(--color-muted)', boxSizing: 'border-box' },
  label: { fontSize: '12px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px', display: 'block' },
};

function Alerta({ msg, tipo }) {
  if (!msg) return null;
  const ok = tipo === 'exito';
  return (
    <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '16px',
      background: ok ? 'rgba(21,128,61,0.1)' : 'rgba(220,38,38,0.1)',
      color:      ok ? '#15803d' : 'var(--color-destructive)',
      border:     `1px solid ${ok ? 'rgba(21,128,61,0.3)' : 'rgba(220,38,38,0.3)'}`,
      display: 'flex', alignItems: 'center', gap: '8px' }}>
      {ok && <CheckCircle size={14} />}
      {msg}
    </div>
  );
}

export default function Perfil() {
  const usuario = (() => {
    try { return JSON.parse(localStorage.getItem('usuario')); }
    catch { return {}; }
  })();

  const iniciales = (n = '') => n.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const rol = usuario?.rol || 'alumno';
  const rolColor = ROL_COLOR[rol] || ROL_COLOR.alumno;

  // Datos personales
  const [datosForm,    setDatosForm]    = useState({ nombre_completo: usuario?.nombre_completo || '', correo: usuario?.correo || '' });
  const [msgDatos,     setMsgDatos]     = useState({ texto: '', tipo: '' });
  const [guardandoD,   setGuardandoD]   = useState(false);

  // Contraseña
  const [passForm,     setPassForm]     = useState({ nueva: '', confirmar: '' });
  const [msgPass,      setMsgPass]      = useState({ texto: '', tipo: '' });
  const [guardandoP,   setGuardandoP]   = useState(false);

  const guardarDatos = async () => {
    if (!datosForm.nombre_completo.trim() || !datosForm.correo.trim())
      return setMsgDatos({ texto: 'Nombre y correo son obligatorios.', tipo: 'error' });
    setGuardandoD(true);
    try {
      const res  = await apiFetch(`/usuarios/${usuario.id}`, { method: 'PUT', body: JSON.stringify({ nombre_completo: datosForm.nombre_completo.trim(), correo: datosForm.correo.trim(), rol }) });
      const data = await res?.json();
      if (res?.ok) {
        const actualizado = { ...usuario, nombre_completo: datosForm.nombre_completo.trim(), correo: datosForm.correo.trim() };
        localStorage.setItem('usuario', JSON.stringify(actualizado));
        setMsgDatos({ texto: 'Datos actualizados correctamente.', tipo: 'exito' });
        setTimeout(() => setMsgDatos({ texto: '', tipo: '' }), 3000);
      } else {
        setMsgDatos({ texto: data?.error || 'Error al guardar.', tipo: 'error' });
      }
    } catch {
      setMsgDatos({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setGuardandoD(false);
    }
  };

  const guardarPassword = async () => {
    if (passForm.nueva.length < 8 || !/\d/.test(passForm.nueva))
      return setMsgPass({ texto: 'La contraseña debe tener mínimo 8 caracteres y un número.', tipo: 'error' });
    if (passForm.nueva !== passForm.confirmar)
      return setMsgPass({ texto: 'Las contraseñas no coinciden.', tipo: 'error' });
    setGuardandoP(true);
    try {
      const res  = await apiFetch(`/usuarios/${usuario.id}`, { method: 'PUT', body: JSON.stringify({ nombre_completo: usuario.nombre_completo, correo: usuario.correo, rol, contraseña: passForm.nueva }) });
      const data = await res?.json();
      if (res?.ok) {
        setMsgPass({ texto: 'Contraseña actualizada correctamente.', tipo: 'exito' });
        setPassForm({ nueva: '', confirmar: '' });
        setTimeout(() => setMsgPass({ texto: '', tipo: '' }), 3000);
      } else {
        setMsgPass({ texto: data?.error || 'Error al cambiar contraseña.', tipo: 'error' });
      }
    } catch {
      setMsgPass({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setGuardandoP(false);
    }
  };

  return (
    <div style={{ padding: '0 0 60px', maxWidth: '760px', margin: '0 auto' }}>

      {/* Header con avatar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '24px',
          background: 'linear-gradient(135deg, var(--color-primary), #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: 900, color: '#fff',
          boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          flexShrink: 0,
        }}>
          {iniciales(usuario?.nombre_completo)}
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-foreground)', margin: '0 0 6px', fontFamily: "'Crimson Pro', serif" }}>
            {usuario?.nombre_completo}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-flex', padding: '4px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, background: rolColor.bg, color: rolColor.color }}>
              {ROL_LABEL[rol] || rol}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.45, fontWeight: 600 }}>{usuario?.correo}</span>
          </div>
        </div>
      </motion.div>

      {/* Sección datos personales */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '28px', border: '1px solid var(--color-border)', boxShadow: 'var(--clay-shadow)', marginBottom: '24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: '10px', padding: '8px', color: 'var(--color-primary)' }}>
            <User size={18} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-foreground)' }}>Datos Personales</div>
            <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.45, fontWeight: 600 }}>Actualiza tu nombre y correo electrónico</div>
          </div>
        </div>

        <Alerta msg={msgDatos.texto} tipo={msgDatos.tipo} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={s.label}>Nombre Completo</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, color: 'var(--color-foreground)', pointerEvents: 'none' }} />
              <input style={{ ...s.input, paddingLeft: '36px' }} value={datosForm.nombre_completo} onChange={e => setDatosForm(p => ({ ...p, nombre_completo: e.target.value }))} placeholder="Tu nombre completo" />
            </div>
          </div>
          <div>
            <label style={s.label}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, color: 'var(--color-foreground)', pointerEvents: 'none' }} />
              <input style={{ ...s.input, paddingLeft: '36px' }} type="email" value={datosForm.correo} onChange={e => setDatosForm(p => ({ ...p, correo: e.target.value }))} placeholder="tu@correo.com" />
            </div>
          </div>
          <div>
            <label style={s.label}>Rol en el Sistema</label>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={15} style={{ opacity: 0.4, color: 'var(--color-foreground)' }} />
              <span style={{ fontSize: '14px', color: 'var(--color-foreground)', opacity: 0.6, fontWeight: 600 }}>{ROL_LABEL[rol] || rol}</span>
              <span style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.35, marginLeft: 'auto' }}>No editable</span>
            </div>
          </div>
        </div>

        <button onClick={guardarDatos} disabled={guardandoD}
          style={{ marginTop: '20px', padding: '11px 24px', borderRadius: '10px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: guardandoD ? 'not-allowed' : 'pointer', opacity: guardandoD ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={15} />
          {guardandoD ? 'Guardando...' : 'Guardar Datos'}
        </button>
      </motion.div>

      {/* Sección cambiar contraseña */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '28px', border: '1px solid var(--color-border)', boxShadow: 'var(--clay-shadow)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(239,68,68,0.12)', borderRadius: '10px', padding: '8px', color: '#ef4444' }}>
            <Lock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-foreground)' }}>Cambiar Contraseña</div>
            <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.45, fontWeight: 600 }}>Mínimo 8 caracteres y un número</div>
          </div>
        </div>

        <Alerta msg={msgPass.texto} tipo={msgPass.tipo} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={s.label}>Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, color: 'var(--color-foreground)', pointerEvents: 'none' }} />
              <input style={{ ...s.input, paddingLeft: '36px' }} type="password" value={passForm.nueva} onChange={e => setPassForm(p => ({ ...p, nueva: e.target.value }))} placeholder="Nueva contraseña" />
            </div>
          </div>
          <div>
            <label style={s.label}>Confirmar Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, color: 'var(--color-foreground)', pointerEvents: 'none' }} />
              <input
                style={{ ...s.input, paddingLeft: '36px', borderColor: passForm.confirmar && passForm.nueva !== passForm.confirmar ? 'var(--color-destructive)' : 'var(--color-border)' }}
                type="password" value={passForm.confirmar} onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
                placeholder="Repite la contraseña" />
            </div>
            {passForm.confirmar && passForm.nueva !== passForm.confirmar && (
              <p style={{ fontSize: '11px', color: 'var(--color-destructive)', marginTop: '4px', fontWeight: 600 }}>Las contraseñas no coinciden</p>
            )}
          </div>
        </div>

        <button onClick={guardarPassword} disabled={guardandoP || !passForm.nueva || !passForm.confirmar}
          style={{ marginTop: '20px', padding: '11px 24px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: (guardandoP || !passForm.nueva || !passForm.confirmar) ? 'not-allowed' : 'pointer', opacity: (guardandoP || !passForm.nueva || !passForm.confirmar) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={15} />
          {guardandoP ? 'Actualizando...' : 'Cambiar Contraseña'}
        </button>
      </motion.div>
    </div>
  );
}
