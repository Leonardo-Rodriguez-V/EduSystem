import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import {
  Users,
  BookOpen,
  BarChart3,
  PlusCircle,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Clock,
  Calendar,
  Star,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '../components/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from 'recharts';

const s = {
  container:  { padding: '0 0 40px 0', maxWidth: '1400px', margin: '0 auto' },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' },
  pageTitle:  { fontSize: '32px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, fontFamily: "'Crimson Pro', serif" },
  pageSub:    { fontSize: '15px', color: 'var(--color-foreground)', opacity: 0.6, marginTop: '4px', fontWeight: 600 },
  kpiGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' },
  sectionTitle: { fontSize: '22px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' },
  tblCard:    { padding: '24px', background: 'var(--color-surface)', borderRadius: '32px', boxShadow: 'var(--clay-shadow)', border: '1px solid var(--color-border)' },
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
      {usuario.rol === 'director'  && <DashboardDirector  usuario={usuario} cursos={cursos} totalAlumnos={alumnos.length} cargando={cargando} />}
      {usuario.rol === 'profesor'  && <DashboardProfesor  usuario={usuario} cursos={cursos} totalAlumnos={alumnos.length} cargando={cargando} />}
      {usuario.rol === 'apoderado' && <DashboardApoderado usuario={usuario} />}
      {!['director', 'profesor', 'apoderado'].includes(usuario.rol) && <DashboardGenerico usuario={usuario} />}
    </div>
  );
}

/* ────────── DIRECTOR ────────── */
function DashboardDirector({ usuario, cursos, totalAlumnos, cargando }) {
  const navigate = useNavigate();
  const [modalAviso, setModalAviso] = useState(false);
  const [avisoForm,  setAvisoForm]  = useState({ titulo: '', contenido: '' });
  const [enviando,   setEnviando]   = useState(false);
  const [avisoMsg,   setAvisoMsg]   = useState('');
  const [asistGlobal,   setAsistGlobal]   = useState(null);
  const [statsAsist,    setStatsAsist]    = useState([]);
  const [statsNotas,    setStatsNotas]    = useState([]);

  useEffect(() => {
    apiFetch('/asistencia/global').then(r => r?.json()).then(d => {
      if (d && typeof d.porcentaje === 'number') setAsistGlobal(d);
    }).catch(() => {});

    apiFetch('/asistencia/resumen-cursos').then(r => r?.json()).then(d => {
      if (Array.isArray(d)) setStatsAsist(d.map(c => ({ nombre: c.nombre.length > 8 ? c.nombre.slice(0, 8) + '…' : c.nombre, porcentaje: c.porcentaje, nombreCompleto: c.nombre })));
    }).catch(() => {});

    apiFetch('/notas/promedio-cursos').then(r => r?.json()).then(d => {
      if (Array.isArray(d)) setStatsNotas(d.map(c => ({ nombre: c.nombre.length > 8 ? c.nombre.slice(0, 8) + '…' : c.nombre, promedio: c.promedio ? parseFloat(c.promedio) : null, total_notas: c.total_notas, nombreCompleto: c.nombre })));
    }).catch(() => {});
  }, []);

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

  const asistLabel = asistGlobal === null
    ? (cargando ? '...' : 'Sin datos')
    : `${asistGlobal.porcentaje}%`;

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
          subtext="Matrícula activa 2026"
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
          value={asistLabel}
          subtext={asistGlobal ? `${asistGlobal.presentes} presencias de ${asistGlobal.total} registros` : 'Sin registros aún'}
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
              >
                <td style={{ ...s.td, borderRadius: '20px 0 0 20px' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{c.nombre}</div>
                </td>
                <td style={s.td}>{c.anio}</td>
                <td style={s.td}>
                  <span style={s.badge('#dcfce7', '#15803d')}>Activo</span>
                </td>
                <td style={{ ...s.td, borderRadius: '0 20px 20px 0' }}>
                  <button
                    onClick={() => navigate('/horarios')}
                    style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    Ver Detalles <ChevronRight size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* ── Sección Estadísticas ── */}
      <div style={{ marginTop: '48px' }}>
        <div style={s.sectionTitle}>
          <BarChart3 size={26} color="var(--color-primary)" />
          Estadísticas del Sistema
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>

          {/* Gráfico asistencia por curso */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ ...s.tblCard, padding: '28px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '4px' }}>Asistencia por Curso</div>
            <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.45, marginBottom: '20px', fontWeight: 600 }}>Porcentaje de presencia acumulado</div>
            {statsAsist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-foreground)', opacity: 0.3, fontSize: '13px', fontWeight: 600 }}>Sin datos de asistencia aún</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statsAsist} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--color-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'var(--color-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v, _, props) => [`${v}%`, props.payload.nombreCompleto || 'Asistencia']}
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Bar dataKey="porcentaje" radius={[6, 6, 0, 0]}>
                    {statsAsist.map((entry, i) => (
                      <Cell key={i} fill={entry.porcentaje >= 90 ? '#10b981' : entry.porcentaje >= 75 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              {[{ color: '#10b981', label: '≥ 90% Óptima' }, { color: '#f59e0b', label: '75–89% Regular' }, { color: '#ef4444', label: '< 75% Crítica' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.6 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gráfico promedio de notas por curso */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ ...s.tblCard, padding: '28px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '4px' }}>Promedio de Notas por Curso</div>
            <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.45, marginBottom: '20px', fontWeight: 600 }}>Promedio general de calificaciones</div>
            {statsNotas.filter(c => c.promedio !== null).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-foreground)', opacity: 0.3, fontSize: '13px', fontWeight: 600 }}>Sin notas registradas aún</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statsNotas} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--color-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 7]} ticks={[1, 2, 3, 4, 5, 6, 7]} tick={{ fontSize: 11, fill: 'var(--color-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v, _, props) => [v ? v.toFixed(1) : '—', props.payload.nombreCompleto || 'Promedio']}
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Bar dataKey="promedio" radius={[6, 6, 0, 0]}>
                    {statsNotas.map((entry, i) => (
                      <Cell key={i} fill={!entry.promedio ? '#94a3b8' : entry.promedio >= 5 ? '#10b981' : entry.promedio >= 4 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              {[{ color: '#10b981', label: '≥ 5.0 Bueno' }, { color: '#f59e0b', label: '4.0–4.9 Suficiente' }, { color: '#ef4444', label: '< 4.0 Insuficiente' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.6 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}

/* ────────── PROFESOR ────────── */
function DashboardProfesor({ usuario, cursos, totalAlumnos, cargando }) {
  const navigate = useNavigate();
  const [pendientes, setPendientes] = useState(null);

  useEffect(() => {
    if (!usuario.id) return;
    apiFetch(`/evaluaciones/pendientes?id_profesor=${usuario.id}`)
      .then(r => r?.json())
      .then(d => { if (d && typeof d.total === 'number') setPendientes(d.total); })
      .catch(() => {});
  }, [usuario.id]);

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
          title="Evaluaciones Pasadas"
          value={pendientes === null ? '...' : pendientes}
          icon={Clock}
          color="#ef4444"
          subtext="Con fecha cumplida"
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
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, opacity: 0.4, color: 'var(--color-foreground)' }}>Estado</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-foreground)' }}>Vigente</span>
                </div>
                <button
                  className="clay-button"
                  style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 800 }}
                  onClick={() => navigate('/notas')}
                >
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

/* ────────── APODERADO ────────── */
function DashboardApoderado({ usuario }) {
  const [hijos, setHijos]           = useState([]);
  const [evaluaciones, setEval]     = useState({});
  const [notas, setNotas]           = useState({});
  const [cargando, setCargando]     = useState(true);

  useEffect(() => {
    if (!usuario.id) return;
    apiFetch(`/alumnos/apoderado/${usuario.id}`)
      .then(r => r?.json())
      .then(async (data) => {
        const lista = Array.isArray(data) ? data : [];
        setHijos(lista);

        const hoy = new Date().toISOString().split('T')[0];

        const [evalResults, notaResults] = await Promise.all([
          Promise.all(lista.map(h =>
            apiFetch(`/evaluaciones/curso/${h.id_curso}`).then(r => r?.json()).catch(() => [])
          )),
          Promise.all(lista.map(h =>
            apiFetch(`/notas?id_alumno=${h.id}`).then(r => r?.json()).catch(() => [])
          ))
        ]);

        const evalMap = {};
        const notaMap = {};
        lista.forEach((h, i) => {
          const evs = Array.isArray(evalResults[i]) ? evalResults[i] : [];
          evalMap[h.id] = evs.filter(e => e.fecha >= hoy).slice(0, 3);
          const ns = Array.isArray(notaResults[i]) ? notaResults[i] : [];
          notaMap[h.id] = ns.slice(0, 3);
        });
        setEval(evalMap);
        setNotas(notaMap);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [usuario.id]);

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-foreground)', opacity: 0.5, fontWeight: 600 }}>Cargando información...</p>
      </div>
    );
  }

  if (hijos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <motion.div className="clay-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 40px', borderRadius: '40px' }}>
          <div style={{ background: 'var(--color-muted)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--color-primary)' }}>
            <Users size={40} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '12px' }}>Sin alumnos vinculados</h2>
          <p style={{ color: 'var(--color-foreground)', opacity: 0.5, fontSize: '14px', lineHeight: 1.6 }}>
            Aún no hay estudiantes asociados a tu cuenta. Contacta al director del establecimiento.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Hola, {usuario?.nombre_completo?.split(' ')[0] || 'Apoderado'}</h1>
          <p style={s.pageSub}>
            {hijos.length === 1 ? 'Seguimiento de tu estudiante' : `Seguimiento de tus ${hijos.length} estudiantes`}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '28px' }}>
        {hijos.map((h, i) => {
          const proxEvals = evaluaciones[h.id] || [];
          const ultimasNotas = notas[h.id] || [];
          const promedio = ultimasNotas.length > 0
            ? (ultimasNotas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / ultimasNotas.length).toFixed(1)
            : null;

          return (
            <motion.div key={h.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ background: 'var(--color-surface)', borderRadius: '28px', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: 'var(--clay-shadow)' }}>

              {/* Header del hijo */}
              <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '28px 28px 24px', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.25)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, backdropFilter: 'blur(4px)' }}>
                    {h.nombre_completo.split(' ').slice(0, 2).map(p => p[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>{h.nombre_completo}</div>
                    <div style={{ opacity: 0.8, fontSize: '13px', fontWeight: 600 }}>{h.nombre_curso || `Curso #${h.id_curso}`}</div>
                  </div>
                  {promedio && (
                    <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                      <div style={{ fontSize: '26px', fontWeight: 900 }}>{promedio}</div>
                      <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Promedio</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cuerpo */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Próximas evaluaciones */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Calendar size={15} color="var(--color-primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-foreground)', opacity: 0.6 }}>
                      Próximas Evaluaciones
                    </span>
                  </div>
                  {proxEvals.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.4, fontStyle: 'italic' }}>Sin evaluaciones próximas</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {proxEvals.map(ev => {
                        const dias = Math.ceil((new Date(ev.fecha) - new Date()) / 86400000);
                        return (
                          <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-muted)', borderRadius: '12px' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-foreground)' }}>{ev.titulo}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.5 }}>{ev.nombre_asignatura}</div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px',
                              background: dias <= 3 ? 'rgba(239,68,68,0.15)' : dias <= 7 ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                              color: dias <= 3 ? '#ef4444' : dias <= 7 ? '#d97706' : 'var(--color-primary)' }}>
                              {dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias}d`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Últimas notas */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Star size={15} color="#f59e0b" />
                    <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-foreground)', opacity: 0.6 }}>
                      Últimas Notas
                    </span>
                  </div>
                  {ultimasNotas.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.4, fontStyle: 'italic' }}>Sin notas registradas</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {ultimasNotas.map(n => {
                        const nota = parseFloat(n.calificacion);
                        const aprueba = nota >= 4.0;
                        return (
                          <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-muted)', borderRadius: '12px' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-foreground)' }}>{n.descripcion}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.5 }}>{n.nombre_asignatura || 'Sin asignatura'}</div>
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 900, color: aprueba ? '#10b981' : '#ef4444' }}>
                              {nota.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
          Bienvenido a EduSync. Explora tus secciones en el panel lateral.
        </p>
      </motion.div>
    </div>
  );
}
