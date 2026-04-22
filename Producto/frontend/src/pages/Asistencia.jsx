import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { 
  TrendingUp, AlertCircle, CheckCircle, 
  ClipboardList, School
} from 'lucide-react';
import apiFetch from '../utils/api';

// Estilos base con variables CSS (compatibles con dark mode)
const s = {
  container:  { fontFamily: 'inherit' },
  title:      { fontSize: '26px', fontWeight: 800, color: 'var(--color-foreground)', marginBottom: '4px' },
  subtitle:   { fontSize: '14px', color: 'var(--color-foreground)', opacity: 0.55, marginBottom: '24px' },
  card:       { background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' },
  label:      { fontSize: '13px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.6 },
  select:     { border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', background: 'var(--color-muted)', color: 'var(--color-foreground)', outline: 'none', cursor: 'pointer' },
  dateInput:  { border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', background: 'var(--color-muted)', color: 'var(--color-foreground)', outline: 'none' },
};

// Colores sólidos para estados — funcionan en claro Y oscuro
const ESTADO_COLORS = {
  presente: { solid: '#15803d', light: 'rgba(21,128,61,0.1)',  border: '#15803d', text: '#15803d' },
  ausente:  { solid: '#dc2626', light: 'rgba(220,38,38,0.1)',  border: '#dc2626', text: '#dc2626' },
  tardanza: { solid: '#d97706', light: 'rgba(217,119,6,0.1)',  border: '#d97706', text: '#d97706' },
};

function Asistencia() {
  const usuario    = JSON.parse(localStorage.getItem('usuario')) || {};
  const esDirector = usuario.rol === 'director';

  const [curso,      setCurso]      = useState(null);
  const [cursos,     setCursos]     = useState([]);
  const [alumnos,    setAlumnos]    = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [fecha,      setFecha]      = useState(new Date().toISOString().split('T')[0]);
  const [cargando,   setCargando]   = useState(true);
  const [guardando,  setGuardando]  = useState(false);
  const [mensaje,    setMensaje]    = useState({ texto: '', tipo: '' });
  const [justificaciones, setJustificaciones] = useState({});
  const [directorModo, setDirectorModo] = useState(esDirector); // Default true for director

  // 1. Cargar cursos
  useEffect(() => {
    const cargarCurso = async () => {
      setCargando(true);
      try {
        const url  = esDirector ? '/cursos' : `/cursos?id_profesor=${usuario.id}`;
        const res  = await apiFetch(url);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          setMensaje({ texto: 'No hay cursos registrados.', tipo: 'error' });
          setCargando(false);
          return;
        }
        setCursos(data);
        const miCurso = data.find(c => c.id_profesor_jefe === usuario.id) || data[0];
        setCurso(miCurso);
      } catch {
        setMensaje({ texto: 'Error al cargar el curso.', tipo: 'error' });
        setCargando(false);
      }
    };
    cargarCurso();
  }, []);

  // 2. Cargar alumnos y asistencia cuando cambia curso o fecha
  useEffect(() => {
    if (!curso) return;
    const cargarAlumnos = async () => {
      setCargando(true);
      try {
        const res   = await apiFetch(`/asistencia?id_curso=${curso.id}&fecha=${fecha}`);
        const datos = await res.json();
        if (!Array.isArray(datos)) {
          setMensaje({ texto: datos.error || 'Error al cargar alumnos.', tipo: 'error' });
          setAlumnos([]);
          return;
        }
        setAlumnos(datos);
        const estadosPrevios = {};
        datos.forEach(a => { if (a.estado) estadosPrevios[a.id] = a.estado; });
        setAsistencia(estadosPrevios);
        // justificaciones keyed by id_alumno
        const justs = {};
        datos.forEach(a => { if (a.justificacion) justs[a.id] = a.justificacion; });
        setJustificaciones(justs);
      } catch {
        setMensaje({ texto: 'Error al cargar los alumnos.', tipo: 'error' });
      } finally {
        setCargando(false);
      }
    };
    cargarAlumnos();
  }, [curso, fecha]);

  const marcar     = (id, estado) => { setAsistencia(prev => ({ ...prev, [id]: estado })); setMensaje({ texto: '', tipo: '' }); };
  const marcarTodos = (estado)    => { const todos = {}; alumnos.forEach(a => { todos[a.id] = estado; }); setAsistencia(todos); };

  const guardar = async () => {
    const sinMarcar = alumnos.filter(a => !asistencia[a.id]);
    if (sinMarcar.length > 0) {
      setMensaje({ texto: `Faltan ${sinMarcar.length} alumno(s) por marcar.`, tipo: 'error' });
      return;
    }
    setGuardando(true);
    try {
      const registros = alumnos.map(a => ({ id_alumno: a.id, estado: asistencia[a.id], observacion: null }));
      const res = await apiFetch('/asistencia/guardar', {
        method: 'POST',
        body: JSON.stringify({ id_curso: curso.id, fecha, registros }),
      });
      if (res.ok) {
        setMensaje({ texto: 'Asistencia guardada correctamente.', tipo: 'exito' });
      } else {
        const err = await res.json();
        setMensaje({ texto: err.detalle || err.error || 'Error al guardar.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const presentes = alumnos.filter(a => asistencia[a.id] === 'presente').length;
  const ausentes  = alumnos.filter(a => asistencia[a.id] === 'ausente').length;
  const tardanzas = alumnos.filter(a => asistencia[a.id] === 'tardanza').length;

  const btnEstado = (idAlumno, estado) => {
    const activo = asistencia[idAlumno] === estado;
    const c      = ESTADO_COLORS[estado];
    return {
      padding: '5px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.15s',
      border: `1.5px solid ${c.border}`,
      background: activo ? c.solid : 'transparent',
      color: activo ? '#fff' : c.text,
    };
  };

  return (
    <div style={s.container}>
      {/* Header with Toggle for Director */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={s.title}>{directorModo ? 'Analítica de Asistencia' : 'Pasar Lista'}</div>
          <div style={s.subtitle}>
            {directorModo 
              ? 'Resumen estratégico y gestión de riesgos' 
              : (curso ? <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{curso.nombre}</span> : 'Cargando curso...')}
          </div>
        </div>
        
        {esDirector && (
          <div style={{ display: 'flex', background: 'var(--color-muted)', padding: '4px', borderRadius: '14px', gap: '4px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={() => setDirectorModo(true)}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                background: directorModo ? 'var(--color-surface)' : 'transparent',
                color: directorModo ? 'var(--color-primary)' : 'var(--color-foreground)',
                boxShadow: directorModo ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <TrendingUp size={16} /> Analítica
            </button>
            <button 
              onClick={() => setDirectorModo(false)}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                background: !directorModo ? 'var(--color-surface)' : 'transparent',
                color: !directorModo ? 'var(--color-primary)' : 'var(--color-foreground)',
                boxShadow: !directorModo ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <ClipboardList size={16} /> Cobertura
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {directorModo ? (
          <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <AsistenciaAnalytics />
          </motion.div>
        ) : (
          <motion.div key="operational" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Contenido original de Pasar Lista */}
            <div style={{ ...s.card, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
              {cursos.length > 1 && (
                <>
                  <span style={s.label}>Curso:</span>
                  <select style={s.select} value={curso?.id || ''} onChange={e => setCurso(cursos.find(c => String(c.id) === e.target.value))}>
                    {cursos.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}{c.id_profesor_jefe === usuario.id ? ' ★' : ''}</option>
                    ))}
                  </select>
                </>
              )}
              <span style={s.label}>Fecha:</span>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={s.dateInput} />

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => marcarTodos('presente')} style={{ ...btnEstado(null, 'presente'), background: ESTADO_COLORS.presente.light, color: ESTADO_COLORS.presente.text }}>
                  Todos Presentes
                </button>
                <button onClick={() => marcarTodos('ausente')} style={{ ...btnEstado(null, 'ausente'), background: ESTADO_COLORS.ausente.light, color: ESTADO_COLORS.ausente.text }}>
                  Todos Ausentes
                </button>
              </div>
            </div>

            {/* Resumen */}
            {alumnos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Presentes', valor: presentes, estado: 'presente' },
                  { label: 'Ausentes',  valor: ausentes,  estado: 'ausente'  },
                  { label: 'Tardanzas', valor: tardanzas,  estado: 'tardanza' },
                ].map(({ label, valor, estado }) => {
                  const c = ESTADO_COLORS[estado];
                  return (
                    <div key={estado} style={{ background: c.light, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: c.solid }}>{valor}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lista de alumnos */}
            {cargando ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.5 }}>Cargando alumnos...</div>
              </div>
            ) : alumnos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: '16px', border: '2px dashed var(--color-border)' }}>
                <div style={{ fontSize: '14px', color: 'var(--color-foreground)', opacity: 0.4 }}>No hay alumnos en este curso.</div>
              </div>
            ) : (
              <div style={{ ...s.card, padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alumno</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>RUT</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Justificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map((alumno, i) => {
                      const estado = asistencia[alumno.id];
                      const c = estado ? ESTADO_COLORS[estado] : null;
                      return (
                        <tr key={alumno.id} style={{
                          borderBottom: '1px solid var(--color-border)',
                          background: c ? c.light : 'var(--color-surface)',
                          transition: 'background 0.15s',
                        }}>
                          <td style={{ padding: '12px 16px', color: 'var(--color-foreground)', opacity: 0.4, fontWeight: 600 }}>{i + 1}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-foreground)' }}>{alumno.nombre_completo}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--color-foreground)', opacity: 0.5 }}>{alumno.rut}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              <button onClick={() => marcar(alumno.id, 'presente')} style={btnEstado(alumno.id, 'presente')}>P</button>
                              <button onClick={() => marcar(alumno.id, 'tardanza')} style={btnEstado(alumno.id, 'tardanza')}>T</button>
                              <button onClick={() => marcar(alumno.id, 'ausente')}  style={btnEstado(alumno.id, 'ausente')}>A</button>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {justificaciones[alumno.id] ? (
                              <span title={justificaciones[alumno.id]} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: 'var(--color-primary)' }}>
                                ✓ Justificado
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.3 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mensaje + botón guardar */}
            {alumnos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                {mensaje.texto && (
                  <div style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                    background: mensaje.tipo === 'exito' ? 'rgba(21,128,61,0.1)' : 'rgba(220,38,38,0.1)',
                    color:      mensaje.tipo === 'exito' ? '#15803d' : '#dc2626',
                    border:     `1px solid ${mensaje.tipo === 'exito' ? 'rgba(21,128,61,0.3)' : 'rgba(220,38,38,0.3)'}`,
                  }}>
                    {mensaje.texto}
                  </div>
                )}
                <button
                  onClick={guardar}
                  disabled={guardando}
                  style={{
                    background: guardando ? 'var(--color-muted)' : 'var(--color-primary)',
                    color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 32px',
                    fontSize: '14px', fontWeight: 700, cursor: guardando ? 'not-allowed' : 'pointer',
                    opacity: guardando ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Asistencia'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AsistenciaAnalytics() {
  const [statsCursos, setStatsCursos] = useState([]);
  const [estudiantesRiesgo, setEstudiantesRiesgo] = useState([]);
  const [topEstudiantes, setTopEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      try {
        const [resResumen, resRiesgo, resTop] = await Promise.all([
          apiFetch('/asistencia/resumen-cursos').then(r => r?.json()),
          apiFetch('/asistencia/analitica/riesgo').then(r => r?.json()),
          apiFetch('/asistencia/analitica/top').then(r => r?.json())
        ]);

        if (Array.isArray(resResumen)) setStatsCursos(resResumen);
        if (Array.isArray(resRiesgo)) setEstudiantesRiesgo(resRiesgo);
        if (Array.isArray(resTop)) setTopEstudiantes(resTop);
      } catch (err) {
        console.error('Error fetching attendance analytics:', err);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  if (cargando) return (
     <div style={{ textAlign: 'center', padding: '100px 0' }}>
       <div className="skeleton" style={{ height: '200px', borderRadius: '24px', marginBottom: '24px' }}></div>
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
         <div className="skeleton" style={{ height: '300px', borderRadius: '24px' }}></div>
         <div className="skeleton" style={{ height: '300px', borderRadius: '24px' }}></div>
       </div>
     </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Gráfico principal */}
      <div className="clay-card" style={{ padding: '28px', background: 'var(--color-surface)', borderRadius: '24px', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <School size={22} color="var(--color-primary)" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Rendimiento por Curso</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statsCursos}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--color-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12, fill: 'var(--color-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontWeight: 700 }}
            />
            <Bar dataKey="porcentaje" radius={[8, 8, 0, 0]} barSize={40}>
              {statsCursos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.porcentaje >= 90 ? '#10b981' : entry.porcentaje >= 75 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Alumnos en Riesgo */}
        <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '24px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <AlertCircle size={22} color="#ef4444" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Alumnos en Riesgo Crítico</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {estudiantesRiesgo.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5, fontSize: '13px' }}>No hay alertas críticas detectadas.</div>
            ) : estudiantesRiesgo.map(est => (
              <div key={est.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-muted)', borderRadius: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>{est.nombre_completo}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.5 }}>{est.nombre_curso}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>{est.porcentaje}%</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>Asistencia</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cuadro de Honor */}
        <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '24px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <CheckCircle size={22} color="#10b981" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Excelencia en Asistencia</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topEstudiantes.map(est => (
              <div key={est.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-muted)', borderRadius: '16px', borderLeft: '4px solid #10b981' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>{est.nombre_completo}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.5 }}>{est.nombre_curso}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>{est.porcentaje}%</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>Impecable</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Asistencia;
