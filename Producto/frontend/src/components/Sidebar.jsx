import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';

const Sidebar = ({
  sidebarAbierto,
  setSidebarAbierto,
  isMobile,
  usuario,
  navItems,
  handleLogout,
  iniciales,
}) => {
  const location = useLocation();

  const handleNavClick = () => {
    if (isMobile) setSidebarAbierto(false);
  };

  return (
    <AnimatePresence>
      {sidebarAbierto && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: 'var(--color-surface)',
            width: isMobile ? 'min(280px, 85vw)' : '280px',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100,
            boxShadow: 'var(--clay-shadow)',
            borderRight: '4px solid var(--color-surface)',
            overflow: 'hidden',
          }}
        >
          {/* Logo */}
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{
              fontSize: '28px', fontWeight: 900,
              color: 'var(--color-primary)', fontFamily: "'Crimson Pro', serif",
              letterSpacing: '-1px',
            }}>
              EduSync
            </div>
            <div style={{
              fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
              color: 'var(--color-accent)', letterSpacing: '2px', marginTop: '4px',
            }}>
              Plataforma Educativa
            </div>
          </div>

          {/* User Profile Summary */}
          <div style={{ padding: '0 20px 24px' }}>
            <div className="clay-card" style={{ padding: '16px', background: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '12px', border: 'none' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: 'var(--color-primary)', fontSize: '14px',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.05)', flexShrink: 0,
              }}>
                {iniciales(usuario?.nombre_completo)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {usuario?.nombre_completo}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.6 }}>{usuario?.rol}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
            {navItems.map((item) => {
              const activo = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <motion.div key={item.path} whileHover={{ x: 8 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: '16px',
                      textDecoration: 'none',
                      color: activo ? 'white' : 'var(--color-foreground)',
                      opacity: activo ? 1 : 0.7,
                      fontSize: '14px', fontWeight: 700,
                      background: activo ? 'var(--color-primary)' : 'transparent',
                      marginBottom: '4px',
                      transition: 'all 0.2s ease',
                      boxShadow: activo ? 'var(--clay-shadow)' : 'none',
                    }}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: '20px' }}>
            <button
              onClick={handleLogout}
              className="clay-card"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '12px', cursor: 'pointer', border: 'none',
                color: 'var(--color-destructive)', fontWeight: 800, fontSize: '13px',
              }}
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
