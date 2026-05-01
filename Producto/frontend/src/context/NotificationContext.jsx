import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts,        setToasts]        = useState([]);
  const [hasNew,        setHasNew]        = useState(false);
  const timers = useRef({});

  const addToast = useCallback((notif) => {
    const id = notif.id ?? Date.now();
    setToasts(prev => [{ ...notif, id }, ...prev].slice(0, 5));
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('notification', (data) => {
      const n = { ...data, id: Date.now(), type: 'info' };
      setNotifications(p => [n, ...p]);
      setHasNew(true);
      addToast(n);
    });

    socket.on('new_grade', (data) => {
      const n = { ...data, id: Date.now(), type: 'grade' };
      setNotifications(p => [n, ...p]);
      setHasNew(true);
      addToast(n);
    });

    socket.on('attendance_report', (data) => {
      const n = { ...data, id: Date.now(), type: 'attendance' };
      setNotifications(p => [n, ...p]);
      setHasNew(true);
      addToast(n);
    });

    return () => {
      socket.close();
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, [addToast]);

  const clearNew = useCallback(() => setHasNew(false), []);

  const addNotification = useCallback((message) => {
    const n = { id: Date.now(), mensaje: message, type: 'info' };
    setNotifications(p => [n, ...p]);
    setHasNew(true);
    addToast(n);
  }, [addToast]);

  return (
    <NotificationContext.Provider value={{ notifications, toasts, hasNew, clearNew, addNotification, dismissToast }}>
      {children}
    </NotificationContext.Provider>
  );
};
