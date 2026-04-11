import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiFetch from '../utils/api';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  GraduationCap,
  ClipboardList,
  ChevronDown,
  TrendingUp,
  Users,
  Target
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
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '40px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, letterSpacing: '-0.02em' }}>
              Libro de Clases <span style={{ color: 'var(--color-primary)', opacity: 0.5 }}>/</span> {curso?.nombre}
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
              Gestión de rendimiento académico y promedios en tiempo real
            </p>
          </div>

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
        </div>
      </motion.div>

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
