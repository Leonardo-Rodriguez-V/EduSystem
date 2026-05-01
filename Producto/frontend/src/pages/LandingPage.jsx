import { Orbs } from '../components/landing/Orbs';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import RolesSection from '../components/landing/RolesSection';
import CtaBanner from '../components/landing/CtaBanner';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="landing-root">
      {/* Burbujas 3D + orb-glow — position: fixed, siempre detrás */}
      <Orbs />

      {/* Contenido — z-index 1 encima de los orbes */}
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
