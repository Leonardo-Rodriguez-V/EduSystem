import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import RolesSection from '../components/landing/RolesSection';
import CtaBanner from '../components/landing/CtaBanner';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 40%, #1a1a3e 70%, #0f0c29 100%)',
      minHeight: '100vh',
      overflow: 'hidden',
    }}>

      {/* Orbes CSS — z-index 0, detrás del contenido */}
      <div className="orbe orbe-1" />
      <div className="orbe orbe-2" />
      <div className="orbe orbe-3" />
      <div className="orbe orbe-4" />
      <div className="orbe orbe-5" />

      {/* Contenido z-index 1 — siempre encima de los orbes */}
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

