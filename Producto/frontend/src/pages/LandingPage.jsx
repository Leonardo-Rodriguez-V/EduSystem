import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import RolesSection from '../components/landing/RolesSection';
import CtaBanner from '../components/landing/CtaBanner';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <RolesSection />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
