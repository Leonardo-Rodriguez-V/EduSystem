import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

const gradText = {
  background: 'linear-gradient(to right, #a5b4fc, #c4b5fd, #f0abfc)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const INFO = [
  {
    icon: Mail,
    label: 'Email',
    valor: 'contacto@edusync.com',
    href: 'mailto:contacto@edusync.com',
  },
  {
    icon: Phone,
    label: 'Teléfono',
    valor: '+56 9 1234 5678',
    href: 'tel:+56912345678',
  },
  {
    icon: MapPin,
    label: 'Ubicación',
    valor: 'Santiago, Chile',
    href: null,
  },
];

export default function ContactoSection() {
  const [form, setForm]       = useState({ nombre: '', correo: '', mensaje: '' });
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.nombre || !form.correo || !form.mensaje) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEnviado(true);
    }, 1200);
  };

  return (
    <section id="contacto" style={{ position: 'relative', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 999,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(165,180,252,0.3)',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#a5b4fc', marginBottom: 20,
          }}>
            Contacto
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, fontFamily: "'Crimson Pro', serif", margin: '0 0 16px', color: '#fff' }}>
            Ponte en{' '}
            <span style={gradText}>Contacto</span>
          </h2>
          <p className="text-translucent" style={{ fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            ¿Tienes preguntas sobre EduSync? Escríbenos y te respondemos en menos de 24 horas.
          </p>
        </div>

        {/* ── Layout dos columnas ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'start' }}>

          {/* ── Columna izquierda: info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(165,180,252,0.15)',
              borderRadius: 24, padding: '32px',
              backdropFilter: 'blur(20px)',
            }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: "'Crimson Pro', serif", margin: '0 0 8px' }}>
                Estamos aquí para ayudarte
              </p>
              <p className="text-translucent" style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Ya sea que necesites una demo, información sobre precios o soporte técnico, nuestro equipo está disponible para acompañarte en el proceso.
              </p>
            </div>

            {INFO.map(({ icon: Icon, label, valor, href }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(165,180,252,0.12)',
                borderRadius: 18, padding: '20px 24px',
                backdropFilter: 'blur(20px)',
                transition: 'border-color 0.2s, background 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(165,180,252,0.3)';
                  e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(165,180,252,0.12)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                  background: 'rgba(99,102,241,0.18)',
                  border: '1px solid rgba(165,180,252,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color="#a5b4fc" />
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                    {label}
                  </div>
                  {href ? (
                    <a href={href} style={{ color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
                      onMouseEnter={e => e.target.style.color = '#a5b4fc'}
                      onMouseLeave={e => e.target.style.color = '#fff'}>
                      {valor}
                    </a>
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{valor}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Columna derecha: formulario ── */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(165,180,252,0.15)',
            borderRadius: 24, padding: '36px',
            backdropFilter: 'blur(20px)',
          }}>
            {enviado ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(165,180,252,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle size={30} color="#a5b4fc" />
                </div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, fontFamily: "'Crimson Pro', serif", marginBottom: 10 }}>
                  ¡Mensaje enviado!
                </div>
                <p className="text-translucent" style={{ fontSize: 14, lineHeight: 1.7 }}>
                  Gracias por contactarnos. Te responderemos a <strong style={{ color: '#a5b4fc' }}>{form.correo}</strong> en menos de 24 horas.
                </p>
                <button
                  onClick={() => { setEnviado(false); setForm({ nombre: '', correo: '', mensaje: '' }); }}
                  style={{
                    marginTop: 24, padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(165,180,252,0.3)',
                    color: '#a5b4fc', fontWeight: 600, fontSize: 13,
                  }}
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Nombre completo
                  </label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez"
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(165,180,252,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Correo electrónico
                  </label>
                  <input
                    name="correo"
                    type="email"
                    value={form.correo}
                    onChange={handleChange}
                    placeholder="correo@colegio.cl"
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(165,180,252,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Mensaje
                  </label>
                  <textarea
                    name="mensaje"
                    value={form.mensaje}
                    onChange={handleChange}
                    placeholder="Cuéntanos sobre tu colegio y en qué podemos ayudarte..."
                    required
                    rows={5}
                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'rgba(165,180,252,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 24px', borderRadius: 13, cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', color: '#fff', fontWeight: 700, fontSize: 15,
                    boxShadow: loading ? 'none' : '0 8px 32px rgba(99,102,241,0.4)',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar mensaje
                    </>
                  )}
                </button>

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '12px 16px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};
