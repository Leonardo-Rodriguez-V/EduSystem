import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactoSection() {
  return (
    <section id="contacto" className="landing-section" style={{ position: 'relative', zIndex: 10, padding: '80px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 16, fontWeight: 700, fontFamily: "'Crimson Pro', serif" }}>
          Ponte en Contacto
        </h2>
        <p className="text-translucent" style={{ fontSize: '1.1rem', marginBottom: 48 }}>
          ¿Tienes preguntas sobre cómo EduSystem puede transformar tu colegio? Estamos aquí para ayudarte.
        </p>

        <div className="glass" style={{ padding: '40px', borderRadius: 24, textAlign: 'left' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail color="#818cf8" size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>Email</h3>
              <p className="text-translucent" style={{ margin: 0 }}>contacto@edusystem.com</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone color="#818cf8" size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>Teléfono</h3>
              <p className="text-translucent" style={{ margin: 0 }}>+56 9 1234 5678</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin color="#818cf8" size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>Ubicación</h3>
              <p className="text-translucent" style={{ margin: 0 }}>Santiago, Chile</p>
            </div>
            
          </div>

          <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <button className="btn-primary" style={{ padding: '12px 32px', fontSize: '1.1rem' }} onClick={() => window.location.href = 'mailto:contacto@edusystem.com'}>
              Enviar un Mensaje
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
