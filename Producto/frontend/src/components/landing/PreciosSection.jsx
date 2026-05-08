import { useState } from 'react';
import { ChevronDown, Check, X, Brain, FileDown, Mail, BarChart2, Headphones, Shield } from 'lucide-react';

// ── Datos ─────────────────────────────────────────────────────────────────────

const SEGMENTOS = [
  { id: 'muy_pequeno', label: 'Muy pequeño', rango: '1 – 150 alumnos',    desc: '~4.500 colegios en Chile' },
  { id: 'pequeno',     label: 'Pequeño',     rango: '151 – 400 alumnos',  desc: '~3.800 colegios' },
  { id: 'mediano',     label: 'Mediano',     rango: '401 – 800 alumnos',  desc: '~2.200 colegios' },
  { id: 'grande',      label: 'Grande',      rango: '801 – 1.500 alumnos',desc: '~900 colegios' },
  { id: 'muy_grande',  label: 'Muy grande',  rango: '1.501+ alumnos',     desc: '~400 colegios' },
];

const PERIODOS = [
  { id: 'mensual',     label: 'Mensual',     meses: 1 },
  { id: 'trimestral',  label: 'Trimestral',  meses: 3 },
  { id: 'semestral',   label: 'Semestral',   meses: 6 },
  { id: 'anual',       label: 'Anual',       meses: 12 },
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
  { label: 'Registro de asistencia y notas',    normal: true,  premium: true  },
  { label: 'Dashboard para director',            normal: true,  premium: true  },
  { label: 'Portal para apoderados',             normal: true,  premium: true  },
  { label: 'Calendario y muro de avisos',        normal: true,  premium: true  },
  { label: 'Exportación PDF / Word',             normal: false, premium: true  },
  { label: 'Asistente IA (AURA)',                normal: false, premium: true  },
  { label: 'IA predictiva — alertas de riesgo',  normal: false, premium: true  },
  { label: 'Automatización de emails',           normal: false, premium: true  },
  { label: 'Reportes personalizables',           normal: false, premium: true  },
  { label: 'Soporte prioritario (< 4 h)',        normal: false, premium: true  },
];

// ── Estilos compartidos ───────────────────────────────────────────────────────

const gradText = {
  background: 'linear-gradient(to right, #a5b4fc, #c4b5fd, #f0abfc)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function PreciosSection() {
  const [planAbierto, setPlanAbierto] = useState(null); // null | 'normal' | 'premium'

  const toggle = (id) => setPlanAbierto(prev => prev === id ? null : id);

  return (
    <section id="precios" style={{ position: 'relative', padding: '96px 24px' }}>
      <div style={{ margin: '0 auto', maxWidth: 1200 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 999,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(165,180,252,0.3)',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#a5b4fc', marginBottom: 20,
          }}>
            Planes y Precios
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, fontFamily: "'Crimson Pro', serif", margin: '0 0 16px' }}>
            Conoce Nuestros{' '}
            <span style={gradText}>Valores</span>
          </h2>
          <p className="text-translucent" style={{ fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
            Precios por colegio completo, sin límite de usuarios. Elige el plan y el tamaño que se adapta a tu institución.
          </p>
        </div>

        {/* ── Tarjetas de planes ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <PlanCard
            id="normal"
            abierto={planAbierto === 'normal'}
            onToggle={() => toggle('normal')}
          />
          <PlanCard
            id="premium"
            abierto={planAbierto === 'premium'}
            onToggle={() => toggle('premium')}
            destacado
          />
        </div>

        {/* ── Nota legal ── */}
        <p className="text-translucent" style={{ textAlign: 'center', fontSize: 12, marginTop: 40, opacity: 0.45 }}>
          Todos los precios en CLP · IVA no incluido · Facturación por colegio completo
        </p>
      </div>
    </section>
  );
}

// ── Tarjeta de plan ───────────────────────────────────────────────────────────

function PlanCard({ id, abierto, onToggle, destacado = false }) {
  const [segSel,    setSegSel]    = useState('pequeno');
  const [periodoSel, setPeriodoSel] = useState('mensual');

  const esPremium   = id === 'premium';
  const precios     = PRECIOS[id];
  const preciosSeg  = precios[segSel];
  const esConsultar = preciosSeg === null;

  const nombre     = esPremium ? 'Plan Premium' : 'Plan Normal';
  const desdeLabel = esPremium ? 'Desde $39.990' : 'Desde $19.990';
  const descripcion = esPremium
    ? 'Todo lo del plan Normal más inteligencia artificial integrada (AURA), exportación avanzada de reportes, automatización de correos a apoderados y soporte prioritario. Diseñado para colegios que quieren sacar el máximo provecho de la tecnología.'
    : 'Gestión completa del colegio: asistencia, notas, portal de apoderados, horarios y comunicaciones. Sin herramientas de IA ni exportación avanzada. Ideal para instituciones que buscan digitalizar sus procesos esenciales.';

  const accentColor = esPremium ? '#c4b5fd' : '#a5b4fc';
  const glowColor   = esPremium ? 'rgba(196,181,253,0.18)' : 'rgba(165,180,252,0.12)';
  const borderColor = esPremium ? 'rgba(196,181,253,0.4)' : 'rgba(165,180,252,0.2)';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${borderColor}`,
      borderRadius: 24,
      backdropFilter: 'blur(20px)',
      overflow: 'hidden',
      boxShadow: abierto ? `0 0 40px ${glowColor}` : 'none',
      transition: 'box-shadow 0.4s ease',
      position: 'relative',
    }}>
      {/* Badge "Más popular" */}
      {destacado && (
        <div style={{
          position: 'absolute', top: 0, right: 24,
          background: 'linear-gradient(135deg, #6366f1, #d946ef)',
          color: '#fff', fontSize: 11, fontWeight: 700,
          padding: '4px 14px', borderRadius: '0 0 12px 12px',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Más popular
        </div>
      )}

      {/* ── Header colapsado (siempre visible) ── */}
      <button onClick={onToggle} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '28px 28px 24px', textAlign: 'left',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: esPremium
                ? 'linear-gradient(135deg, #6366f1, #d946ef)'
                : 'rgba(99,102,241,0.25)',
              border: esPremium ? 'none' : '1px solid rgba(165,180,252,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {esPremium ? <Brain size={16} color="#fff" /> : <Shield size={16} color="#a5b4fc" />}
            </span>
            <span style={{ color: accentColor, fontWeight: 800, fontSize: 18, fontFamily: "'Crimson Pro', serif" }}>
              {nombre}
            </span>
          </div>
          <p className="text-translucent" style={{ fontSize: 13, margin: 0, lineHeight: 1.5, maxWidth: 340 }}>
            {esPremium ? 'IA + Exportación + Automatización' : 'Gestión escolar completa'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{desdeLabel}</span>
          <span style={{ color: 'var(--color-foreground, rgba(255,255,255,0.5))', fontSize: 11 }}>CLP / mes</span>
          <ChevronDown
            size={18} color={accentColor}
            style={{ transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', marginTop: 4 }}
          />
        </div>
      </button>

      {/* ── Contenido expandido ── */}
      <div style={{
        maxHeight: abierto ? '2000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ padding: '0 28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Separador */}
          <div style={{ height: 1, background: borderColor }} />

          {/* Descripción */}
          <p className="text-translucent" style={{ fontSize: 14, lineHeight: 1.75, margin: 0 }}>
            {descripcion}
          </p>

          {/* Características */}
          <div>
            <p style={{ color: accentColor, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Incluye
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEATURES.filter(f => esPremium ? f.premium : f.normal).map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: esPremium ? 'rgba(196,181,253,0.15)' : 'rgba(165,180,252,0.15)',
                    border: `1px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={11} color={accentColor} />
                  </span>
                  <span className="text-translucent" style={{ fontSize: 13 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparación Normal vs Premium (solo en Premium) */}
          {esPremium && (
            <div>
              <p style={{ color: accentColor, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                No incluido en Plan Normal
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FEATURES.filter(f => f.premium && !f.normal).map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={11} color="#d946ef" />
                    </span>
                    <span style={{ color: '#e9d5ff', fontSize: 13, fontWeight: 600 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separador */}
          <div style={{ height: 1, background: borderColor }} />

          {/* Selector de segmento */}
          <div>
            <p style={{ color: accentColor, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Tamaño del colegio
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SEGMENTOS.map(seg => {
                const activo = segSel === seg.id;
                return (
                  <button key={seg.id} onClick={() => setSegSel(seg.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
                    border: activo ? `1px solid ${borderColor}` : '1px solid transparent',
                    background: activo ? glowColor : 'rgba(255,255,255,0.03)',
                    transition: 'all 0.2s ease', textAlign: 'left',
                  }}>
                    <div>
                      <span style={{ color: activo ? accentColor : 'rgba(255,255,255,0.75)', fontWeight: activo ? 700 : 500, fontSize: 13 }}>
                        {seg.label}
                      </span>
                      <span className="text-translucent" style={{ fontSize: 12, marginLeft: 10, opacity: 0.6 }}>
                        {seg.rango}
                      </span>
                    </div>
                    <span className="text-translucent" style={{ fontSize: 11, opacity: 0.5 }}>{seg.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla de precios */}
          <div>
            <p style={{ color: accentColor, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Tabla de cobros — {SEGMENTOS.find(s => s.id === segSel)?.label}
            </p>

            {esConsultar ? (
              <div style={{
                padding: '24px', borderRadius: 16, textAlign: 'center',
                background: glowColor, border: `1px solid ${borderColor}`,
              }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 0 8px', fontFamily: "'Crimson Pro', serif" }}>
                  Plan Enterprise
                </p>
                <p className="text-translucent" style={{ fontSize: 13, margin: '0 0 16px' }}>
                  Para instituciones con más de 1.500 alumnos o cadenas de colegios (3+).
                  Precio personalizado con contrato a medida.
                </p>
                <a href="#contacto" style={{
                  display: 'inline-block', padding: '10px 24px', borderRadius: 10,
                  background: esPremium ? 'linear-gradient(135deg, #6366f1, #d946ef)' : 'rgba(99,102,241,0.3)',
                  color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13,
                  border: esPremium ? 'none' : `1px solid ${borderColor}`,
                }}>
                  Contactar ventas
                </a>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {PERIODOS.map(periodo => {
                  const precio = preciosSeg?.[periodo.id];
                  const esAnual = periodo.id === 'anual';
                  return (
                    <div key={periodo.id} style={{
                      padding: '16px 18px', borderRadius: 14,
                      background: esAnual ? glowColor : 'rgba(255,255,255,0.03)',
                      border: esAnual ? `1px solid ${borderColor}` : '1px solid rgba(255,255,255,0.07)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {esAnual && (
                        <span style={{
                          position: 'absolute', top: 8, right: 10,
                          fontSize: 10, fontWeight: 700, color: accentColor,
                          background: 'rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: 999,
                          letterSpacing: '0.05em',
                        }}>
                          MEJOR VALOR
                        </span>
                      )}
                      <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {periodo.label}
                      </p>
                      <p style={{ margin: 0, color: esAnual ? accentColor : '#fff', fontWeight: 800, fontSize: 22, fontFamily: "'Crimson Pro', serif" }}>
                        ${precio}
                      </p>
                      <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        {periodo.meses > 1 ? `pago único cada ${periodo.meses} meses` : 'por mes'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CTA */}
          <a href="#contacto" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px 24px', borderRadius: 12, textDecoration: 'none',
            background: esPremium
              ? 'linear-gradient(135deg, #6366f1, #d946ef)'
              : 'rgba(99,102,241,0.25)',
            border: esPremium ? 'none' : `1px solid ${borderColor}`,
            color: '#fff', fontWeight: 700, fontSize: 14,
            boxShadow: esPremium ? '0 8px 30px rgba(139,92,246,0.35)' : 'none',
            transition: 'opacity 0.2s',
          }}>
            Solicitar este plan
          </a>
        </div>
      </div>
    </div>
  );
}
