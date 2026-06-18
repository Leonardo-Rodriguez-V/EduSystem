import { useState, useCallback, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const SALUDO_INICIAL = {
  director:  'Hola Director. Soy AURA, tu asistente de EduSync. Puedo consultar datos reales de asistencia, notas y alumnos. ¿En qué te ayudo?',
  profesor:  'Buen día Profesor. Soy AURA. Puedo ayudarte con ejercicios, planificaciones y datos de tus cursos. ¿Qué necesitas?',
  apoderado: 'Hola. Soy AURA, asistente de EduSync. Puedo orientarte sobre el progreso académico y asistencia de tu hijo. ¿Cómo te ayudo?',
  alumno:    '¡Hola! Soy AURA. Puedo responder dudas sobre materias, horarios y evaluaciones. ¿En qué puedo ayudarte?',
  default:   'Conectado al núcleo de EduSync. ¿En qué puedo asistirte?',
};

const STATUS_MESSAGES = [
  'Consultando base de datos...',
  'Analizando información...',
  'Generando respuesta...',
];

const crearSaludo = (rol) => ({
  id: 'saludo',
  text: SALUDO_INICIAL[rol] || SALUDO_INICIAL.default,
  sender: 'aura',
  time: new Date(),
});

export const useAura = (rol = 'alumno') => {
  const [isOpen, setIsOpen]           = useState(false);
  const [messages, setMessages]       = useState([crearSaludo(rol)]);
  const [typingStatus, setTypingStatus] = useState(null); // string | null
  const [loading, setLoading]         = useState(true);
  const statusTimerRef                = useRef(null);

  // ── Cargar historial + resumen diario al montar ────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    const init = async () => {
      try {
        // 1. Historial persistido en BD
        const r = await fetch(`${API_URL}/aura/historial`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = r.ok ? await r.json() : null;
        const historialMsgs = (data?.historial || []).map((m, i) => ({
          id: `hist-${i}`,
          text: m.content,
          sender: m.role === 'user' ? 'user' : 'aura',
          time: new Date(m.created_at),
          fromHistorial: true,
        }));

        const mensajesBase = [crearSaludo(rol), ...historialMsgs];

        // 2. Resumen diario (solo si no se mostró hoy y el rol lo amerita)
        const usuario    = JSON.parse(localStorage.getItem('usuario') || '{}');
        const hoy        = new Date().toLocaleDateString('es-CL');
        const resumenKey = `aura_resumen_${usuario.id}_${hoy}`;
        const rolesConResumen = ['director', 'profesor', 'apoderado'];

        if (!localStorage.getItem(resumenKey) && rolesConResumen.includes(rol)) {
          const rr = await fetch(`${API_URL}/aura/resumen-diario`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (rr.ok) {
            const { resumen } = await rr.json();
            if (resumen) {
              mensajesBase.push({
                id: 'resumen-diario',
                text: resumen,
                sender: 'aura',
                time: new Date(),
                isResumen: true,
              });
              localStorage.setItem(resumenKey, '1');
            }
          }
        }

        setMessages(mensajesBase);
      } catch {
        // Mantiene el saludo si algo falla
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [rol]);

  // ── Controles del panel ────────────────────────────────────────────────────
  const toggleAura = useCallback(() => setIsOpen(prev => !prev), []);

  const addSystemMessage = useCallback((text) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'aura', time: new Date() }]);
    setIsOpen(true);
  }, []);

  // ── Enviar mensaje con streaming SSE ──────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMsgId   = Date.now();
    const streamMsgId = userMsgId + 1;

    // Agrega mensaje del usuario y placeholder vacío para la respuesta
    setMessages(prev => [
      ...prev,
      { id: userMsgId,   text, sender: 'user', time: new Date() },
      { id: streamMsgId, text: '',   sender: 'aura', time: new Date() },
    ]);

    // Inicia rotación de estados
    let si = 0;
    setTypingStatus(STATUS_MESSAGES[0]);
    statusTimerRef.current = setInterval(() => {
      si = (si + 1) % STATUS_MESSAGES.length;
      setTypingStatus(STATUS_MESSAGES[si]);
    }, 1500);

    try {
      const token = localStorage.getItem('token');
      let respondido = false;

      // ── Intento 1: streaming SSE ───────────────────────────────────────────
      try {
        const res = await fetch(`${API_URL}/aura/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mensaje: text }),
        });

        if (res.ok && res.body && res.headers.get('content-type')?.includes('text/event-stream')) {
          const reader  = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer      = '';
          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') break;
              try {
                const parsed = JSON.parse(raw);
                if (parsed.token) {
                  accumulated += parsed.token;
                  setMessages(prev => prev.map(m =>
                    m.id === streamMsgId ? { ...m, text: accumulated } : m
                  ));
                }
              } catch { /* chunk inválido */ }
            }
          }

          if (accumulated) { respondido = true; }
        }
      } catch { /* stream no disponible, cae al fallback */ }

      // ── Intento 2: endpoint clásico (fallback) ────────────────────────────
      if (!respondido) {
        const res = await fetch(`${API_URL}/aura/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mensaje: text }),
        });
        const data = await res.json();
        const respuesta = data.respuesta || data.error || 'No pude obtener una respuesta.';
        setMessages(prev => prev.map(m =>
          m.id === streamMsgId ? { ...m, text: respuesta } : m
        ));
      }

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === streamMsgId
          ? { ...m, text: 'Error de conexión con AURA. Verifica que el servidor esté activo.' }
          : m
      ));
    } finally {
      clearInterval(statusTimerRef.current);
      setTypingStatus(null);
    }
  }, []);

  // ── Limpiar historial ──────────────────────────────────────────────────────
  const clearHistorial = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/aura/historial`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      // También limpia la clave del resumen de hoy para que se regenere
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const hoy     = new Date().toLocaleDateString('es-CL');
      localStorage.removeItem(`aura_resumen_${usuario.id}_${hoy}`);
      setMessages([crearSaludo(rol)]);
    } catch { /* fallo silencioso */ }
  }, [rol]);

  return { isOpen, toggleAura, messages, sendMessage, typingStatus, addSystemMessage, clearHistorial, loading };
};
