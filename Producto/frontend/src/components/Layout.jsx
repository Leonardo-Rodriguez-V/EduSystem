import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, CheckSquare, Info, X } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  GraduationCap,
  Calendar,
  CalendarDays,
  Bell,
  UserPlus,
  User as UserIcon,
  BookUser,
  Settings,
  NotebookPen
} from 'lucide-react';

// Atomic Components
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuraOrb from './AuraOrb';
import AuraPanel from './AuraPanel';

// Hooks
import { useAura } from '../hooks/useAura';
import { useNotifications } from '../context/NotificationContext';

const NAV_ITEMS = {
  director: [
    { label: 'Dashboard',        icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Gestión Usuarios', icon: Users,           path: '/usuarios' },
    { label: 'Gestión Alumnos', icon: BookUser,        path: '/alumnos' },
    { label: 'Asistencia',       icon: CheckSquare,     path: '/asistencia' },
    { label: 'Notas',            icon: GraduationCap,   path: '/notas' },
    { label: 'Horarios',         icon: Calendar,        path: '/horarios' },
    { label: 'Calendario',       icon: CalendarDays,    path: '/calendario' },
    { label: 'Muro de Avisos',   icon: Bell,            path: '/muro-avisos' },
    { label: 'Anotaciones',      icon: NotebookPen,     path: '/anotaciones' },
    { label: 'Nuevo Usuario',    icon: UserPlus,        path: '/registro' },
    { label: 'Mi Perfil',        icon: Settings,        path: '/perfil' },
  ],
  profesor: [
    { label: 'Dashboard',      icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Asistencia',     icon: CheckSquare,     path: '/asistencia' },
    { label: 'Notas',          icon: GraduationCap,   path: '/notas' },
    { label: 'Horarios',       icon: Calendar,        path: '/horarios' },
    { label: 'Calendario',     icon: CalendarDays,    path: '/calendario' },
    { label: 'Muro de Avisos', icon: Bell,            path: '/muro-avisos' },
    { label: 'Anotaciones',    icon: NotebookPen,     path: '/anotaciones' },
    { label: 'Mi Perfil',      icon: Settings,        path: '/perfil' },
  ],
  apoderado: [
    { label: 'Dashboard',      icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Mi Hijo',        icon: UserIcon,        path: '/notas' },
    { label: 'Notas',          icon: GraduationCap,   path: '/notas-hijo' },
    { label: 'Horarios',       icon: Calendar,        path: '/horarios' },
    { label: 'Calendario',     icon: CalendarDays,    path: '/calendario' },
    { label: 'Muro de Avisos', icon: Bell,            path: '/muro-avisos' },
    { label: 'Anotaciones',    icon: NotebookPen,     path: '/anotaciones' },
    { label: 'Mi Perfil',      icon: Settings,        path: '/perfil' },
  ],
  alumno: [
    { label: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Mis Notas',  icon: GraduationCap,   path: '/notas' },
    { label: 'Horarios',   icon: Calendar,        path: '/horarios' },
    { label: 'Calendario', icon: CalendarDays,    path: '/calendario' },
    { label: 'Mi Perfil',  icon: Settings,        path: '/perfil' },
  ],
};

const TITULO_POR_RUTA = {
  '/dashboard':    'Dashboard',
  '/usuarios':     'Gestión de Usuarios',
  '/asistencia':   'Pasar Lista',
  '/notas':        'Libro de Calificaciones',
  '/horarios':     'Horarios de Clases',
  '/calendario':   'Calendario Escolar',
  '/muro-avisos':  'Muro de Avisos',
  '/notas-hijo':   'Notas del Estudiante',
  '/registro':     'Registro de Usuarios',
  '/alumnos':      'Gestión de Alumnos',
  '/perfil':       'Mi Perfil',
  '/anotaciones':  'Libro de Anotaciones',
};

function iniciales(nombre = '') {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

export default function Layout({ children }) {
  const location = useLocation();
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [tema, setTema] = useState(localStorage.getItem('theme') || 'light');
  const lastNotifId = useRef(null);

  useEffect(() => {
    if (tema === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', tema);
  }, [tema]);

  const toggleTema = () => setTema(t => t === 'light' ? 'dark' : 'light');

  const usuario = (() => {
    try { 
      const u = localStorage.getItem('usuario');
      return u ? JSON.parse(u) : { rol: 'invitado', nombre_completo: 'Usuario' }; 
    } catch { return { rol: 'invitado', nombre_completo: 'Usuario' }; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const navItems = NAV_ITEMS[usuario?.rol] || [];
  const tituloPagina = TITULO_POR_RUTA[location.pathname] || 'EduSync';

  const { notifications, toasts, hasNew, clearNew, dismissToast } = useNotifications();
  const { 
    isOpen: auraOpen, 
    toggleAura, 
    messages: auraMessages, 
    sendMessage: sendAuraMessage, 
    typing: isAuraTyping,
    addSystemMessage 
  } = useAura(usuario?.rol);

  // Sincronizar notificaciones reales con el chat de Aura
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest.id !== lastNotifId.current) {
        lastNotifId.current = latest.id;
        addSystemMessage(latest.mensaje);
      }
    }
  }, [notifications, addSystemMessage]);

  const handleToggleAura = () => {
    if (hasNew) clearNew();
    toggleAura();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background)', transition: 'background 0.3s' }}>
      
      <Sidebar 
        sidebarAbierto={sidebarAbierto}
        usuario={usuario}
        navItems={navItems}
        handleLogout={handleLogout}
        iniciales={iniciales}
      />

      <div style={{ 
        marginLeft: sidebarAbierto ? '280px' : '0', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>

        <Topbar
          sidebarAbierto={sidebarAbierto}
          setSidebarAbierto={setSidebarAbierto}
          tema={tema}
          toggleTema={toggleTema}
          tituloPagina={tituloPagina}
          notifications={notifications}
          hasNew={hasNew}
          clearNew={clearNew}
        />

        <main style={{ padding: '0 32px 32px' }}>
          <motion.div
            key={location.pathname}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {children}
          </motion.div>
        </main>

        <footer style={{ 
          textAlign: 'center', 
          padding: '24px', 
          color: 'var(--color-foreground)', 
          opacity: 0.4,
          fontSize: '11px', 
          fontWeight: 600,
          background: 'transparent',
          letterSpacing: '0.02em'
        }}>
          EDU SYNC 2026 — SISTEMA DE GESTIÓN EDUCATIVA PREMIUM
        </footer>
      </div>

      <AuraOrb onClick={handleToggleAura} hasNotification={hasNew} />
      <AuraPanel
        isOpen={auraOpen}
        onClose={toggleAura}
        messages={auraMessages}
        sendMessage={sendAuraMessage}
        typing={isAuraTyping}
      />

      {/* Toasts de notificaciones en tiempo real */}
      <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column-reverse', gap: '10px' }}>
        <AnimatePresence>
          {toasts.map(toast => {
            const tipo = toast.type === 'grade'
              ? { icon: GraduationCap, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' }
              : toast.type === 'attendance'
              ? { icon: CheckSquare,   color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' }
              : { icon: Info,          color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.3)' };
            const Icono = tipo.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: -40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: 'var(--color-surface)',
                  border: `1px solid ${tipo.border}`,
                  borderLeft: `4px solid ${tipo.color}`,
                  borderRadius: '16px',
                  padding: '12px 16px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  maxWidth: '320px', minWidth: '260px',
                }}
              >
                <div style={{ background: tipo.bg, borderRadius: '8px', padding: '7px', flexShrink: 0 }}>
                  <Icono size={16} color={tipo.color} />
                </div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', flex: 1, lineHeight: 1.4 }}>
                  {toast.mensaje}
                </p>
                <button
                  onClick={() => dismissToast(toast.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-foreground)', opacity: 0.4, flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
