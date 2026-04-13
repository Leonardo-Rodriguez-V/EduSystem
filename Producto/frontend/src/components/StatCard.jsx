import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtext, icon: Icon, color, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="clay-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '180px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Background Accent Gradient */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '150px',
        height: '150px',
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 800, 
              color: 'var(--color-foreground)', 
              opacity: 0.6,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px'
            }}>
              {title}
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 900, 
              color: 'var(--color-foreground)',
              fontFamily: "'Crimson Pro', serif",
              lineHeight: 1
            }}>
              {value}
            </div>
          </div>
          
          <div style={{ 
            background: `${color}15`, 
            padding: '12px', 
            borderRadius: '16px', 
            color: color,
            boxShadow: `inset 2px 2px 4px ${color}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
        </div>

        <div style={{ 
          marginTop: '32px', 
          fontSize: '12px', 
          fontWeight: 700, 
          color: 'var(--color-foreground)', 
          opacity: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
          {subtext}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
