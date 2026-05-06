import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, GraduationCap, Users, BookOpen, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: GraduationCap, title: 'Gestión académica',   desc: 'Notas, asistencia y horarios en un solo lugar' },
  { icon: Users,         title: 'Comunidad escolar',    desc: 'Profesores, alumnos y apoderados conectados' },
  { icon: BookOpen,      title: 'Agenda institucional', desc: 'Evaluaciones y eventos sincronizados' },
  { icon: BarChart3,     title: 'Reportes en tiempo real', desc: 'Estadísticas y seguimiento académico' },
];

export default function Login() {
  const [correo,     setCorreo]     = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error,      setError]      = useState('');
  const [cargando,   setCargando]   = useState(false);
  const [verPass,    setVerPass]    = useState(false);
  const [focusCorreo,   setFocusCorreo]   = useState(false);
  const [focusPassword, setFocusPassword] = useState(false);
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

  const inputStyle = (focused) => ({
    width: '100%',
    padding: '13px 14px 13px 46px',
    borderRadius: '14px',
    border: `2px solid ${focused ? '#4f46e5' : '#e2e8f0'}`,
    fontSize: '14px',
    fontWeight: 500,
    outline: 'none',
    background: focused ? '#fafafe' : '#f8fafc',
    color: '#1e1b4b',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    boxShadow: focused
      ? '0 0 0 4px rgba(79,70,229,0.08), inset 2px 2px 4px rgba(255,255,255,0.8)'
      : 'inset 2px 2px 4px rgba(0,0,0,0.04)',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Orbes de fondo animados */}
      {[
        { w: 500, h: 500, top: '-15%', left: '-10%',  color: 'rgba(79,70,229,0.25)',  delay: 0 },
        { w: 400, h: 400, top: '60%',  right: '-8%',  color: 'rgba(129,140,248,0.2)', delay: 1.5 },
        { w: 300, h: 300, top: '30%',  left: '35%',   color: 'rgba(234,88,12,0.12)',  delay: 3 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, delay: orb.delay, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: orb.w, height: orb.h,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            top: orb.top, left: orb.left, right: orb.right,
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Contenedor principal */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          display: 'flex',
          width: '980px',
          maxWidth: '100%',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {/* ── Panel izquierdo: Branding ── */}
        <div style={{
          flex: 1,
          padding: '56px 48px',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '36px' }}>
              <div className="aura-orb" style={{
                width: 52, height: 52, borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <GraduationCap size={26} color="white" />
              </div>
              <div>
                <div style={{
                  fontSize: '32px', fontWeight: 900,
                  fontFamily: "'Crimson Pro', serif",
                  letterSpacing: '-1px', color: '#fff',
                  lineHeight: 1,
                }}>EduSync</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  PLATAFORMA EDUCATIVA
                </div>
              </div>
            </div>

            <h1 style={{
              fontSize: '36px', fontWeight: 900,
              fontFamily: "'Crimson Pro', serif",
              color: '#fff', lineHeight: 1.2,
              margin: '0 0 16px',
            }}>
              La nueva era de<br />la gestión educativa
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
              Simple, potente y colaborativa. Todo lo que tu institución necesita en un solo lugar.
            </p>
          </motion.div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.5 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={18} color="rgba(255,255,255,0.85)" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{f.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.05em' }}
          >
            © {new Date().getFullYear()} EDUSYSTEM · SISTEMA DE GESTIÓN ESCOLAR
          </motion.div>
        </div>

        {/* ── Panel derecho: Formulario ── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          style={{
            width: '420px',
            flexShrink: 0,
            background: '#fff',
            padding: '56px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Encabezado formulario */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(79,70,229,0.08)', borderRadius: '20px',
              padding: '4px 12px', marginBottom: '16px',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', letterSpacing: '0.06em' }}>
                ACCESO SEGURO
              </span>
            </div>
            <h2 style={{
              fontSize: '26px', fontWeight: 900,
              fontFamily: "'Crimson Pro', serif",
              color: '#1e1b4b', margin: '0 0 6px',
            }}>
              Bienvenido de nuevo
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
              Ingresa tus credenciales para acceder al portal
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -8 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflow: 'hidden',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Campo correo */}
            <div>
              <label style={{
                fontSize: '11px', fontWeight: 800, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'block', marginBottom: '8px',
              }}>
                Correo institucional
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{
                  position: 'absolute', left: '15px', top: '50%',
                  transform: 'translateY(-50%)',
                  color: focusCorreo ? '#4f46e5' : '#94a3b8',
                  transition: 'color 0.2s',
                }} />
                <input
                  type="text" required
                  value={correo}
                  onChange={e => { setCorreo(e.target.value); setError(''); }}
                  onFocus={() => setFocusCorreo(true)}
                  onBlur={() => setFocusCorreo(false)}
                  placeholder="nombre@colegio.cl"
                  style={inputStyle(focusCorreo)}
                />
              </div>
            </div>

            {/* Campo contraseña */}
            <div>
              <label style={{
                fontSize: '11px', fontWeight: 800, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'block', marginBottom: '8px',
              }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{
                  position: 'absolute', left: '15px', top: '50%',
                  transform: 'translateY(-50%)',
                  color: focusPassword ? '#4f46e5' : '#94a3b8',
                  transition: 'color 0.2s',
                }} />
                <input
                  type={verPass ? 'text' : 'password'} required
                  value={contraseña}
                  onChange={e => { setContraseña(e.target.value); setError(''); }}
                  onFocus={() => setFocusPassword(true)}
                  onBlur={() => setFocusPassword(false)}
                  placeholder="••••••••"
                  style={{ ...inputStyle(focusPassword), paddingRight: '46px' }}
                />
                <button
                  type="button"
                  onClick={() => setVerPass(!verPass)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', padding: '4px',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {verPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Botón submit */}
            <motion.button
              type="submit"
              disabled={cargando}
              whileHover={{ scale: cargando ? 1 : 1.02 }}
              whileTap={{ scale: cargando ? 1 : 0.97 }}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '15px',
                borderRadius: '14px',
                background: cargando
                  ? '#a5b4fc'
                  : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '15px',
                border: 'none',
                cursor: cargando ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: cargando ? 'none' : '0 8px 24px rgba(79,70,229,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'all 0.25s ease',
                letterSpacing: '0.01em',
              }}
            >
              {cargando ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                    }}
                  />
                  Verificando...
                </>
              ) : (
                <>
                  Acceder al Portal
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Separador y nota de seguridad */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>INSTITUCIÓN</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#f8fafc', borderRadius: '12px',
              padding: '8px 16px', border: '1px solid #e2e8f0',
            }}>
              <div className="aura-orb" style={{
                width: 24, height: 24, borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <GraduationCap size={13} color="white" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                EduSystem · Portal Escolar
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '14px' }}>
              Acceso exclusivo para personal autorizado
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
