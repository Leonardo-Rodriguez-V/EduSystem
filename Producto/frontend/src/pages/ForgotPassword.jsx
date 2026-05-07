import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function ForgotPassword() {
  const [correo, setCorreo]   = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error,   setError]   = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo }),
      });
      await res.json();
      setEnviado(true);
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-background)', padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{
          background: 'var(--color-surface)', borderRadius: '28px',
          padding: '40px', maxWidth: '440px', width: '100%',
          boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid var(--color-border)',
        }}
      >
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '13px', fontWeight: 700, marginBottom: '28px' }}>
          <ArrowLeft size={15} /> Volver al inicio de sesión
        </Link>

        {enviado ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(21,128,61,0.1)', borderRadius: '50%', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} color="#15803d" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-foreground)', margin: '0 0 10px' }}>
              Revisa tu correo
            </h2>
            <p style={{ color: 'var(--color-foreground)', opacity: 0.6, fontSize: '14px', lineHeight: 1.6 }}>
              Si el correo <strong>{correo}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-foreground)', margin: '0 0 8px', fontFamily: "'Crimson Pro', serif" }}>
                ¿Olvidaste tu contraseña?
              </h1>
              <p style={{ color: 'var(--color-foreground)', opacity: 0.55, fontSize: '14px', margin: 0 }}>
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>
                  Correo electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', opacity: 0.7 }} />
                  <input
                    type="email" required value={correo} onChange={e => setCorreo(e.target.value)}
                    placeholder="tu@correo.cl"
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px', borderRadius: '14px',
                      border: '1.5px solid var(--color-border)', background: 'var(--color-muted)',
                      fontSize: '14px', color: 'var(--color-foreground)', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

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
                  opacity: cargando ? 0.7 : 1,
                }}
              >
                {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
