import { motion } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import RolesSection from '../components/landing/RolesSection';
import CtaBanner from '../components/landing/CtaBanner';
import Footer from '../components/landing/Footer';

/* Orbes globales que flotan en todo el fondo de la landing */
const GLOBAL_ORBS = [
  { w: 600, h: 600, top: '2%',   left: '-8%',   color: 'rgba(79,70,229,0.22)',   delay: 0   },
  { w: 500, h: 500, top: '30%',  right: '-6%',   color: 'rgba(129,140,248,0.18)', delay: 2   },
  { w: 400, h: 400, top: '55%',  left: '30%',    color: 'rgba(234,88,12,0.09)',   delay: 4   },
  { w: 450, h: 450, top: '75%',  left: '-5%',    color: 'rgba(79,70,229,0.15)',   delay: 1   },
  { w: 350, h: 350, top: '88%',  right: '10%',   color: 'rgba(129,140,248,0.12)', delay: 3   },
];

export default function LandingPage() {
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 40%, #1a1a3e 70%, #0f0c29 100%)',
      minHeight: '100vh',
      overflow: 'hidden',
    }}>

      {/* Orbes flotantes globales — visibles en TODAS las secciones */}
      {GLOBAL_ORBS.map((orb, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 7 + i, repeat: Infinity, delay: orb.delay, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: orb.w, height: orb.h,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            top: orb.top, left: orb.left, right: orb.right,
            filter: 'blur(50px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}

      {/* Contenido por encima de los orbes */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <RolesSection />
          <CtaBanner />
        </main>
        <Footer />
      </div>
    </div>
  );
}

