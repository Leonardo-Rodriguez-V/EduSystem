import { useState, useEffect, useRef } from 'react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

function generarCeldas(anio, mes) {
  const primero = new Date(anio, mes, 1);
  const ultimo  = new Date(anio, mes + 1, 0);
  const offset  = (primero.getDay() + 6) % 7; // lunes = 0
  const celdas  = [];
  for (let i = offset - 1; i >= 0; i--) {
    celdas.push({ d: new Date(anio, mes, -i), actual: false });
  }
  for (let d = 1; d <= ultimo.getDate(); d++) {
    celdas.push({ d: new Date(anio, mes, d), actual: true });
  }
  while (celdas.length < 42) {
    celdas.push({ d: new Date(anio, mes + 1, celdas.length - offset - ultimo.getDate() + 1), actual: false });
  }
  return celdas;
}

// value y onChange usan formato YYYY-MM-DD internamente
export default function DateInputCL({ value, onChange, style, placeholder }) {
  const hoy  = new Date(); hoy.setHours(0,0,0,0);
  const ref  = useRef(null);

  const parsed = value ? new Date(value + 'T12:00:00') : null;
  const [open,  setOpen]  = useState(false);
  const [mes,   setMes]   = useState(parsed ? parsed.getMonth()    : hoy.getMonth());
  const [anio,  setAnio]  = useState(parsed ? parsed.getFullYear() : hoy.getFullYear());

  // Cierra al hacer clic fuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sincroniza mes/año al cambiar value externo
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00');
      setMes(d.getMonth());
      setAnio(d.getFullYear());
    }
  }, [value]);

  const seleccionar = (fecha) => {
    const y  = fecha.getFullYear();
    const m  = String(fecha.getMonth() + 1).padStart(2, '0');
    const d  = String(fecha.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  const display = parsed
    ? parsed.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  const irAnterior = (e) => {
    e.stopPropagation();
    if (mes === 0) { setMes(11); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  };
  const irSiguiente = (e) => {
    e.stopPropagation();
    if (mes === 11) { setMes(0); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  };

  const celdas = generarCeldas(anio, mes);

  const selectedKey = value || '';
  const hoyKey = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
  const fechaKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Input visible */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...style,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', userSelect: 'none',
          color: display ? 'var(--color-foreground)' : undefined,
          opacity: display ? 1 : undefined,
        }}
      >
        <span style={{ color: display ? 'var(--color-foreground)' : 'var(--color-foreground)', opacity: display ? 1 : 0.4, fontSize: '13px' }}>
          {display || (placeholder || 'DD/MM/AAAA')}
        </span>
        <span style={{ fontSize: '15px', opacity: 0.5 }}>📅</span>
      </div>

      {/* Mini calendario desplegable */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9999,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '14px', padding: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          width: '260px',
        }}>
          {/* Navegación mes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={irAnterior} style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: '7px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-foreground)' }}>{MESES[mes]} {anio}</span>
            <button onClick={irSiguiente} style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: '7px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>

          {/* Cabecera días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {DIAS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, padding: '2px 0' }}>{d}</div>
            ))}
          </div>

          {/* Celdas días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {celdas.map((celda, i) => {
              const key      = fechaKey(celda.d);
              const esHoy    = key === hoyKey;
              const esSel    = key === selectedKey;
              const esActual = celda.actual;
              return (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); seleccionar(celda.d); }}
                  style={{
                    border: 'none', borderRadius: '7px', padding: '5px 2px',
                    fontSize: '12px', fontWeight: esSel || esHoy ? 800 : 500,
                    cursor: 'pointer',
                    background: esSel
                      ? 'var(--color-primary)'
                      : esHoy
                        ? 'rgba(99,102,241,0.12)'
                        : 'transparent',
                    color: esSel
                      ? '#fff'
                      : esHoy
                        ? 'var(--color-primary)'
                        : 'var(--color-foreground)',
                    opacity: esActual ? 1 : 0.3,
                  }}
                >
                  {celda.d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Botón "Hoy" */}
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button onClick={(e) => { e.stopPropagation(); seleccionar(hoy); }}
              style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '5px 16px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: 'var(--color-foreground)' }}>
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
