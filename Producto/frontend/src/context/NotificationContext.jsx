import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    // Conectar al servidor socket
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Escuchar evento general
    newSocket.on('notification', (data) => {
      setNotifications(prev => [data, ...prev]);
      setHasNew(true);
    });

    // Escuchar nuevas notas
    newSocket.on('new_grade', (data) => {
      const msg = { ...data, id: Date.now(), type: 'grade' };
      setNotifications(prev => [msg, ...prev]);
      setHasNew(true);
    });

    // Escuchar reportes de asistencia
    newSocket.on('attendance_report', (data) => {
      const msg = { ...data, id: Date.now(), type: 'attendance' };
      setNotifications(prev => [msg, ...prev]);
      setHasNew(true);
    });

    return () => newSocket.close();
  }, []);

  const clearNew = useCallback(() => {
    setHasNew(false);
  }, []);

  const addNotification = useCallback((message) => {
    const notification = { id: Date.now(), mensaje: message, time: new Date() };
    setNotifications(prev => [notification, ...prev]);
    setHasNew(true);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, hasNew, clearNew, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
