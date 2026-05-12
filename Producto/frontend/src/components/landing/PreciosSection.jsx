import { useState } from 'react';
import { Check, X, Brain, Shield } from 'lucide-react';

// ── Datos ─────────────────────────────────────────────────────────────────────

const SEGMENTOS = [
  { id: 'muy_pequeno', label: 'Muy pequeño', rango: '1–150 alumnos'    },
  { id: 'pequeno',     label: 'Pequeño',     rango: '151–400 alumnos'  },
  { id: 'mediano',     label: 'Mediano',     rango: '401–800 alumnos'  },
  { id: 'grande',      label: 'Grande',      rango: '801–1.500 alumnos'},
  { id: 'muy_grande',  label: 'Enterprise',  rango: '1.501+ alumnos'   },
];

const PERIODOS = [
  { id: 'mensual',    label: 'Mensual',    desc: 'por mes'          },
  { id: 'trimestral', label: 'Trimestral', desc: 'cada 3 meses'     },
  { id: 'semestral',  label: 'Semestral',  desc: 'cada 6 meses'     },
  { id: 'anual',      label: 'Anual',      desc: 'por año', ahorro: true },
];

const PRECIOS = {
  normal: {
    muy_pequeno: { mensual: '19.990', trimestral: '49.990',   semestral: '89.990',    anual: '149.990'   },
    pequeno:     { mensual: '39.990', trimestral: '99.990',   semestral: '179.990',   anual: '299.990'   },
    mediano:     { mensual: '69.990', trimestral: '179.990',  semestral: '329.990',   anual: '549.990'   },
    grande:      { mensual: '119.990',trimestral: '299.990',  semestral: '549.990',   anual: '899.990'   },
    muy_grande:  null,
  },
  premium: {
    muy_pequeno: { mensual: '39.990', trimestral: '99.990',   semestral: '179.990',   anual: '299.990'   },
    pequeno:     { mensual: '79.990', trimestral: '199.990',  semestral: '359.990',   anual: '599.990'   },
    mediano:     { mensual: '139.990',trimestral: '359.990',  semestral: '659.990',   anual: '1.099.990' },
    grande:      { mensual: '239.990',trimestral: '599.990',  semestral: '1.099.990', anual: '1.799.990' },
    muy_grande:  null,
  },
};

const FEATURES = [
  { label: 'Registro de asistencia y notas',   normal: true,  premium: true  },
  { label: 'Dashboard para director',           normal: true,  premium: true  },
  { label: 'Portal para apoderados',            normal: true,  premium: true  },
  { label: 'Calendario y muro de avisos',       normal: true,  premium: true  },
  { label: 'Exportación PDF / Word',            normal: false, premium: true  },
  { label: 'Asistente IA (AURA)',               normal: false, premium: true  },
  { label: 'IA predictiva — alertas de riesgo', normal: false, premium: true  },
  { label: 'Automatización de emails',          normal: false, premium: true  },
  { label: 'Reportes personalizables',          normal: false, premium: true  },
  { label: 'Soporte prioritario (< 4 h)',       normal: false, premium: true  },
];

const gradText = {
  background: 'linear-gradient(to right, #a5b4fc, #c4b5fd, #f0abfc)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

// ── Sección principal ─────────────────────────────────────────────────────────

export default function PreciosSection() {
  const [segSel,     setSegSel]     = useState('pequeno');
  const [periodoSel, setPeriodoSel] = useState('mensual');

  return (
    <section id="precios" style={{ position: 'relative', padding: '96px 24px' }}>
      <div style={{ margin: '0 auto', maxWidth: 1100 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 999,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(165,180,252,0.3)',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#a5b4fc', marginBottom: 20,
          }}>
            Planes y Precios
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, fontFamily: "'Crimson Pro', serif", margin: '0 0 16px', color: '#fff' }}>
            Conoce Nuestros{' '}
            <span style={gradText}>Valores</span>
          </h2>
          <p className="text-translucent" style={{ fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
            Precio único por colegio completo, sin límite de usuarios. Selecciona tu tamaño y período de pago.
          </p>
        </div>

        {/* ── Selector de segmento ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {SEGMENTOS.map(seg => {
            const activo = segSel === seg.id;
            return (
              <button key={seg.id} onClick={() => setSegSel(seg.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 20px', borderRadius: 14, cursor: 'pointer', border: 'none',
                background: activo ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                outline: activo ? '1px solid rgba(165,180,252,0.45)' : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease',
              }}>
                <span style={{ color: activo ? '#a5b4fc' : 'rgba(255,255,255,0.7)', fontWeight: activo ? 700 : 500, fontSize: 13 }}>
                  {seg.label}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
                  {seg.rango}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Selector de período ── */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 48,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 4, width: 'fit-content', margin: '0 auto 48px',
        }}>
          {PERIODOS.map(p => {
            const activo = periodoSel === p.id;
            return (
              <button key={p.id} onClick={() => setPeriodoSel(p.id)} style={{
                padding: '8px 20px', borderRadius: 10, cursor: 'pointer', border: 'none',
                background: activo ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                color: activo ? '#fff' : 'rgba(255,255,255,0.5)',
                fontWeight: activo ? 700 : 500, fontSize: 13,
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: activo ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
              }}>
                {p.label}
                {p.ahorro && activo && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: '#fff',
                    background: 'rgba(255,255,255,0.2)', padding: '2px 7px', borderRadius: 999,
                    letterSpacing: '0.04em',
                  }}>
                    -20%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tarjetas ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28, alignItems: 'start' }}>
          <PlanCard id="normal"  segSel={segSel} periodoSel={periodoSel} />
          <PlanCard id="premium" segSel={segSel} periodoSel={periodoSel} destacado />
        </div>

        {/* ── Nota legal ── */}
        <p className="text-translucent" style={{ textAlign: 'center', fontSize: 12, marginTop: 40, opacity: 0.4 }}>
          Todos los precios en CLP · IVA no incluido · Facturación por colegio completo
        </p>
      </div>
    </section>
  );
}

// ── Tarjeta de plan ───────────────────────────────────────────────────────────

function PlanCard({ id, segSel, periodoSel, destacado = false }) {
  const esPremium   = id === 'premium';
  const preciosSeg  = PRECIOS[id][segSel];
  const esEnterprise = preciosSeg === null;
  const precio      = esEnterprise ? null : preciosSeg[periodoSel];
  const periodoInfo = PERIODOS.find(p => p.id === periodoSel);

  const accentColor = esPremium ? '#c4b5fd' : '#a5b4fc';
  const borderColor = esPremium ? 'rgba(196,181,253,0.3)' : 'rgba(165,180,252,0.15)';

  return (
    <div style={{
      borderRadius: 24,
      padding: esPremium ? 1 : 0,
      background: esPremium
        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)'
        : 'transparent',
      boxShadow: esPremium
        ? '0 0 60px rgba(139,92,246,0.25), 0 20px 50px rgba(0,0,0,0.3)'
        : '0 4px 24px rgba(0,0,0,0.2)',
      position: 'relative',
    }}>
      {/* Badge Más popular */}
      {destacado && (
        <div style={{
          position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #6366f1, #d946ef)',
          color: '#fff', fontSize: 11, fontWeight: 700,
          padding: '5px 20px', borderRadius: 999,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          whiteSpace: 'nowrap', zIndex: 2,
          boxShadow: '0 4px 20px rgba(139,92,246,0.5)',
        }}>
          ⭐ Más popular
        </div>
      )}

      {/* Inner card */}
      <div style={{
        background: esPremium
          ? 'linear-gradient(160deg, rgba(30,27,60,0.97) 0%, rgba(20,18,50,0.97) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: esPremium ? 'none' : `1px solid ${borderColor}`,
        borderRadius: esPremium ? 23 : 24,
        backdropFilter: 'blur(20px)',
        padding: 32,
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>

        {/* Plan header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: esPremium
              ? 'linear-gradient(135deg, #6366f1, #d946ef)'
              : 'rgba(99,102,241,0.2)',
            border: esPremium ? 'none' : '1px solid rgba(165,180,252,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {esPremium ? <Brain size={22} color="#fff" /> : <Shield size={22} color="#a5b4fc" />}
          </span>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, fontFamily: "'Crimson Pro', serif" }}>
              {esPremium ? 'Plan Premium' : 'Plan Normal'}
            </div>
            <div className="text-translucent" style={{ fontSize: 13, marginTop: 2 }}>
              {esPremium ? 'IA + Exportación + Automatización' : 'Gestión escolar completa'}
            </div>
          </div>
        </div>

        {/* Precio */}
        <div style={{ padding: '4px 0' }}>
          {esEnterprise ? (
            <div>
              <div style={{ color: '#fff', fontSize: 36, fontWeight: 800, fontFamily: "'Crimson Pro', serif" }}>
                Enterprise
              </div>
              <div className="text-translucent" style={{ fontSize: 13, marginTop: 4 }}>
                Precio personalizado · contrato a medida
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 20, fontWeight: 600, marginTop: 10 }}>$</span>
                <span style={{ color: '#fff', fontSize: 54, fontWeight: 800, fontFamily: "'Crimson Pro', serif", lineHeight: 1 }}>
                  {precio}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span className="text-translucent" style={{ fontSize: 13 }}>
                  CLP · {periodoInfo?.desc}
                </span>
                {periodoInfo?.ahorro && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: accentColor,
                    background: esPremium ? 'rgba(196,181,253,0.15)' : 'rgba(165,180,252,0.12)',
                    padding: '2px 9px', borderRadius: 999,
                    border: `1px solid ${borderColor}`,
                  }}>
                    Ahorra 20%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: borderColor }} />

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {FEATURES.map(f => {
            const incluido = esPremium ? f.premium : f.normal;
            return (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: incluido
                    ? (esPremium ? 'rgba(196,181,253,0.12)' : 'rgba(165,180,252,0.12)')
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${incluido ? borderColor : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {incluido
                    ? <Check size={12} color={accentColor} />
                    : <X size={11} color="rgba(255,255,255,0.2)" />
                  }
                </span>
                <span style={{
                  fontSize: 13,
                  color: incluido ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.28)',
                  fontWeight: incluido ? 500 : 400,
                }}>
                  {f.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <a href="#contacto" style={{
          display: 'block', textAlign: 'center',
          padding: '14px 24px', borderRadius: 13,
          textDecoration: 'none', fontWeight: 700, fontSize: 14,
          marginTop: 4,
          background: esPremium
            ? 'linear-gradient(135deg, #6366f1, #d946ef)'
            : 'rgba(99,102,241,0.2)',
          border: esPremium ? 'none' : `1px solid ${borderColor}`,
          color: '#fff',
          boxShadow: esPremium ? '0 8px 32px rgba(99,102,241,0.4)' : 'none',
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {esEnterprise ? 'Contactar ventas' : 'Solicitar este plan'}
        </a>
      </div>
    </div>
  );
}
