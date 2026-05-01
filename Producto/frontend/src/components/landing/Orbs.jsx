const bubbles = [
  { size: 180, top: '8%',  left: '3%',  anim: 'animate-float-1' },
  { size: 90,  top: '18%', left: '14%', anim: 'animate-float-2' },
  { size: 130, top: '38%', left: '2%',  anim: 'animate-float-3' },
  { size: 70,  top: '30%', right: '8%', anim: 'animate-float-2' },
  { size: 110, top: '55%', right: '3%', anim: 'animate-float-1' },
  { size: 60,  top: '70%', left: '8%',  anim: 'animate-float-4' },
  { size: 150, top: '78%', right: '12%',anim: 'animate-float-3' },
  { size: 80,  top: '90%', left: '40%', anim: 'animate-float-2' },
];

export function Orbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Orb glow grandes de fondo */}
      <div className="orb-glow animate-float-1" style={{ width: 400, height: 400, top: -120, left: -120 }} />
      <div className="orb-glow animate-float-3" style={{ width: 360, height: 360, bottom: -140, right: -100 }} />

      {/* Burbujas 3D de cristal */}
      {bubbles.map((b, i) => (
        <div
          key={i}
          className={`bubble ${b.anim}`}
          style={{ width: b.size, height: b.size, top: b.top, left: b.left, right: b.right }}
        />
      ))}
    </div>
  );
}
