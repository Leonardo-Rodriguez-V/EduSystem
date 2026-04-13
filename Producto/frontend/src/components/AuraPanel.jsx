import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Command, Send } from 'lucide-react';

const AuraPanel = ({ isOpen, onClose, messages, sendMessage, typing }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
          className="glass-premium"
          style={{
            position: 'fixed', bottom: '100px', right: '32px',
            width: '360px', borderRadius: '32px', zIndex: 1001,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            height: '500px', overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="aura-orb" style={{ width: '12px', height: '12px', borderRadius: '50%' }}></div>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-primary)', letterSpacing: '0.1em' }}>AURA CONCIERGE</span>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-foreground)', opacity: 0.5 }}>
              <X size={18} />
            </button>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: msg.sender === 'aura' ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'aura' ? '20px 20px 20px 4px' : '20px 20px 4px 20px',
                  background: msg.sender === 'aura' ? 'var(--color-muted)' : 'var(--color-primary)',
                  color: msg.sender === 'aura' ? 'var(--color-foreground)' : 'white',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
                }}
              >
                {msg.text}
              </motion.div>
            ))}
            {typing && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--color-muted)', padding: '12px 16px', borderRadius: '20px 20px 20px 4px', fontSize: '13px', display: 'flex', gap: '4px' }}>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pregúntame sobre el colegio..."
                style={{
                  width: '100%',
                  background: 'var(--color-surface)',
                  border: 'none',
                  padding: '14px 48px 14px 20px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  boxShadow: 'var(--clay-shadow)',
                  color: 'var(--color-foreground)'
                }}
              />
              <button 
                onClick={handleSend}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'var(--color-primary)',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuraPanel;
