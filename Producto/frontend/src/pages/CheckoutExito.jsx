import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const gradText = {
  background: 'linear-gradient(to right, #a5b4fc, #c4b5fd, #f0abfc)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export default function CheckoutExito() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();

  const method      = params.get('method');
  const solicitudId = params.get('solicitud');
  const orderId     = params.get('token');    // PayPal devuelve "token" = orderId
  const pending     = params.get('pending');

  const [estado, setEstado] = useState('cargando'); // cargando | ok | pendiente | error
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (method === 'paypal' && orderId && solicitudId) {
      capturarPayPal();
    } else if (method === 'mercadopago') {
      setEstado(pending === 'true' ? 'pendiente' : 'ok');
    } else {
      setEstado('ok');
    }
  }, []);

  const capturarPayPal = async () => {
    try {
      const res  = await fetch(`${API}/pagos/paypal/capturar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, solicitudId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al confirmar pago');
      setEstado('ok');
    } catch (err) {
      setEstado('error');
      setMensaje(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a1a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 16px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <span style={{ fontWeight: 900, fontSize: 28, fontFamily: "'Crimson Pro', serif", ...gradText }}>
          EduSync
        </span>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center',
      }}>
        {estado === 'cargando' && <Cargando />}
        {estado === 'ok'       && <Exito method={method} navigate={navigate} />}
        {estado === 'pendiente' && <Pendiente navigate={navigate} />}
        {estado === 'error'    && <ErrorPago mensaje={mensaje} navigate={navigate} />}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Cargando() {
  return (
    <>
      <Loader2 size={48} color="#6366f1" style={{ animation: 'spin 1s linear infinite', marginBottom: 20 }} />
      <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: '0 0 12px', fontFamily: "'Crimson Pro', serif" }}>
        Confirmando tu pago...
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
        Esto tomará solo un momento.
      </p>
    </>
  );
}

function Exito({ method, navigate }) {
  const metodoLabel = method === 'mercadopago' ? 'MercadoPago' : method === 'paypal' ? 'PayPal' : 'transferencia';
  return (
    <>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.15)',
        border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 24px',
      }}>
        <CheckCircle size={36} color="#22c55e" />
      </div>

      <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 26, margin: '0 0 12px', fontFamily: "'Crimson Pro', serif" }}>
        ¡Pago recibido!
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, margin: '0 0 32px' }}>
        Confirmamos tu pago vía <strong style={{ color: '#fff' }}>{metodoLabel}</strong>. Recibirás las credenciales de acceso a EduSync en tu correo en un máximo de <strong style={{ color: '#fff' }}>24 horas hábiles</strong>.
      </p>

      <div style={{
        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(165,180,252,0.2)',
        borderRadius: 12, padding: 16, marginBottom: 28, textAlign: 'left',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          📩 Revisa tu carpeta de spam si no ves el correo. Si tienes dudas, escríbenos a{' '}
          <a href="mailto:educational.systemchl@gmail.com" style={{ color: '#a5b4fc' }}>
            educational.systemchl@gmail.com
          </a>
        </p>
      </div>

      <button onClick={() => navigate('/')} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        border: 'none', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
      }}>
        Volver al inicio
      </button>
    </>
  );
}

function Pendiente({ navigate }) {
  return (
    <>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,158,11,0.15)',
        border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 24px',
      }}>
        <Clock size={36} color="#f59e0b" />
      </div>

      <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 24, margin: '0 0 12px', fontFamily: "'Crimson Pro', serif" }}>
        Pago en revisión
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, margin: '0 0 28px' }}>
        MercadoPago está procesando tu pago. Cuando se confirme, te notificaremos por correo con tus credenciales de acceso.
      </p>

      <button onClick={() => navigate('/')} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
      }}>
        Volver al inicio
      </button>
    </>
  );
}

function ErrorPago({ mensaje, navigate }) {
  return (
    <>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.15)',
        border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 24px',
      }}>
        <XCircle size={36} color="#ef4444" />
      </div>

      <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: '0 0 12px', fontFamily: "'Crimson Pro', serif" }}>
        Error al confirmar el pago
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, margin: '0 0 12px' }}>
        {mensaje || 'Ocurrió un problema al procesar tu pago.'}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 28px' }}>
        Por favor contáctanos a{' '}
        <a href="mailto:educational.systemchl@gmail.com" style={{ color: '#a5b4fc' }}>
          educational.systemchl@gmail.com
        </a>{' '}
        para resolverlo.
      </p>

      <button onClick={() => navigate('/checkout')} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
      }}>
        Intentar de nuevo
      </button>
    </>
  );
}
