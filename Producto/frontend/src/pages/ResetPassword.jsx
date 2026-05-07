import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function ResetPassword() {
  const [searchParams]           = useSearchParams();
  const navigate                  = useNavigate();
  const token                     = searchParams.get('token') || '';

  const [pass,     setPass]       = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [verPass,  setVerPass]    = useState(false);
  const [exitoso,  setExitoso]    = useState(false);
  const [error,    setError]      = useState('');
  const [cargando, setCargando]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pass.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (pass !== confirm) return setError('Las contraseñas no coinciden.');
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaContraseña: pass }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Error al restablecer la contraseña.');
      setExitoso(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <h2 style={{ color: '#b91c1c', fontSize: '20px', fontWeight: 800 }}>Enlace inválido</h2>
          <p style={{ color: 'var(--color-foreground)', opacity: 0.6, marginTop: '8px' }}>Este enlace de recuperación no es válido o ya fue utilizado.</p>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, marginTop: '16px', display: 'inline-block' }}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-background)', padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{
          background: 'var(--color-surface)', borderRadius: '28px', padding: '40px',
          maxWidth: '440px', width: '100%',
          boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid var(--color-border)',
        }}
      >
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '13px', fontWeight: 700, marginBottom: '28px' }}>
          <ArrowLeft size={15} /> Volver al inicio de sesión
        </Link>

        {exitoso ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(21,128,61,0.1)', borderRadius: '50%', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} color="#15803d" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-foreground)', margin: '0 0 10px' }}>
              ¡Contraseña actualizada!
            </h2>
            <p style={{ color: 'var(--color-foreground)', opacity: 0.6, fontSize: '14px' }}>
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-foreground)', margin: '0 0 8px', fontFamily: "'Crimson Pro', serif" }}>
                Nueva contraseña
              </h1>
              <p style={{ color: 'var(--color-foreground)', opacity: 0.55, fontSize: '14px', margin: 0 }}>
                Elige una contraseña segura para tu cuenta.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {[
                { label: 'Nueva contraseña', value: pass, setter: setPass },
                { label: 'Confirmar contraseña', value: confirm, setter: setConfirm },
              ].map(({ label, value, setter }) => (
                <div key={label} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>
                    {label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', opacity: 0.7 }} />
                    <input
                      type={verPass ? 'text' : 'password'} required value={value}
                      onChange={e => setter(e.target.value)} placeholder="••••••••"
                      style={{
                        width: '100%', padding: '12px 40px 12px 40px', borderRadius: '14px',
                        border: '1.5px solid var(--color-border)', background: 'var(--color-muted)',
                        fontSize: '14px', color: 'var(--color-foreground)', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button type="button" onClick={() => setVerPass(v => !v)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground)', opacity: 0.4 }}>
                      {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {error && (
                <div style={{ background: 'rgba(185,28,28,0.1)', border: '1px solid rgba(185,28,28,0.3)', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <motion.button
                type="submit" disabled={cargando} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                  background: 'var(--color-primary)', color: '#fff',
                  fontSize: '15px', fontWeight: 800, cursor: cargando ? 'not-allowed' : 'pointer',
                  opacity: cargando ? 0.7 : 1, marginTop: '4px',
                }}
              >
                {cargando ? 'Guardando...' : 'Establecer nueva contraseña'}
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
