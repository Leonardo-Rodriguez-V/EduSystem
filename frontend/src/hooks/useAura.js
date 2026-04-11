import { useState, useCallback } from 'react';

const AURA_MESSAGES = {
  director: "Hola Director. ¿Deseas ver un resumen de asistencia hoy o revisar el registro de nuevos usuarios?",
  profesor: "Buen día Profesor. He notado que algunas notas están pendientes. ¿Quieres que las revisemos juntos?",
  apoderado: "Hola. Aquí puedes ver el progreso académico de tu hijo. ¿Deseas ver el último informe de notas?",
  alumno: "¡Hola! No olvides revisar tu calendario escolar para las próximas evaluaciones.",
  default: "Conectado al núcleo de EduSync. ¿En qué puedo asistirte?"
};

export const useAura = (rol = 'alumno') => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: AURA_MESSAGES[rol] || AURA_MESSAGES.default, sender: 'aura', time: new Date() }
  ]);
  const [typing, setTyping] = useState(false);

  const toggleAura = useCallback(() => setIsOpen(prev => !prev), []);

  const addSystemMessage = useCallback((text) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'aura', time: new Date() }]);
    // Abrir automáticamente si llega una notificación importante
    setIsOpen(true);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    // Mensaje del usuario
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user', time: new Date() }]);

    // Simular procesamiento
    setTyping(true);
    
    setTimeout(() => {
      let reply = "Entiendo perfectamente. Estoy consultando esa información en los registros de EduSync...";
      
      const lower = text.toLowerCase();
      if (lower.includes('hola') || lower.includes('buenos')) {
        reply = `¡Hola! Soy Aura, tu asistente virtual. ¿Cómo va tu día en el colegio?`;
      } else if (lower.includes('nota') || lower.includes('calificación')) {
        reply = "He cargado los registros de calificaciones. Veo que el promedio general del curso está estable. ¿Quieres detalles de algún alumno?";
      } else if (lower.includes('asistencia')) {
        reply = "La asistencia de hoy ya está consolidada. Puedes ver el resumen en tu panel principal.";
      } else if (lower.includes('gracias')) {
        reply = "¡De nada! Siempre estoy aquí para facilitar tu trabajo administrativo.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'aura', time: new Date() }]);
      setTyping(false);
    }, 1500);
  }, []);

  return { 
    isOpen, 
    toggleAura, 
    messages, 
    sendMessage, 
    typing, 
    addSystemMessage 
  };
};
