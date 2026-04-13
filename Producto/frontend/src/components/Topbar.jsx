import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';

const Topbar = ({ 
  sidebarAbierto, 
  setSidebarAbierto, 
  tema, 
  toggleTema, 
  tituloPagina 
}) => {
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
        transition: 'all 0.3s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => setSidebarAbierto(!sidebarAbierto)}
          style={{ 
            background: 'var(--color-surface)', 
            border: 'none', 
            padding: '8px', 
            borderRadius: '12px', 
            cursor: 'pointer', 
            boxShadow: 'var(--clay-shadow)', 
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {sidebarAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: 800, 
          color: 'var(--color-foreground)', 
          margin: 0,
          fontFamily: "'Crimson Pro', serif"
        }}>
          {tituloPagina}
        </h2>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Theme Toggle Button */}
        <motion.button
          onClick={toggleTema}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'var(--color-surface)',
            border: 'none',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: 'var(--clay-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tema === 'light' ? '#f59e0b' : '#818cf8'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={tema}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {tema === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Date Display */}
        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '8px 16px', 
          borderRadius: '12px', 
          boxShadow: 'var(--clay-shadow)',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--color-primary)',
          textTransform: 'capitalize'
        }}>
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
