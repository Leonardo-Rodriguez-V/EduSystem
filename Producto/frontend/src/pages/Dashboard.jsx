import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  PlusCircle, 
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '../components/StatCard';

const s = {
  container:  { padding: '0 0 40px 0', maxWidth: '1400px', margin: '0 auto' },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' },
  pageTitle:  { fontSize: '32px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, fontFamily: "'Crimson Pro', serif" },
  pageSub:    { fontSize: '15px', color: 'var(--color-foreground)', opacity: 0.6, marginTop: '4px', fontWeight: 600 },
  kpiGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' },
  sectionTitle: { fontSize: '22px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' },
  tblCard:    { padding: '24px', background: 'var(--color-surface)', borderRadius: '32px', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.1)' },
  tbl:        { width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' },
  th:         { textAlign: 'left', padding: '0 20px', fontSize: '12px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em' },
  tr:         { background: 'var(--color-muted)', borderRadius: '20px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
  td:         { padding: '16px 20px', color: 'var(--color-foreground)', fontSize: '14px', fontWeight: 600 },
  badge:      (bg, color) => ({ display: 'inline-flex', padding: '6px 14px', borderRadius: '14px', fontSize: '11px', fontWeight: 800, background: bg, color, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }),
};

export default function Dashboard() {
  const [cursos, setCursos]   = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const usuario = (() => { 
    try { 
      const u = localStorage.getItem('usuario');
      return u ? JSON.parse(u) : { rol: 'invitado', nombre_completo: 'Usuario' }; 
    } catch { return { rol: 'invitado', nombre_completo: 'Usuario' }; } 
  })();

  useEffect(() => {
    const fetchCursos = usuario.rol === 'profesor'
      ? `/cursos?id_profesor=${usuario.id}`
      : '/cursos';

    apiFetch(fetchCursos).then(r => r?.json()).catch(() => []).then(async (c) => {
      const cursosData = Array.isArray(c) ? c : [];
      setCursos(cursosData);

      if (usuario.rol === 'director') {
        const a = await apiFetch('/alumnos').then(r => r?.json()).catch(() => []);
        setAlumnos(Array.isArray(a) ? a : []);
      } else if (usuario.rol === 'profesor' && cursosData.length > 0) {
        const resultados = await Promise.all(
          cursosData.map(curso =>
            apiFetch(`/alumnos?id_curso=${curso.id}`).then(r => r?.json()).catch(() => [])
          )
        );
        setAlumnos(resultados.flat());
      } else {
        setAlumnos([]);
      }
      setCargando(false);
    });
  }, [usuario.id, usuario.rol]);

  return (
    <div style={s.container}>
      {usuario.rol === 'director' && <DashboardDirector usuario={usuario} cursos={cursos} totalAlumnos={alumnos.length} cargando={cargando} />}
      {usuario.rol === 'profesor' && <DashboardProfesor usuario={usuario} cursos={cursos} totalAlumnos={alumnos.length} cargando={cargando} />}
      {!['director', 'profesor'].includes(usuario.rol) && <DashboardGenerico usuario={usuario} />}
    </div>
  );
}

/* ────────── DIRECTOR ────────── */
function DashboardDirector({ usuario, cursos, totalAlumnos, cargando }) {
  const [modalAviso, setModalAviso] = useState(false);
  const [avisoForm,  setAvisoForm]  = useState({ titulo: '', contenido: '' });
  const [enviando,   setEnviando]   = useState(false);
  const [avisoMsg,   setAvisoMsg]   = useState('');

  const publicarGlobal = async () => {
    if (!avisoForm.titulo.trim() || !avisoForm.contenido.trim()) return;
    setEnviando(true);
    try {
      await Promise.all(cursos.map(c =>
        apiFetch('/avisos', {
          method: 'POST',
          body: JSON.stringify({ id_curso: c.id, id_autor: usuario.id, titulo: avisoForm.titulo, contenido: avisoForm.contenido }),
        })
      ));
      setAvisoMsg(`Aviso publicado en ${cursos.length} cursos.`);
      setAvisoForm({ titulo: '', contenido: '' });
      setTimeout(() => { setAvisoMsg(''); setModalAviso(false); }, 2000);
    } catch {
      setAvisoMsg('Error al publicar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Panel de Control Administrativo</h1>
          <p style={s.pageSub}>Gestionando {usuario?.nombre_completo?.split(',')[0] || 'Sistema'}</p>
        </div>
        <button className="clay-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }} onClick={() => setModalAviso(true)}>
          <PlusCircle size={20} />
          Nuevo aviso global
        </button>
      </div>

      {/* Modal aviso global */}
      {modalAviso && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setModalAviso(false); }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px', border: '1px solid var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '6px' }}>Nuevo Aviso Global</div>
            <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.5, marginBottom: '20px' }}>
              Se publicará en los {cursos.length} cursos de la institución
            </div>

            {avisoMsg && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: 'rgba(21,128,61,0.1)', color: '#15803d', border: '1px solid rgba(21,128,61,0.3)' }}>
                {avisoMsg}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.6, marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '.5px' }}>Título</label>
              <input value={avisoForm.titulo} onChange={e => setAvisoForm(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Ej: Reunión de apoderados general"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-muted)', color: 'var(--color-foreground)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.6, marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '.5px' }}>Contenido</label>
              <textarea value={avisoForm.contenido} onChange={e => setAvisoForm(p => ({ ...p, contenido: e.target.value }))}
                placeholder="Escribe el aviso aquí..."
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-muted)', color: 'var(--color-foreground)', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '100px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModalAviso(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-foreground)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={publicarGlobal} disabled={enviando || !avisoForm.titulo || !avisoForm.contenido}
                style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px', opacity: (enviando || !avisoForm.titulo || !avisoForm.contenido) ? 0.6 : 1 }}>
                {enviando ? 'Publicando...' : `Publicar en ${cursos.length} cursos`}
              </button>
            </div>
          </div>
        </div>
      )}


      <div style={s.kpiGrid}>
        <StatCard 
          title="Total Alumnos" 
          value={cargando ? '...' : totalAlumnos} 
          subtext="Crecimiento del 4% mensual" 
          icon={Users} 
          color="#6366f1"
          delay={0.1}
        />
        <StatCard 
          title="Cursos Activos" 
          value={cargando ? '...' : cursos.length} 
          subtext="Año Académico 2026" 
          icon={BookOpen} 
          color="#10b981"
          delay={0.2}
        />
        <StatCard 
          title="Asistencia Global" 
          value="94.2%" 
          subtext="Promedio sobre meta (90%)" 
          icon={BarChart3} 
          color="#f59e0b"
          delay={0.3}
        />
      </div>

      <div style={s.sectionTitle}>
        <GraduationCap size={26} color="var(--color-primary)" />
        Estructura Académica
      </div>
      
      <div style={s.tblCard}>
        <table style={s.tbl}>
          <thead>
            <tr>
              <th style={s.th}>Nombre del Curso</th>
              <th style={s.th}>Año Lectivo</th>
              <th style={s.th}>Estado Académico</th>
              <th style={s.th}>Gestión</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((c, i) => (
              <motion.tr 
                key={c.id} 
                style={s.tr}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.05) }}
                className="hover:bg-[rgba(255,255,255,0.4)] cursor-pointer"
              >
                <td style={{ ...s.td, borderRadius: '20px 0 0 20px' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{c.nombre}</div>
                </td>
                <td style={s.td}>{c.anio}</td>
                <td style={s.td}>
                  <span style={s.badge('#dcfce7', '#15803d')}>Certificado</span>
                </td>
                <td style={{ ...s.td, borderRadius: '0 20px 20px 0' }}>
                  <button style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    Ver Detalles <ChevronRight size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────── PROFESOR ────────── */
function DashboardProfesor({ usuario, cursos, totalAlumnos, cargando }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Bienvenido, Prof. {usuario?.nombre_completo?.split(' ').slice(-1) || 'Docente'}</h1>
          <p style={s.pageSub}>Tu resumen educativo para hoy</p>
        </div>
      </div>

      <div style={s.kpiGrid}>
        <StatCard 
          title="Mis Secciones" 
          value={cargando ? '...' : cursos.length} 
          icon={LayoutDashboard} 
          color="#4f46e5"
          subtext="Carga académica total"
          delay={0.1}
        />
        <StatCard 
          title="Alumnos Totales" 
          value={cargando ? '...' : totalAlumnos} 
          icon={Users} 
          color="#0ea5e9"
          subtext="Impacto educativo"
          delay={0.2}
        />
        <StatCard 
          title="Notas por Subir" 
          value="12" 
          icon={Clock} 
          color="#ef4444"
          subtext="Evaluaciones pendientes"
          delay={0.3}
        />
      </div>

      <div style={s.sectionTitle}>
        <BookOpen size={26} color="var(--color-primary)" />
        Mis Cursos Asignados
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {cursos.map((c, i) => {
          const esJefe = c.id_profesor_jefe === usuario.id;
          return (
            <motion.div 
              key={c.id} 
              className="clay-card" 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              whileHover={{ y: -10 }}
              style={{ overflow: 'hidden', padding: 0, borderRadius: '28px' }}
            >
              <div style={{ 
                background: esJefe 
                  ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' 
                  : 'linear-gradient(135deg, #475569 0%, #64748b 100%)', 
                padding: '40px 32px', 
                position: 'relative',
                color: 'white'
              }}>
                {esJefe && (
                  <div style={{ 
                    position: 'absolute', top: '16px', right: '16px', 
                    background: 'rgba(255,255,255,0.2)', padding: '6px 12px', 
                    borderRadius: '12px', fontSize: '10px', fontWeight: 900, 
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    backdropFilter: 'blur(4px)'
                  }}>
                    Profesor Jefe
                  </div>
                )}
                <div style={{ fontSize: '26px', fontWeight: 900, fontFamily: "'Crimson Pro', serif" }}>{c.nombre}</div>
                <div style={{ opacity: 0.8, fontSize: '14px', marginTop: '4px', fontWeight: 600 }}>Año lectivo {c.anio}</div>
              </div>
              <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, opacity: 0.4 }}>Estado</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-foreground)' }}>Vigente</span>
                </div>
                <button className="clay-button" style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 800 }}>
                  Abrir Libro
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ────────── GENÉRICO ────────── */
function DashboardGenerico({ usuario }) {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <motion.div 
        className="clay-card" 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px', borderRadius: '40px' }}
      >
        <div style={{ 
          background: 'var(--color-muted)', width: '100px', height: '100px', 
          borderRadius: '30px', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', margin: '0 auto 32px', color: 'var(--color-primary)',
          boxShadow: 'var(--clay-shadow)'
        }}>
          <GraduationCap size={48} />
        </div>
        <h1 style={{ ...s.pageTitle, fontSize: '28px' }}>¡Hola, {usuario?.nombre_completo || 'Usuario'}!</h1>
        <p style={{ ...s.pageSub, fontSize: '17px', marginTop: '16px', lineHeight: 1.6 }}>
          Bienvenido a tu ecosistema digital **EduSync**. Estamos preparando tu información personalizada.
          Explora tus secciones en el panel lateral.
        </p>
      </motion.div>
    </div>
  );
}
