import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif",
      background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1976D2 100%)',
    }}>
      {/* Panel izquierdo — branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', color: '#fff',
      }} className="hidden-mobile">
        <div style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '12px' }}>
          EduSync
        </div>
        <div style={{ fontSize: '20px', fontWeight: 400, color: 'rgba(255,255,255,.8)', marginBottom: '40px', lineHeight: 1.4 }}>
          Plataforma de Gestión Escolar<br />en la Nube
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {[
            { icon: '📋', text: 'Registro de asistencia en tiempo real' },
            { icon: '📝', text: 'Calificaciones digitales seguras' },
            { icon: '📢', text: 'Comunicación directa con apoderados' },
            { icon: '📊', text: 'Dashboard analítico para directivos' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(255,255,255,.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
              }}>{f.icon}</div>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.85)' }}>{f.text}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '60px', fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>
          © 2026 EduSync — Sistema de Gestión Escolar
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{
        width: '460px', background: '#fff', display: 'flex',
        flexDirection: 'column', justifyContent: 'center', padding: '60px 48px',
        boxShadow: '-8px 0 40px rgba(0,0,0,.15)',
      }}>
        {/* Logo móvil */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#1565C0' }}>EduSync</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1A2B4A', marginTop: '8px' }}>
            Bienvenido de vuelta
          </div>
          <div style={{ fontSize: '14px', color: '#607D8B', marginTop: '4px' }}>
            Ingresa tus credenciales para continuar
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px', borderRadius: '8px',
            background: '#FFEBEE', color: '#C62828', fontSize: '13px',
            border: '1px solid #FFCDD2', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Correo */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '7px' }}>
              Correo electrónico
            </label>
            <input
              type="email" required autoComplete="email"
              value={correo} onChange={e => setCorreo(e.target.value)}
              placeholder="usuario@edusync.com"
              style={{
                width: '100%', padding: '11px 14px', border: '1.5px solid #E8EDF2',
                borderRadius: '8px', fontSize: '14px', outline: 'none',
                color: '#1A2B4A', boxSizing: 'border-box', transition: '.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#1565C0'}
              onBlur={e  => e.target.style.borderColor = '#E8EDF2'}
            />
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '7px' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={verPass ? 'text' : 'password'} required autoComplete="current-password"
                value={contraseña} onChange={e => setContraseña(e.target.value)}
                placeholder="Tu contraseña"
                style={{
                  width: '100%', padding: '11px 44px 11px 14px', border: '1.5px solid #E8EDF2',
                  borderRadius: '8px', fontSize: '14px', outline: 'none',
                  color: '#1A2B4A', boxSizing: 'border-box', transition: '.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#1565C0'}
                onBlur={e  => e.target.style.borderColor = '#E8EDF2'}
              />
              <button
                type="button"
                onClick={() => setVerPass(v => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#90A4AE',
                }}
              >
                {verPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit" disabled={cargando}
            style={{
              width: '100%', padding: '13px', borderRadius: '8px', border: 'none',
              background: cargando ? '#90A4AE' : '#1565C0', color: '#fff',
              fontSize: '15px', fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer',
              transition: '.2s', letterSpacing: '.3px',
            }}
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión →'}
          </button>
        </form>

        {/* Roles de demo */}
        <div style={{ marginTop: '36px', padding: '16px', background: '#F5F7FA', borderRadius: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>
            Cuentas de demostración
          </div>
          {[
            { rol: 'Director',  correo: 'leonardo.alejandrorv@gmail.com', pass: 'Leonardo1' },
            { rol: 'Profesor',  correo: 'ana@edusync.com',                pass: 'ana123456' },
            { rol: 'Apoderado', correo: 'san@gmail.com',                  pass: 'sandro123' },
          ].map(d => (
            <button
              key={d.rol}
              type="button"
              onClick={() => { setCorreo(d.correo); setContraseña(d.pass); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px',
                background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px',
                fontSize: '12px', color: '#455A64', transition: '.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E3F2FD'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontWeight: 600, color: '#1565C0', marginRight: '8px' }}>{d.rol}</span>
              {d.correo}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
