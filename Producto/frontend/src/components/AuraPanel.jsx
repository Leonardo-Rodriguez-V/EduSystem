import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';

// ── Quick prompts por rol ─────────────────────────────────────────────────────
const QUICK_PROMPTS = {
  director: [
    '¿Quiénes están en riesgo académico?',
    'Promedio general por curso',
    '¿Cuántos alumnos con baja asistencia?',
    'Resumen del colegio',
  ],
  profesor: [
    '¿Quiénes tienen peores notas?',
    '¿Quién tiene menor asistencia?',
    'Genera 5 ejercicios de matemática',
    '¿Cuántos alumnos reprobados?',
  ],
  apoderado: [
    '¿Cómo está mi hijo/a?',
    '¿Cuáles son sus notas?',
    '¿Cuántas faltas tiene?',
    'Resumen de su rendimiento',
  ],
  alumno: [
    '¿Cuál es mi promedio?',
    '¿Cómo estoy en asistencia?',
    'Explícame la fotosíntesis',
    'Ejercicios de álgebra',
  ],
};

// ── Separadores de fecha ──────────────────────────────────────────────────────
function getDayLabel(dateInput) {
  const date = new Date(dateInput);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString())     return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
}

// ── Markdown básico ───────────────────────────────────────────────────────────
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function renderMarkdown(text) {
  if (!text) return null;
  const result = [];
  let listItems = [];

  const flushList = (key) => {
    if (!listItems.length) return;
    result.push(
      <ul key={`ul-${key}`} style={{ margin: '4px 0', paddingLeft: '18px', lineHeight: 1.65 }}>
        {listItems.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
      </ul>
    );
    listItems = [];
  };

  text.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (t.match(/^#{1,3} /)) {
      flushList(i);
      result.push(
        <strong key={i} style={{ display: 'block', marginTop: '6px', marginBottom: '2px' }}>
          {renderInline(t.replace(/^#{1,3} /, ''))}
        </strong>
      );
    } else if (t.match(/^[-*•] /)) {
      listItems.push(t.replace(/^[-*•] /, ''));
    } else if (t === '') {
      flushList(i);
    } else {
      flushList(i);
      result.push(
        <span key={i} style={{ display: 'block', lineHeight: 1.65 }}>
          {renderInline(t)}
        </span>
      );
    }
  });
  flushList('end');
  return result;
}

// ── Componente principal ──────────────────────────────────────────────────────
const AuraPanel = ({
  isOpen, onClose,
  messages, sendMessage, typingStatus,
  rol = 'alumno', clearHistorial,
}) => {
  const [inputText, setInputText]   = useState('');
  const [copiedId, setCopiedId]     = useState(null);
  const [hoveredId, setHoveredId]   = useState(null);
  const [expanded, setExpanded]     = useState(false);
  const scrollRef                   = useRef(null);
  const quickPrompts                = QUICK_PROMPTS[rol] || QUICK_PROMPTS.alumno;
  const conversacionActiva          = messages.some(m => m.sender === 'user');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingStatus]);

  const handleSend = (texto) => {
    const msg = texto ?? inputText;
    if (!msg.trim()) return;
    sendMessage(msg);
    setInputText('');
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Insertar separadores de día entre mensajes
  const messagesConSeps = [];
  let ultimoDia = null;
  messages.forEach(msg => {
    const dia = msg.time ? new Date(msg.time).toDateString() : null;
    if (dia && dia !== ultimoDia) {
      messagesConSeps.push({ isSep: true, label: getDayLabel(msg.time), key: `sep-${dia}` });
      ultimoDia = dia;
    }
    messagesConSeps.push(msg);
  });

  const panelWidth = expanded ? '620px' : '380px';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="glass-premium"
          style={{
            position: 'fixed', bottom: '100px', right: '32px',
            width: panelWidth,
            borderRadius: '32px', zIndex: 1001,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            height: '520px', overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="aura-orb" style={{ width: '12px', height: '12px', borderRadius: '50%' }} />
              <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-primary)', letterSpacing: '0.1em' }}>
                AURA CONCIERGE
              </span>
            </div>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              {/* Expandir / contraer */}
              <HeaderBtn onClick={() => setExpanded(e => !e)} title={expanded ? 'Contraer' : 'Expandir'}>
                {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </HeaderBtn>
              {/* Limpiar historial */}
              {clearHistorial && (
                <HeaderBtn onClick={clearHistorial} title="Limpiar conversación">
                  <Trash2 size={14} />
                </HeaderBtn>
              )}
              {/* Cerrar */}
              <HeaderBtn onClick={onClose} title="Cerrar">
                <X size={16} />
              </HeaderBtn>
            </div>
          </div>

          {/* ── Mensajes ── */}
          <div
            ref={scrollRef}
            style={{
              flex: 1, padding: '16px 18px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}
          >
            {messagesConSeps.map((item) => {
              // Separador de día
              if (item.isSep) {
                return (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    margin: '6px 0', opacity: 0.45,
                  }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-foreground)', opacity: 0.2 }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--color-foreground)' }}>
                      {item.label}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-foreground)', opacity: 0.2 }} />
                  </div>
                );
              }

              // Mensaje normal
              const msg = item;
              const isAura = msg.sender === 'aura';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  onMouseEnter={() => setHoveredId(msg.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ alignSelf: isAura ? 'flex-start' : 'flex-end', maxWidth: '88%', position: 'relative' }}
                >
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isAura ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                    background: isAura ? 'var(--color-muted)' : 'var(--color-primary)',
                    color: isAura ? 'var(--color-foreground)' : 'white',
                    fontSize: '13px', fontWeight: 500, lineHeight: 1.55,
                    boxShadow: !isAura ? '0 4px 12px rgba(79,70,229,0.25)' : 'none',
                  }}>
                    {isAura ? renderMarkdown(msg.text) : msg.text}

                    {/* Botón copiar (solo en mensajes de AURA con texto) */}
                    {isAura && msg.text && hoveredId === msg.id && (
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        title="Copiar respuesta"
                        style={{
                          marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: copiedId === msg.id ? '#10b981' : 'var(--color-foreground)',
                          opacity: 0.55, fontSize: '11px', fontWeight: 700, padding: 0,
                        }}
                      >
                        {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                        {copiedId === msg.id ? '¡Copiado!' : 'Copiar'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Indicador de typing con estado rotativo */}
            {typingStatus && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: 'flex-start',
                  background: 'var(--color-muted)',
                  padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay }}
                      style={{ display: 'block', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-primary)' }}
                    />
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={typingStatus}
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 0.6, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.25 }}
                    style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)' }}
                  >
                    {typingStatus}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* ── Quick prompts (solo si no hay conversación activa) ── */}
          {!conversacionActiva && (
            <div style={{
              padding: '0 16px 10px',
              display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0,
            }}>
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  style={{
                    background: 'var(--color-muted)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: '20px', padding: '5px 11px',
                    fontSize: '11.5px', fontWeight: 600,
                    color: 'var(--color-primary)', cursor: 'pointer',
                    whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--color-muted)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          <div style={{
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.05)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Pregúntame sobre el colegio..."
                disabled={!!typingStatus}
                style={{
                  width: '100%',
                  background: 'var(--color-surface)', border: 'none',
                  padding: '13px 48px 13px 18px', borderRadius: '14px',
                  fontSize: '13px', fontWeight: 600, outline: 'none',
                  boxShadow: 'var(--clay-shadow)', color: 'var(--color-foreground)',
                  opacity: typingStatus ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!!typingStatus || !inputText.trim()}
                style={{
                  position: 'absolute', right: '8px',
                  background: typingStatus ? 'rgba(99,102,241,0.4)' : 'var(--color-primary)',
                  border: 'none', width: '34px', height: '34px', borderRadius: '10px',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: typingStatus ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                  transition: 'background 0.2s',
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Botón pequeño para el header
function HeaderBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--color-foreground)', opacity: 0.45,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px', borderRadius: '8px',
        transition: 'opacity 0.15s, background 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.45'; e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

export default AuraPanel;
