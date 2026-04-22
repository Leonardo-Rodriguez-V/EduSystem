import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import apiFetch from '../utils/api';
import { 
  Plus,
  Edit3,
  Trash2,
  X,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  Award,
  BarChart3,
  LayoutGrid
} from 'lucide-react';

/* ── Sugerencias de Estilos Rich Aesthetic ── */
const s = {
  container:  { padding: '32px', maxWidth: '1400px', margin: '0 auto' },
  bentoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  cardRow: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--color-surface)',
    borderRadius: '24px',
    padding: '24px',
    marginBottom: '16px',
    border: '4px solid var(--color-surface)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  },
  badge: (bg, color) => ({ 
    display: 'inline-flex', 
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    height: '36px',
    borderRadius: '12px', 
    fontSize: '14px', 
    fontWeight: 800, 
    background: bg, 
    color,
    boxShadow: `inset 2px 2px 4px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.05)`
  }),
  input: {
    width: '100%',
    padding: '14px 18px',
    border: 'none',
    borderRadius: '16px',
    fontSize: '14px',
    background: 'var(--color-muted)',
    outline: 'none',
    color: 'var(--color-foreground)',
    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.02)',
    fontWeight: 600
  },
  label: { 
    fontSize: '11px', 
    fontWeight: 800, 
    color: 'var(--color-primary)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em',
    marginBottom: '8px', 
    display: 'block' 
  },
  select: { 
    padding: '10px 20px', 
    borderRadius: '16px', 
    border: 'none', 
    background: 'var(--color-surface)', 
    boxShadow: 'var(--clay-shadow)', 
    fontSize: '14px', 
    fontWeight: 800, 
    color: 'var(--color-primary)', 
    outline: 'none', 
    cursor: 'pointer' 
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

function colorNota(n) {
  if (!n && n !== 0) return ['var(--color-muted)', 'var(--color-foreground)'];
  const val = Number(n);
  if (val >= 6)   return ['#dcfce7', '#15803d'];
  if (val >= 4)   return ['#fef3c7', '#b45309'];
  return ['#fee2e2', '#b91c1c'];
}

export default function Notas() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();
  const esDirector = usuario.rol === 'director';

  const [listaCursos, setListaCursos] = useState([]);
  const [curso,      setCurso]      = useState(null);
  const [asignaturas, setAsignaturas] = useState([]);
  const [asigSel,    setAsigSel]    = useState(null);
  const [alumnos,    setAlumnos]    = useState([]);
  const [notas,      setNotas]      = useState({});
  const [alumnoSel,  setAlumnoSel]  = useState(null);
  const [modalAbierto, setModal]    = useState(false);
  const [form,       setForm]       = useState({ descripcion: '', calificacion: '', fecha: new Date().toISOString().split('T')[0] });
  const [editando,   setEditando]   = useState(null);
  const [cargando,   setCargando]   = useState(true);
  const [guardando,  setGuardando]  = useState(false);
  const [mensaje,    setMensaje]    = useState({ texto: '', tipo: '' });
  const [directorModo, setDirectorModo] = useState(esDirector);

  useEffect(() => {
    const url = usuario.rol === 'profesor' ? `/cursos?id_profesor=${usuario.id}` : '/cursos';
    apiFetch(url).then(r => r?.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setListaCursos(data);
        setCurso(data[0]);
      } else {
        setCargando(false);
      }
    }).catch(() => setCargando(false));
  }, [usuario.id, usuario.rol]);

  useEffect(() => {
    if (!curso) return;
    if (usuario.rol === 'profesor') {
      apiFetch(`/notas/config/asignaturas?id_profesor=${usuario.id}&id_curso=${curso.id}`)
        .then(r => r?.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAsignaturas(data);
            setAsigSel(data[0] || null);
          }
        });
    }
  }, [curso, usuario.id, usuario.rol]);

  useEffect(() => {
    if (!curso) return;
    setCargando(true);
    apiFetch(`/alumnos?id_curso=${curso.id}`)
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setAlumnos(data); })
      .finally(() => setCargando(false));
  }, [curso]);

  useEffect(() => {
    if (alumnos.length === 0) return;
    Promise.all(
      alumnos.map(a => {
        let url = `/notas?id_alumno=${a.id}`;
        if (asigSel) url += `&id_asignatura=${asigSel.id}`;
        return apiFetch(url).then(r => r?.json()).then(data => ({ id: a.id, notas: Array.isArray(data) ? data : [] }));
      })
    ).then(resultados => {
      const mapa = {};
      resultados.forEach(r => { mapa[r.id] = r.notas; });
      setNotas(mapa);
    });
  }, [alumnos, asigSel]);

  const promedio = (id) => {
    const ns = notas[id];
    if (!ns || ns.length === 0) return null;
    return (ns.reduce((s, n) => s + parseFloat(n.calificacion), 0) / ns.length).toFixed(1);
  };

  const abrirModal = (alumno, nota = null) => {
    setAlumnoSel(alumno);
    if (nota) {
      setEditando(nota.id);
      setForm({ descripcion: nota.descripcion, calificacion: nota.calificacion, fecha: nota.fecha?.split('T')[0] || '' });
    } else {
      setEditando(null);
      setForm({ descripcion: '', calificacion: '', fecha: new Date().toISOString().split('T')[0] });
    }
    setModal(true);
    setMensaje({ texto: '', tipo: '' });
  };

  const cerrarModal = () => { setModal(false); setAlumnoSel(null); setEditando(null); };

  const guardar = async () => {
    const cal = parseFloat(form.calificacion);
    if (!form.descripcion.trim()) return setMensaje({ texto: 'Ingresa una descripción.', tipo: 'error' });
    if (isNaN(cal) || cal < 1 || cal > 7) return setMensaje({ texto: 'Nota debe ser 1.0 - 7.0', tipo: 'error' });

    setGuardando(true);
    try {
      const endpoint = editando ? `/notas/${editando}` : '/notas';
      const method   = editando ? 'PUT' : 'POST';
      const body     = {
        descripcion: form.descripcion,
        calificacion: cal,
        fecha: form.fecha,
        id_asignatura: asigSel?.id || null,
        id_alumno: alumnoSel.id
      };

      const res  = await apiFetch(endpoint, { method, body: JSON.stringify(body) });
      const data = await res?.json();

      if (res?.ok) {
        setNotas(prev => {
          const lista = prev[alumnoSel.id] ? [...prev[alumnoSel.id]] : [];
          if (editando) {
            const idx = lista.findIndex(n => n.id === editando);
            if (idx !== -1) lista[idx] = data;
          } else {
            lista.push(data);
          }
          return { ...prev, [alumnoSel.id]: lista };
        });
        cerrarModal();
      } else {
        setMensaje({ texto: data?.error || 'Error al guardar.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (alumnoId, notaId) => {
    if (!window.confirm('¿Eliminar esta nota?')) return;
    const res = await apiFetch(`/notas/${notaId}`, { method: 'DELETE' });
    if (res?.ok) {
      setNotas(prev => ({ ...prev, [alumnoId]: prev[alumnoId].filter(n => n.id !== notaId) }));
    }
  };

  const promediosCurso = alumnos.map(a => promedio(a.id)).filter(p => p !== null).map(Number);
  const promedioG  = promediosCurso.length > 0
    ? (promediosCurso.reduce((s, p) => s + p, 0) / promediosCurso.length).toFixed(1)
    : '—';

  return (
    <div style={s.container}>
      {/* Premium Header with Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '40px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, letterSpacing: '-0.02em' }}>
              {directorModo ? 'Analítica Académica' : (
                <>Libro de Clases <span style={{ color: 'var(--color-primary)', opacity: 0.5 }}>/</span> {curso?.nombre}</>
              )}
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
              {directorModo ? 'Rendimiento institucional y detección temprana de riesgos' : 'Gestión de rendimiento académico y promedios en tiempo real'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {esDirector && (
              <div style={{ display: 'flex', background: 'var(--color-muted)', padding: '4px', borderRadius: '14px', gap: '4px' }}>
                <button 
                  onClick={() => setDirectorModo(true)}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                    background: directorModo ? 'var(--color-surface)' : 'transparent',
                    color: directorModo ? 'var(--color-primary)' : 'var(--color-foreground)',
                    boxShadow: directorModo ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <BarChart3 size={16} /> Dashboard
                </button>
                <button 
                  onClick={() => setDirectorModo(false)}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                    background: !directorModo ? 'var(--color-surface)' : 'transparent',
                    color: !directorModo ? 'var(--color-primary)' : 'var(--color-foreground)',
                    boxShadow: !directorModo ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <LayoutGrid size={16} /> Gestión
                </button>
              </div>
            )}

            {!directorModo && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <select
                  value={curso?.id || ''}
                  onChange={(e) => setCurso(listaCursos.find(c => c.id === parseInt(e.target.value)))}
                  style={s.select}
                >
                  {listaCursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {asignaturas.length > 0 && (
                  <select
                    value={asigSel?.id || ''}
                    onChange={(e) => setAsigSel(asignaturas.find(a => a.id === parseInt(e.target.value)))}
                    style={s.select}
                  >
                    {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {directorModo ? (
          <motion.div key="analytics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <NotasAnalytics />
          </motion.div>
        ) : (
          <motion.div key="operational" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {/* Bento Stats */}
            <div style={s.bentoGrid}>
              <div className="clay-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <TrendingUp style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '80px', height: '80px', opacity: 0.05, color: 'var(--color-primary)' }} />
                <span style={s.label}>Promedio General</span>
                <div style={{ fontSize: '42px', fontWeight: 900, color: colorNota(Number(promedioG))[1], marginTop: '8px' }}>{promedioG}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginTop: '4px' }}>Rendimiento global del curso</div>
              </div>
              <div className="clay-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <Users style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '80px', height: '80px', opacity: 0.05, color: 'var(--color-secondary)' }} />
                <span style={s.label}>Estudiantes</span>
                <div style={{ fontSize: '42px', fontWeight: 900, color: 'var(--color-foreground)', marginTop: '8px' }}>{alumnos.length}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginTop: '4px' }}>Alumnos matriculados activos</div>
              </div>
              <div className="clay-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <Target style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '80px', height: '80px', opacity: 0.05, color: 'var(--color-accent)' }} />
                <span style={s.label}>Asignatura</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-foreground)', marginTop: '20px', textTransform: 'uppercase' }}>{asigSel?.nombre || 'General'}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginTop: '4px' }}>Contexto de evaluación actual</div>
              </div>
            </div>

            {/* List Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 100px 140px', padding: '0 24px 12px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <span>Pos</span>
              <span>Estudiante</span>
              <span>Calificaciones</span>
              <span style={{ textAlign: 'center' }}>Promedio</span>
              <span style={{ textAlign: 'right' }}>Acciones</span>
            </div>

            {/* Alumnos List */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={curso?.id + (asigSel?.id || '')}
            >
              {cargando ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '24px', marginBottom: '16px' }}></div>
                ))
              ) : (
                alumnos.map((a, i) => {
                  const ns = notas[a.id] || [];
                  const prom = promedio(a.id);
                  const [bg, color] = colorNota(Number(prom));

                  return (
                    <motion.div 
                      key={a.id} 
                      variants={itemVariants}
                      style={s.cardRow}
                      className="clay-card"
                    >
                      <div style={{ width: '80px', fontSize: '18px', fontWeight: 900, color: 'var(--color-primary)', opacity: 0.3 }}>
                        {(i + 1).toString().padStart(2, '0')}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-foreground)' }}>{a.nombre_completo}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>RUT: {a.rut}</div>
                      </div>

                      <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {ns.map(n => (
                          <motion.div
                            key={n.id}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => abrirModal(a, n)}
                            style={{ ...s.badge(...colorNota(n.calificacion)), cursor: 'pointer' }}
                          >
                            {parseFloat(n.calificacion).toFixed(1)}
                          </motion.div>
                        ))}
                        {ns.length === 0 && <span style={{ color: '#cbd5e1', fontSize: '12px', fontStyle: 'italic', fontWeight: 600 }}>Sin registros</span>}
                      </div>

                      <div style={{ width: '100px', display: 'flex', justifyContent: 'center' }}>
                        {prom ? (
                          <div style={{ ...s.badge(bg, color), width: '48px', height: '48px', fontSize: '16px', borderRadius: '16px' }}>{prom}</div>
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </div>

                      <div style={{ width: '140px', textAlign: 'right' }}>
                        <button 
                          className="clay-button" 
                          style={{ padding: '10px 16px', fontSize: '12px' }} 
                          onClick={() => abrirModal(a)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Premium */}
      <AnimatePresence>
        {modalAbierto && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="clay-card" 
              style={{ width: '100%', maxWidth: '440px', padding: '40px', background: 'var(--color-surface)', position: 'relative' }}
            >
              <button 
                onClick={cerrarModal} 
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--color-muted)', border: 'none', padding: '10px', borderRadius: '14px', cursor: 'pointer', color: 'var(--color-foreground)' }}
              >
                <X size={20} />
              </button>
              
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>{editando ? 'Editar Nota' : 'Nueva Nota'}</h2>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>{alumnoSel?.nombre_completo}</div>
              </div>

              {mensaje.texto && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  style={{ padding: '14px', borderRadius: '16px', fontSize: '13px', fontWeight: 700, marginBottom: '24px', background: mensaje.tipo === 'error' ? '#fee2e2' : '#dcfce7', color: mensaje.tipo === 'error' ? '#b91c1c' : '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                  {mensaje.texto}
                </motion.div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={s.label}>Detalle de Evaluación</label>
                <input style={s.input} value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Ej: Prueba parcial cap 1" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div>
                  <label style={s.label}>Calificación</label>
                  <input style={s.input} type="number" step="0.1" value={form.calificacion} onChange={e => setForm(p => ({ ...p, calificacion: e.target.value }))} placeholder="7.0" />
                </div>
                <div>
                  <label style={s.label}>Fecha</label>
                  <input style={s.input} type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                {editando && (
                  <button 
                    style={{ background: '#fee2e2', border: 'none', width: '48px', height: '48px', borderRadius: '16px', color: '#b91c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                    onClick={() => eliminar(alumnoSel.id, editando)}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  className="clay-button" 
                  style={{ flex: 1, height: '48px' }}
                  onClick={guardar} 
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : editando ? 'Actualizar Registro' : 'Registrar Nota'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotasAnalytics() {
  const [promediosCursos, setPromediosCursos] = useState([]);
  const [riesgoAcademico, setRiesgoAcademico] = useState([]);
  const [topPromedios, setTopPromedios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      try {
        const [resProm, resRiesgo, resTop] = await Promise.all([
          apiFetch('/notas/promedio-cursos').then(r => r?.json()),
          apiFetch('/notas/analitica/riesgo').then(r => r?.json()),
          apiFetch('/notas/analitica/top').then(r => r?.json())
        ]);

        if (Array.isArray(resProm)) setPromediosCursos(resProm);
        if (Array.isArray(resRiesgo)) setRiesgoAcademico(resRiesgo);
        if (Array.isArray(resTop)) setTopPromedios(resTop);
      } catch (err) {
        console.error('Error fetching grades analytics:', err);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  if (cargando) return (
     <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
       <div className="skeleton" style={{ height: '450px', borderRadius: '32px' }}></div>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
         <div className="skeleton" style={{ height: '215px', borderRadius: '32px' }}></div>
         <div className="skeleton" style={{ height: '215px', borderRadius: '32px' }}></div>
       </div>
     </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '32px' }}>
      {/* Gráfico de Tendencias por Curso */}
      <div className="clay-card" style={{ gridColumn: 'span 8', padding: '32px', minHeight: '450px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Promedio por Nivel</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Comparativa de rendimiento académico institucional</p>
          </div>
          <div style={{ background: 'rgba(99,102,241,0.1)', padding: '10px 16px', borderRadius: '12px', color: 'var(--color-primary)', fontWeight: 800, fontSize: '13px' }}>
            Hoy
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={promediosCursos}>
            <defs>
              <linearGradient id="colorProm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
            <YAxis domain={[1, 7]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
            />
            <Area type="monotone" dataKey="promedio" stroke="var(--color-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorProm)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alertas y Top */}
      <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Top Alumnos */}
        <div className="clay-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '10px' }}>
              <Award size={20} color="#15803d" />
            </div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Excelencia Académica</h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topPromedios.slice(0, 5).map((est, i) => (
              <div key={est.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--color-muted)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, opacity: 0.2 }}>{i+1}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>{est.nombre_completo.split(' ')[0]} {est.nombre_completo.split(' ')[1]}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>{est.nombre_curso}</div>
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#15803d' }}>{parseFloat(est.promedio).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Riesgo Académico */}
        <div className="clay-card" style={{ padding: '24px', border: '2px solid rgba(239, 68, 68, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '10px' }}>
              <AlertTriangle size={20} color="#b91c1c" />
            </div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Riesgo de Evaluación</h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {riesgoAcademico.length === 0 ? (
              <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '12px', padding: '20px' }}>Sin alertas de riesgo</div>
            ) : riesgoAcademico.slice(0, 5).map(est => (
              <div key={est.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{est.nombre_completo.split(' ')[0]} {est.nombre_completo.split(' ')[1]}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#b91c1c' }}>{est.nombre_curso}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#b91c1c' }}>{parseFloat(est.promedio).toFixed(1)}</div>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#ef4444' }}>{est.reprobadas} INS.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen por Cursos (Tabla Analítica) */}
      <div className="clay-card" style={{ gridColumn: 'span 12', padding: '32px' }}>
        <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 900 }}>Semáforo de Rendimiento por Curso</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {promediosCursos.map(c => {
            const prom = Number(c.promedio);
            const color = prom >= 6 ? '#10b981' : prom >= 4 ? '#f59e0b' : '#ef4444';
            return (
              <div key={c.id} style={{ padding: '20px', background: 'var(--color-muted)', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--clay-shadow)' }}>
                  <TrendingUp size={24} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>{c.nombre}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.5 }}>{c.aprobados} apr. / {c.reprobados} repr.</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color }}>{prom.toFixed(1)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
