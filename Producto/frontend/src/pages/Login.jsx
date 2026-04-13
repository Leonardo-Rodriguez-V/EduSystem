import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2,
  ShieldCheck,
  Zap,
  LayoutDashboard
} from 'lucide-react';

export default function Login() {
  const [correo,     setCorreo]     = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error,      setError]      = useState('');
  const [cargando,   setCargando]   = useState(false);
  const [verPass,    setVerPass]    = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('usuario')) navigate('/dashboard');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res   = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contraseña }),
      });
      const datos = await res.json();
      if (res.ok) {
        localStorage.setItem('usuario', JSON.stringify(datos.usuario));
        localStorage.setItem('token', datos.token);
        window.location.href = '/dashboard';
      } else {
        setError(datos.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      
      <div style={{ 
        display: 'flex', 
        width: '1000px', 
        maxWidth: '100%', 
        background: 'rgba(255, 255, 255, 0.1)', 
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        {/* Panel izquierdo — Branding */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            flex: 1, 
            padding: '60px', 
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 900, 
            fontFamily: "'Crimson Pro', serif", 
            letterSpacing: '-2px',
            marginBottom: '16px'
          }}>
            EduSync
          </div>
          <p style={{ 
            fontSize: '18px', 
            color: 'rgba(255,255,255,0.8)', 
            marginBottom: '40px',
            lineHeight: 1.6
          }}>
            La nueva era de la gestión educativa.<br />
            Simple, potente y colaborativa.
          </p>

          <div style={{ display: 'grid', gap: '24px' }}>
            {[
              { icon: CheckCircle2, text: 'Gestión académica integral' },
              { icon: ShieldCheck,  text: 'Datos seguros y encriptados' },
              { icon: Zap,          text: 'Acceso rápido institucional' },
              { icon: LayoutDashboard, text: 'Reportes en tiempo real' },
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * i }}
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '14px' }}>
                  <f.icon size={20} />
                </div>
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Panel derecho — Formulario */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '440px', 
            background: 'white', 
            padding: '60px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0 }}>Bienvenido de nuevo</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Ingresa tus credenciales para acceder</p>
          </div>

          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              style={{
                background: '#fee2e2', 
                color: '#b91c1c', 
                padding: '12px 16px', 
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Zap size={16} /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Correo Institucional
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text" required
                  value={correo} onChange={e => setCorreo(e.target.value)}
                  placeholder="nombre@colegio.cl"
                  style={{
                    width: '100%', padding: '14px 14px 14px 48px',
                    borderRadius: '16px', border: '2px solid #f1f5f9',
                    fontSize: '14px', fontWeight: 600, outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = '#f1f5f9'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type={verPass ? 'text' : 'password'} required
                  value={contraseña} onChange={e => setContraseña(e.target.value)}
                  placeholder="Tu contraseña secreta"
                  style={{
                    width: '100%', padding: '14px 48px 14px 48px',
                    borderRadius: '16px', border: '2px solid #f1f5f9',
                    fontSize: '14px', fontWeight: 600, outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = '#f1f5f9'}
                />
                <button
                  type="button"
                  onClick={() => setVerPass(!verPass)}
                  style={{
                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
                  }}
                >
                  {verPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={cargando}
              className="clay-button"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '14px',
                fontSize: '16px'
              }}
            >
              {cargando ? 'Accediendo...' : (
                <>Acceder al Portal <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          {/* Cuentas demo */}
          <div style={{ marginTop: '40px', padding: '16px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
            <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Acceso Demo</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { r: 'Director', c: 'leonardo.alejandrorv@gmail.com', p: 'Leonardo1' },
                { r: 'Profesor', c: 'ana@edusync.com', p: 'ana123456' },
                { r: 'Apoderado', c: 'san@gmail.com', p: 'sandro123' },
              ].map(d => (
                <button
                  key={d.r}
                  onClick={() => { setCorreo(d.c); setContraseña(d.p); }}
                  style={{
                    background: 'none', border: 'none', textAlign: 'left', padding: '6px 8px',
                    fontSize: '12px', cursor: 'pointer', borderRadius: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', marginRight: '8px' }}>{d.r}</span>
                  <span style={{ color: '#64748b' }}>{d.c}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
