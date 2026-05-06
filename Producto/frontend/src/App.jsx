import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Registro from './pages/Registro';
import Asistencia from './pages/Asistencia';
import Notas from './pages/Notas';
import MuroAvisos from './pages/MuroAvisos';
import Horarios from './pages/Horarios';
import Calendario from './pages/Calendario';
import PortalApoderado from './pages/PortalApoderado';
import NotasHijo from './pages/NotasHijo';
import Alumnos from './pages/Alumnos';
import Perfil from './pages/Perfil';
import Anotaciones from './pages/Anotaciones';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  const usuario = (() => {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
  })();

  return (
    <NotificationProvider>
      <Router>
        <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas con sidebar */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/asistencia" element={
          <ProtectedRoute allowedRoles={['director', 'profesor']}>
            <Layout><Asistencia /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/notas" element={
          <ProtectedRoute allowedRoles={['director', 'profesor', 'apoderado']}>
            <Layout>
              {usuario?.rol === 'apoderado' ? <PortalApoderado /> : <Notas />}
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/horarios" element={
          <ProtectedRoute allowedRoles={['director', 'profesor', 'apoderado']}>
            <Layout><Horarios /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/calendario" element={
          <ProtectedRoute allowedRoles={['director', 'profesor', 'apoderado']}>
            <Layout><Calendario /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/muro-avisos" element={
          <ProtectedRoute allowedRoles={['director', 'profesor', 'apoderado']}>
            <Layout><MuroAvisos /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/notas-hijo" element={
          <ProtectedRoute allowedRoles={['apoderado']}>
            <Layout><NotasHijo /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/usuarios" element={
          <ProtectedRoute allowedRoles={['director']}>
            <Layout><Usuarios /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/alumnos" element={
          <ProtectedRoute allowedRoles={['director']}>
            <Layout><Alumnos /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/registro" element={
          <ProtectedRoute allowedRoles={['director']}>
            <Layout><Registro /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/perfil" element={
          <ProtectedRoute>
            <Layout><Perfil /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/anotaciones" element={
          <ProtectedRoute allowedRoles={['director', 'profesor', 'apoderado']}>
            <Layout><Anotaciones /></Layout>
          </ProtectedRoute>
        } />

        {/* Ruta raíz */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
