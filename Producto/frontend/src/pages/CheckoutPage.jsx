import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Brain, ArrowLeft, ArrowRight, CreditCard, Landmark, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PRECIOS = {
  normal: {
    muy_pequeno: { mensual: 19990,  trimestral: 49990,   semestral: 89990,   anual: 149990  },
    pequeno:     { mensual: 39990,  trimestral: 99990,   semestral: 179990,  anual: 299990  },
    mediano:     { mensual: 69990,  trimestral: 179990,  semestral: 329990,  anual: 549990  },
    grande:      { mensual: 119990, trimestral: 299990,  semestral: 549990,  anual: 899990  },
  },
  premium: {
    muy_pequeno: { mensual: 39990,  trimestral: 99990,   semestral: 179990,  anual: 299990  },
    pequeno:     { mensual: 79990,  trimestral: 199990,  semestral: 359990,  anual: 599990  },
    mediano:     { mensual: 139990, trimestral: 359990,  semestral: 659990,  anual: 1099990 },
    grande:      { mensual: 239990, trimestral: 599990,  semestral: 1099990, anual: 1799990 },
  },
};

const LABELS = {
  plan:     { normal: 'Plan Normal', premium: 'Plan Premium' },
  segmento: { muy_pequeno: 'Muy pequeño (1–150)', pequeno: 'Pequeño (151–400)', mediano: 'Mediano (401–800)', grande: 'Grande (801–1.500)' },
  periodo:  { mensual: 'Mensual', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual' },
};

const gradText = {
  background: 'linear-gradient(to right, #a5b4fc, #c4b5fd, #f0abfc)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12,
  fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
};

export default function CheckoutPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();

  const plan     = params.get('plan')     || 'premium';
  const segmento = params.get('segmento') || 'pequeno';
  const periodo  = params.get('periodo')  || 'mensual';
  const precio   = PRECIOS[plan]?.[segmento]?.[periodo];

  const [paso, setPaso]     = useState(1);
  const [form, setForm]     = useState({ nombre_colegio: '', nombre_director: '', correo: '', telefono: '', nro_alumnos_aprox: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [solicitudId, setSolicitudId] = useState(null);
  const [errorGlobal, setErrorGlobal] = useState('');
  const [notasTransf, setNotasTransf] = useState('');
  const [transfEnviada, setTransfEnviada] = useState(false);

  // Redirigir si los parámetros son inválidos
  useEffect(() => {
    if (!precio) navigate('/');
  }, [precio, navigate]);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validar = () => {
    const e = {};
    if (!form.nombre_colegio.trim())  e.nombre_colegio  = 'Requerido';
    if (!form.nombre_director.trim()) e.nombre_director = 'Requerido';
    if (!form.correo.trim() || !/\S+@\S+\.\S+/.test(form.correo)) e.correo = 'Correo inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinuar = async () => {
    if (!validar()) return;
    setLoading(true);
    setErrorGlobal('');
    try {
      const res  = await fetch(`${API}/pagos/solicitud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan, segmento, periodo, nro_alumnos_aprox: Number(form.nro_alumnos_aprox) || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar solicitud');
      setSolicitudId(data.solicitudId);
      setPaso(2);
    } catch (err) {
      setErrorGlobal(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMercadoPago = async () => {
    setLoading(true);
    setErrorGlobal('');
    try {
      const res  = await fetch(`${API}/pagos/mercadopago/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error con MercadoPago');
      window.location.href = data.init_point;
    } catch (err) {
      setErrorGlobal(err.message);
      setLoading(false);
    }
  };

  const handlePayPal = async () => {
    setLoading(true);
    setErrorGlobal('');
    try {
      const res  = await fetch(`${API}/pagos/paypal/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error con PayPal');
      window.location.href = data.approval_url;
    } catch (err) {
      setErrorGlobal(err.message);
      setLoading(false);
    }
  };

  const handleTransferencia = async () => {
    setLoading(true);
    setErrorGlobal('');
    try {
      const res = await fetch(`${API}/pagos/transferencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId, notas: notasTransf }),
      });
      if (!res.ok) throw new Error('Error al registrar transferencia');
      setTransfEnviada(true);
    } catch (err) {
      setErrorGlobal(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!precio) return null;

  const precioFormato = precio.toLocaleString('es-CL');
  const esPremium     = plan === 'premium';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px' }}>

      {/* Logo / volver */}
      <div style={{ width: '100%', maxWidth: 780, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <button onClick={() => navigate('/')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer', fontSize: 14, padding: 0,
        }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, fontFamily: "'Crimson Pro', serif", ...gradText }}>
          EduSync
        </span>
        <div style={{ width: 60 }} />
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        {[{ n: 1, label: 'Tus datos' }, { n: 2, label: 'Pago' }].map(({ n, label }) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14,
              background: paso >= n ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.08)',
              color: paso >= n ? '#fff' : 'rgba(255,255,255,0.3)',
              border: paso >= n ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}>{n}</div>
            <span style={{ color: paso >= n ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: paso >= n ? 600 : 400 }}>{label}</span>
            {n < 2 && <div style={{ width: 32, height: 1, background: paso > n ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)' }} />}
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 780, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* ── Panel izquierdo ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 32,
        }}>
          {paso === 1 ? (
            <>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: '0 0 8px', fontFamily: "'Crimson Pro', serif" }}>
                Datos del colegio
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: '0 0 28px' }}>
                Ingresa la información de tu institución para crear la cuenta.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Field label="Nombre del colegio *" name="nombre_colegio" value={form.nombre_colegio} onChange={handleChange} error={errors.nombre_colegio} placeholder="Ej: Colegio San Martín" />
                <Field label="Nombre del director/a *" name="nombre_director" value={form.nombre_director} onChange={handleChange} error={errors.nombre_director} placeholder="Nombre completo" />
                <Field label="Correo del director/a *" name="correo" type="email" value={form.correo} onChange={handleChange} error={errors.correo} placeholder="director@colegio.cl" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Teléfono (opcional)" name="telefono" value={form.telefono} onChange={handleChange} placeholder="+56 9 ..." />
                  <Field label="N° alumnos aprox." name="nro_alumnos_aprox" type="number" value={form.nro_alumnos_aprox} onChange={handleChange} placeholder="Ej: 250" />
                </div>
              </div>

              {errorGlobal && <p style={{ color: '#f87171', fontSize: 13, marginTop: 16 }}>{errorGlobal}</p>}

              <button onClick={handleContinuar} disabled={loading} style={{
                marginTop: 28, width: '100%', padding: '14px 0', borderRadius: 12,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none', color: '#fff', fontWeight: 800, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
                {loading ? 'Procesando...' : 'Continuar al pago'}
              </button>
            </>
          ) : transfEnviada ? (
            <TransferenciaExito navigate={navigate} />
          ) : (
            <>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: '0 0 8px', fontFamily: "'Crimson Pro', serif" }}>
                Elige tu método de pago
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: '0 0 28px' }}>
                Todos los métodos son seguros y procesados de forma inmediata.
              </p>

              {/* MercadoPago */}
              <MetodoPago
                icono={<CreditCard size={22} color="#00b1ea" />}
                titulo="MercadoPago"
                subtitulo="WebPay · Tarjetas de crédito/débito · Transferencia"
                color="#00b1ea"
                onClick={handleMercadoPago}
                loading={loading}
              />

              {/* PayPal */}
              <MetodoPago
                icono={<span style={{ fontWeight: 900, fontSize: 18, color: '#003087' }}>P</span>}
                bgIcono="rgba(0,48,135,0.15)"
                titulo="PayPal"
                subtitulo="Pago internacional con tu cuenta PayPal"
                color="#009cde"
                onClick={handlePayPal}
                loading={loading}
                style={{ marginTop: 12 }}
              />

              {/* Separador */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>o paga por transferencia</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Transferencia manual */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Landmark size={20} color="#a5b4fc" />
                  </span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Transferencia bancaria</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Te activamos el plan en 24 h hábiles</div>
                  </div>
                </div>

                {/* Datos bancarios */}
                <div style={{
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(165,180,252,0.15)',
                  borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13,
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos de transferencia</p>
                  {[
                    ['Banco',   'Banco Estado'],
                    ['Tipo',    'Cuenta corriente'],
                    ['N° cuenta', '123456789'],
                    ['RUT',     '12.345.678-9'],
                    ['Nombre',  'EduSystem SpA'],
                    ['Correo',  'educational.systemchl@gmail.com'],
                    ['Monto',   `$${precioFormato} CLP`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                <label style={labelStyle}>Comentario / N° de comprobante (opcional)</label>
                <textarea
                  value={notasTransf}
                  onChange={e => setNotasTransf(e.target.value)}
                  placeholder="Ej: Transferí el 16/05 a las 14:30, comprobante #98765"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />

                <button onClick={handleTransferencia} disabled={loading} style={{
                  marginTop: 12, width: '100%', padding: '12px 0', borderRadius: 10,
                  background: 'rgba(165,180,252,0.15)', border: '1px solid rgba(165,180,252,0.3)',
                  color: '#a5b4fc', fontWeight: 700, fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Ya realicé la transferencia
                </button>
              </div>

              {errorGlobal && <p style={{ color: '#f87171', fontSize: 13, marginTop: 14 }}>{errorGlobal}</p>}

              <button onClick={() => setPaso(1)} style={{
                marginTop: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <ArrowLeft size={14} /> Editar datos
              </button>
            </>
          )}
        </div>

        {/* ── Resumen del plan ── */}
        <div style={{
          background: esPremium
            ? 'linear-gradient(160deg, rgba(30,27,60,0.97), rgba(20,18,50,0.97))'
            : 'rgba(255,255,255,0.03)',
          border: esPremium ? '1px solid rgba(196,181,253,0.25)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 24,
          boxShadow: esPremium ? '0 0 40px rgba(139,92,246,0.15)' : 'none',
          position: 'sticky', top: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{
              width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: esPremium ? 'linear-gradient(135deg,#6366f1,#d946ef)' : 'rgba(99,102,241,0.2)',
            }}>
              {esPremium ? <Brain size={18} color="#fff" /> : <ShieldCheck size={18} color="#a5b4fc" />}
            </span>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{LABELS.plan[plan]}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                {LABELS.segmento[segmento]}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <Fila k="Plan" v={LABELS.plan[plan]} />
            <Fila k="Período" v={LABELS.periodo[periodo]} />
            <Fila k="Segmento" v={LABELS.segmento[segmento]} />
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginTop: 6 }}>$</span>
            <span style={{ color: '#fff', fontSize: 42, fontWeight: 800, fontFamily: "'Crimson Pro', serif", lineHeight: 1 }}>
              {precioFormato}
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '6px 0 0' }}>
            CLP · {LABELS.periodo[periodo].toLowerCase()} · IVA no incluido
          </p>

          <div style={{ marginTop: 20, padding: 12, background: 'rgba(99,102,241,0.1)', borderRadius: 10, border: '1px solid rgba(165,180,252,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              🔒 Pago 100% seguro. Recibirás tus credenciales de acceso al correo ingresado en un máximo de 24 h hábiles.
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, error, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ ...inputStyle, borderColor: error ? '#f87171' : 'rgba(255,255,255,0.1)' }}
      />
      {error && <p style={{ color: '#f87171', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}

function MetodoPago({ icono, bgIcono = 'rgba(0,177,234,0.12)', titulo, subtitulo, color, onClick, loading, style = {} }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
      borderRadius: 14, border: `1px solid ${color}33`, background: `${color}0d`,
      cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left',
      transition: 'background 0.2s', ...style,
    }}>
      <span style={{ width: 42, height: 42, borderRadius: 10, background: bgIcono, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icono}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{titulo}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{subtitulo}</div>
      </div>
      <ArrowRight size={16} color="rgba(255,255,255,0.3)" />
    </button>
  );
}

function Fila({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{v}</span>
    </div>
  );
}

function TransferenciaExito({ navigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🏦</div>
      <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: '0 0 12px', fontFamily: "'Crimson Pro', serif" }}>
        ¡Solicitud recibida!
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 28px' }}>
        Hemos registrado tu solicitud. Una vez que verifiquemos la transferencia, te enviaremos las credenciales de acceso a tu correo en un máximo de 24 horas hábiles.
      </p>
      <button onClick={() => navigate('/')} style={{
        padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
      }}>
        Volver al inicio
      </button>
    </div>
  );
}
