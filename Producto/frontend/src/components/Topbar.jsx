import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Bell, GraduationCap, CheckSquare, Info } from 'lucide-react';

const TIPO_ICONO = {
  grade:      { icon: GraduationCap, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  attendance: { icon: CheckSquare,   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  info:       { icon: Info,          color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
};

const Topbar = ({
  sidebarAbierto,
  setSidebarAbierto,
  tema,
  toggleTema,
  tituloPagina,
  notifications = [],
  hasNew,
  clearNew,
}) => {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const ref = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setDropdownAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBell = () => {
    setDropdownAbierto(v => !v);
    if (hasNew) clearNew();
  };

  const recientes = notifications.slice(0, 8);

  return (
    <header
      className="glass-premium"
      style={{
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 20,
        margin: '0 24px 24px',
        borderRadius: '24px',
        zIndex: 50,
        transition: 'all 0.3s',
      }}
    >
      {/* Izquierda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => setSidebarAbierto(!sidebarAbierto)}
          style={{
            background: 'var(--color-surface)', border: 'none', padding: '8px',
            borderRadius: '12px', cursor: 'pointer', boxShadow: 'var(--clay-shadow)',
            color: 'var(--color-primary)', display: 'flex', alignItems: 'center',
          }}
        >
          {sidebarAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h2 style={{
          fontSize: '20px', fontWeight: 800, color: 'var(--color-foreground)',
          margin: 0, fontFamily: "'Crimson Pro', serif",
        }}>
          {tituloPagina}
        </h2>
      </div>

      {/* Derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Campana de notificaciones */}
        <div ref={ref} style={{ position: 'relative' }}>
          <motion.button
            onClick={handleBell}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            style={{
              background: 'var(--color-surface)', border: 'none',
              width: '40px', height: '40px', borderRadius: '12px',
              cursor: 'pointer', boxShadow: 'var(--clay-shadow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary)', position: 'relative',
            }}
          >
            <Bell size={20} />
            {hasNew && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{
                  position: 'absolute', top: '6px', right: '6px',
                  width: '9px', height: '9px', borderRadius: '50%',
                  background: '#ef4444', border: '2px solid var(--color-surface)',
                }}
              />
            )}
          </motion.button>

          {/* Dropdown */}
          <AnimatePresence>
            {dropdownAbierto && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: '320px', background: 'var(--color-surface)',
                  borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                  border: '1px solid var(--color-border)', overflow: 'hidden', zIndex: 200,
                }}
              >
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-foreground)' }}>Notificaciones</span>
                  {notifications.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '8px' }}>
                      {notifications.length} total
                    </span>
                  )}
                </div>

                {recientes.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--color-foreground)', opacity: 0.4, fontSize: '13px', fontWeight: 600 }}>
                    Sin notificaciones
                  </div>
                ) : (
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {recientes.map((n, i) => {
                      const tipo = TIPO_ICONO[n.type] ?? TIPO_ICONO.info;
                      const Icono = tipo.icon;
                      return (
                        <div key={n.id ?? i} style={{
                          display: 'flex', gap: '12px', padding: '12px 20px',
                          borderBottom: i < recientes.length - 1 ? '1px solid var(--color-border)' : 'none',
                          alignItems: 'flex-start',
                        }}>
                          <div style={{ background: tipo.bg, borderRadius: '10px', padding: '8px', flexShrink: 0 }}>
                            <Icono size={15} color={tipo.color} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', lineHeight: 1.4 }}>
                              {n.mensaje}
                            </p>
                            {n.type === 'grade' && n.calificacion && (
                              <span style={{ fontSize: '11px', color: tipo.color, fontWeight: 700 }}>
                                Nota: {parseFloat(n.calificacion).toFixed(1)}
                              </span>
                            )}
                            {n.type === 'attendance' && n.presentes != null && (
                              <span style={{ fontSize: '11px', color: tipo.color, fontWeight: 700 }}>
                                {n.presentes}/{n.totales} presentes
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <motion.button
          onClick={toggleTema}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'var(--color-surface)', border: 'none',
            width: '40px', height: '40px', borderRadius: '12px',
            cursor: 'pointer', boxShadow: 'var(--clay-shadow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tema === 'light' ? '#f59e0b' : '#818cf8',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={tema}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {tema === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Fecha */}
        <div style={{
          background: 'var(--color-surface)', padding: '8px 16px', borderRadius: '12px',
          boxShadow: 'var(--clay-shadow)', fontSize: '12px', fontWeight: 700,
          color: 'var(--color-primary)', textTransform: 'capitalize',
        }}>
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
