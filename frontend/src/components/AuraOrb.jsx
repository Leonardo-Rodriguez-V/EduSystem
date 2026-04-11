import { motion } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';

const AuraOrb = ({ onClick }) => {
  const { hasNew, clearNew } = useNotifications();

  const handleClick = () => {
    clearNew();
    onClick();
  };

  return (
    <motion.div 
      className={`aura-orb ${hasNew ? 'aura-pulse' : ''}`}
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, rotate: 10, boxShadow: '0 15px 35px -5px rgba(79, 70, 229, 0.6)' }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'fixed', bottom: '32px', right: '32px',
        width: '64px', height: '64px', borderRadius: '50%',
        cursor: 'pointer', zIndex: 1000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', border: '3px solid rgba(255, 255, 255, 0.2)',
        boxShadow: hasNew 
          ? '0 0 20px 5px rgba(79, 70, 229, 0.8)' 
          : '0 10px 25px -5px rgba(79, 70, 229, 0.5)',
      }}
    >
      <div style={{ fontWeight: 900, fontSize: '11px', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
        AURA
      </div>
      
      {/* Notification Badge */}
      {hasNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute', top: '0', right: '0',
            width: '18px', height: '18px', borderRadius: '50%',
            background: 'var(--color-destructive)', border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      )}
    </motion.div>
  );
};

export default AuraOrb;
