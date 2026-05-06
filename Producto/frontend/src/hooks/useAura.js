import { useState, useCallback, useRef } from 'react';

const SALUDO_INICIAL = {
  director:  'Hola Director. Soy AURA, tu asistente de EduSync. Puedo consultar datos reales de asistencia, notas y alumnos. ¿En qué te ayudo?',
  profesor:  'Buen día Profesor. Soy AURA. Puedo ayudarte con ejercicios, planificaciones y datos de tus cursos. ¿Qué necesitas?',
  apoderado: 'Hola. Soy AURA, asistente de EduSync. Puedo orientarte sobre el progreso académico y asistencia de tu hijo. ¿Cómo te ayudo?',
  alumno:    '¡Hola! Soy AURA. Puedo responder dudas sobre materias, horarios y evaluaciones. ¿En qué puedo ayudarte?',
  default:   'Conectado al núcleo de EduSync. ¿En qué puedo asistirte?',
};

export const useAura = (rol = 'alumno') => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: SALUDO_INICIAL[rol] || SALUDO_INICIAL.default, sender: 'aura', time: new Date() },
  ]);
  const [typing, setTyping] = useState(false);
  const historialRef = useRef([]);

  const toggleAura = useCallback(() => setIsOpen(prev => !prev), []);

  const addSystemMessage = useCallback((text) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'aura', time: new Date() }]);
    setIsOpen(true);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const msgUsuario = { id: Date.now(), text, sender: 'user', time: new Date() };
    setMessages(prev => [...prev, msgUsuario]);
    setTyping(true);

    // Historial para el backend (últimos 12 mensajes antes del nuevo)
    const historialParaApi = historialRef.current.slice(-12);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/aura/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mensaje: text, historial: historialParaApi }),
      });

      const data = await res.json();
      const respuesta = data.respuesta || data.error || 'No pude obtener una respuesta.';

      const msgAura = { id: Date.now() + 1, text: respuesta, sender: 'aura', time: new Date() };
      setMessages(prev => [...prev, msgAura]);

      // Actualizar historial interno
      historialRef.current = [
        ...historialRef.current,
        { sender: 'user', text },
        { sender: 'aura', text: respuesta },
      ].slice(-20);

    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: 'Error de conexión con AURA. Verifica que el servidor esté activo.', sender: 'aura', time: new Date() },
      ]);
    } finally {
      setTyping(false);
    }
  }, []);

  return { isOpen, toggleAura, messages, sendMessage, typing, addSystemMessage };
};
