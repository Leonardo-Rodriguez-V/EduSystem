import { useState, useEffect } from 'react';
import apiFetch from '../utils/api';
import DateInputCL from '../components/DateInputCL';

const ASIG_COLORS = [
  '#1565c0','#6a1b9a','#2e7d32','#c62828','#00838f',
  '#e65100','#558b2f','#37474f','#ad1457','#4527a0',
];

const getAsigColor = (nombre = '') => {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return ASIG_COLORS[Math.abs(hash) % ASIG_COLORS.length];
};

const getDiasRestantes = (fecha) => {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const ev  = new Date(fecha); ev.setHours(0,0,0,0);
  return Math.round((ev - hoy) / (1000 * 60 * 60 * 24));
};

const chipUrgencia = (dias) => {
  if (dias < 0)   return { label: 'Pasada',   bg: 'rgba(100,100,100,0.12)', color: '#888' };
  if (dias === 0) return { label: 'Hoy',      bg: 'rgba(220,38,38,0.15)',  color: '#dc2626' };
  if (dias <= 3)  return { label: `${dias}d`, bg: 'rgba(220,38,38,0.12)',  color: '#dc2626' };
  if (dias <= 7)  return { label: `${dias}d`, bg: 'rgba(217,119,6,0.12)', color: '#d97706' };
  return               { label: `${dias}d`,   bg: 'rgba(21,128,61,0.1)',  color: '#15803d' };
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Genera la grilla del mes: array de 42 celdas (6 semanas × 7 días)
function generarGrilla(anio, mes) {
  const primero = new Date(anio, mes, 1);
  const ultimo  = new Date(anio, mes + 1, 0);
  // offset lunes=0 … domingo=6
  const offset  = (primero.getDay() + 6) % 7;
  const celdas  = [];
  // días del mes anterior
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(anio, mes, -i);
    celdas.push({ fecha: d, mesActual: false });
  }
  // días del mes actual
  for (let d = 1; d <= ultimo.getDate(); d++) {
    celdas.push({ fecha: new Date(anio, mes, d), mesActual: true });
  }
  // rellenar hasta 42
  while (celdas.length < 42) {
    const d = new Date(anio, mes + 1, celdas.length - offset - ultimo.getDate() + 1);
    celdas.push({ fecha: d, mesActual: false });
  }
  return celdas;
}

function CalendarioMensual({ evaluaciones, puedeEditar, onEditar, onEliminar, confirmId, setConfirmId }) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const [mes,  setMes]  = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [tooltip, setTooltip] = useState(null); // { ev, x, y }

  const celdas = generarGrilla(anio, mes);

  // Mapear evaluaciones por fecha YYYY-MM-DD
  const evPorFecha = {};
  for (const ev of evaluaciones) {
    const key = ev.fecha?.split('T')[0] || ev.fecha;
    if (!evPorFecha[key]) evPorFecha[key] = [];
    evPorFecha[key].push(ev);
  }

  const irMesAnterior = () => {
    if (mes === 0) { setMes(11); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  };
  const irMesSiguiente = () => {
    if (mes === 11) { setMes(0); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  };
  const irHoy = () => { setMes(hoy.getMonth()); setAnio(hoy.getFullYear()); };

  const fechaKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      {/* Navegación */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <button onClick={irMesAnterior} style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-foreground)', fontWeight: 700 }}>‹</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-foreground)' }}>{MESES[mes]} {anio}</span>
          <button onClick={irHoy} style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', color: 'var(--color-foreground)', fontWeight: 700 }}>Hoy</button>
        </div>
        <button onClick={irMesSiguiente} style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-foreground)', fontWeight: 700 }}>›</button>
      </div>

      {/* Cabecera días semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)' }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>{d}</div>
        ))}
      </div>

      {/* Grilla */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {celdas.map((celda, i) => {
          const key  = fechaKey(celda.fecha);
          const evs  = evPorFecha[key] || [];
          const esHoy = celda.fecha.getTime() === hoy.getTime();
          const borde = i % 7 !== 6 ? '1px solid var(--color-border)' : 'none';
          const bordeInf = i < 35 ? '1px solid var(--color-border)' : 'none';
          return (
            <div key={i} style={{
              minHeight: '90px', padding: '6px', boxSizing: 'border-box',
              borderRight: borde, borderBottom: bordeInf,
              background: !celda.mesActual ? 'var(--color-muted)' : 'var(--color-surface)',
              opacity: !celda.mesActual ? 0.5 : 1,
            }}>
              {/* Número del día */}
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px',
                background: esHoy ? 'var(--color-primary)' : 'transparent',
                color: esHoy ? '#fff' : 'var(--color-foreground)',
                fontSize: '12px', fontWeight: esHoy ? 800 : 600, opacity: esHoy ? 1 : 0.7,
              }}>{celda.fecha.getDate()}</div>

              {/* Chips de evaluaciones */}
              {evs.slice(0, 3).map(ev => (
                <div key={ev.id}
                  title={`${ev.titulo} — ${ev.nombre_asignatura}`}
                  onClick={() => setTooltip(t => t?.ev?.id === ev.id ? null : { ev })}
                  style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', marginBottom: '2px',
                    background: getAsigColor(ev.nombre_asignatura) + '22',
                    color: getAsigColor(ev.nombre_asignatura),
                    cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    borderLeft: `3px solid ${getAsigColor(ev.nombre_asignatura)}`,
                  }}>
                  {ev.titulo}
                </div>
              ))}
              {evs.length > 3 && (
                <div style={{ fontSize: '10px', color: 'var(--color-foreground)', opacity: 0.45, fontWeight: 600 }}>+{evs.length - 3} más</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip detalle evaluación */}
      {tooltip && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400 }} onClick={() => setTooltip(null)}>
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px',
            padding: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', maxWidth: '320px', width: '90%', zIndex: 401,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ height: '3px', background: getAsigColor(tooltip.ev.nombre_asignatura), borderRadius: '2px', marginBottom: '14px' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: getAsigColor(tooltip.ev.nombre_asignatura), marginBottom: '6px' }}>{tooltip.ev.nombre_asignatura}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '6px' }}>{tooltip.ev.titulo}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.5, marginBottom: tooltip.ev.descripcion ? '8px' : '14px' }}>
              {new Date(tooltip.ev.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
            </div>
            {tooltip.ev.descripcion && <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.7, marginBottom: '14px', lineHeight: 1.5 }}>{tooltip.ev.descripcion}</div>}
            {puedeEditar && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { onEditar(tooltip.ev); setTooltip(null); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-foreground)', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>Editar</button>
                <button onClick={() => { onEliminar(tooltip.ev.id); setTooltip(null); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--color-destructive)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>Eliminar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const FORM_VACIO = { id_asignatura: '', titulo: '', descripcion: '', fecha: '' };

const s = {
  title:   { fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)' },
  select:  { padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 600, background: 'var(--color-surface)', color: 'var(--color-primary)', outline: 'none', cursor: 'pointer' },
  btnPlus: { background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  label:   { fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.6, marginBottom: '5px', display: 'block' },
  input:   { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-muted)', color: 'var(--color-foreground)', fontSize: '13px', marginBottom: '14px', boxSizing: 'border-box', outline: 'none' },
  btnSec:  { padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: '11px', background: 'transparent', color: 'var(--color-foreground)', fontWeight: 600 },
  btnDel:  { padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--color-destructive)', cursor: 'pointer', fontSize: '11px', background: 'transparent', color: 'var(--color-destructive)', fontWeight: 600 },
};

export default function Calendario() {
  const [cursos,       setCursos]       = useState([]);
  const [cursoSel,     setCursoSel]     = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [asignaturas,  setAsignaturas]  = useState([]);

  // Modal crear / editar
  const [modal,      setModal]      = useState(false);
  const [editando,   setEditando]   = useState(null); // evaluación a editar
  const [form,       setForm]       = useState(FORM_VACIO);
  const [guardando,  setGuardando]  = useState(false);

  // Confirmación eliminación
  const [confirmId, setConfirmId] = useState(null);

  // Vista lista / calendario
  const [vista, setVista] = useState('mensual');

  const usuario    = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();
  const esProfesor = usuario.rol === 'profesor';
  const esDirector = usuario.rol === 'director';
  const puedeEditar = esProfesor || esDirector;

  // Cargar cursos
  useEffect(() => {
    if (usuario.rol === 'apoderado') {
      apiFetch(`/alumnos/apoderado/${usuario.id}`).then(r => r?.json()).then(data => {
        if (!Array.isArray(data) || data.length === 0) { setCargando(false); return; }
        const vistos = new Set(); const cursosHijos = [];
        for (const a of data) {
          if (a.id_curso && !vistos.has(a.id_curso)) {
            vistos.add(a.id_curso);
            cursosHijos.push({ id: a.id_curso, nombre: a.nombre_curso, nombre_alumno: a.nombre_completo });
          }
        }
        setCursos(cursosHijos); setCursoSel(cursosHijos[0] || null);
      }).catch(() => {}).finally(() => setCargando(false));
      return;
    }
    const url = esProfesor ? `/cursos?id_profesor=${usuario.id}` : '/cursos';
    apiFetch(url).then(r => r?.json()).then(data => {
      if (Array.isArray(data)) { setCursos(data); setCursoSel(data[0] || null); }
    }).finally(() => setCargando(false));
  }, [usuario.id, usuario.rol]);

  // Cargar evaluaciones y asignaturas cuando cambia curso
  useEffect(() => {
    if (!cursoSel) return;
    apiFetch(`/evaluaciones/curso/${cursoSel.id}`)
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setEvaluaciones(data); });

    if (esProfesor) {
      apiFetch(`/notas/config/asignaturas?id_profesor=${usuario.id}&id_curso=${cursoSel.id}`)
        .then(r => r?.json()).then(data => { if (Array.isArray(data)) setAsignaturas(data); });
    } else if (esDirector) {
      apiFetch(`/notas/asignaturas-curso/${cursoSel.id}`)
        .then(r => r?.json()).then(data => { if (Array.isArray(data)) setAsignaturas(data); });
    }
  }, [cursoSel, usuario.id]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setModal(true);
  };

  const abrirEditar = (ev) => {
    setEditando(ev);
    setForm({
      id_asignatura: ev.id_asignatura,
      titulo: ev.titulo,
      descripcion: ev.descripcion || '',
      fecha: ev.fecha?.split('T')[0] || ev.fecha,
    });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.id_asignatura || !form.titulo || !form.fecha) return;
    setGuardando(true);
    try {
      if (editando) {
        const res = await apiFetch(`/evaluaciones/${editando.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        if (res?.ok) {
          const actualizada = await res.json();
          // Re-fetch para obtener nombre_asignatura y nombre_profesor actualizados
          const data = await apiFetch(`/evaluaciones/curso/${cursoSel.id}`).then(r => r?.json());
          if (Array.isArray(data)) setEvaluaciones(data);
          cerrarModal();
        }
      } else {
        const res = await apiFetch('/evaluaciones', {
          method: 'POST',
          body: JSON.stringify({ ...form, id_curso: cursoSel.id, id_profesor: usuario.id }),
        });
        if (res?.ok) {
          const data = await apiFetch(`/evaluaciones/curso/${cursoSel.id}`).then(r => r?.json());
          if (Array.isArray(data)) setEvaluaciones(data);
          cerrarModal();
        }
      }
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    const res = await apiFetch(`/evaluaciones/${id}`, { method: 'DELETE' });
    if (res?.ok) {
      setEvaluaciones(prev => prev.filter(e => e.id !== id));
      setConfirmId(null);
    }
  };

  const cerrarModal = () => { setModal(false); setEditando(null); setForm(FORM_VACIO); };

  // Agrupar por mes
  const ordenadas = [...evaluaciones].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const porMes = {};
  for (const ev of ordenadas) {
    const d   = new Date(ev.fecha);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!porMes[key]) porMes[key] = { mes: MESES[d.getMonth()], año: d.getFullYear(), items: [] };
    porMes[key].items.push(ev);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={s.title}>Calendario de Evaluaciones</div>
          <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.5, marginTop: '2px' }}>
            {cursoSel?.nombre_alumno ? `${cursoSel.nombre_alumno.split(' ')[0]} — ` : ''}{cursoSel?.nombre}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {cursos.length > 1 && (
            <select style={s.select} value={cursoSel?.id || ''} onChange={e => setCursoSel(cursos.find(c => c.id === parseInt(e.target.value)))}>
              {cursos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre_alumno ? `${c.nombre_alumno.split(' ')[0]} — ${c.nombre}` : c.nombre}
                </option>
              ))}
            </select>
          )}
          {/* Toggle vista */}
          <div style={{ display: 'flex', background: 'var(--color-muted)', borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            {[['mensual', '📅 Mes'], ['lista', '☰ Lista']].map(([v, label]) => (
              <button key={v} onClick={() => setVista(v)} style={{ padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                background: vista === v ? 'var(--color-primary)' : 'transparent',
                color: vista === v ? '#fff' : 'var(--color-foreground)',
              }}>{label}</button>
            ))}
          </div>
          {puedeEditar && (
            <button style={s.btnPlus} onClick={abrirCrear}>+ Nueva Evaluación</button>
          )}
        </div>
      </div>

      {/* Vista mensual */}
      {!cargando && vista === 'mensual' && (
        <CalendarioMensual
          evaluaciones={evaluaciones}
          puedeEditar={puedeEditar}
          onEditar={abrirEditar}
          onEliminar={eliminar}
          confirmId={confirmId}
          setConfirmId={setConfirmId}
        />
      )}

      {/* Vista lista */}
      {vista === 'lista' && cargando ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.4 }}>Cargando evaluaciones...</div>
        </div>
      ) : vista === 'lista' && evaluaciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', background: 'var(--color-surface)', borderRadius: '16px', border: '2px dashed var(--color-border)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>Sin evaluaciones programadas</div>
          <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.45 }}>
            {puedeEditar ? 'Usa el botón "Nueva Evaluación" para agregar una.' : 'El profesor aún no ha programado evaluaciones.'}
          </div>
        </div>
      ) : vista === 'lista' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {Object.values(porMes).map(({ mes, año, items }) => (
            <div key={`${mes}${año}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {mes} {año}
                </div>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.4 }}>{items.length} evaluación{items.length !== 1 ? 'es' : ''}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {items.map(ev => {
                  const dias  = getDiasRestantes(ev.fecha);
                  const chip  = chipUrgencia(dias);
                  const color = getAsigColor(ev.nombre_asignatura);
                  const pasada = dias < 0;
                  return (
                    <div key={ev.id} style={{
                      background: 'var(--color-surface)', borderRadius: '12px',
                      border: '1px solid var(--color-border)', overflow: 'hidden',
                      opacity: pasada ? 0.7 : 1, boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                    }}>
                      <div style={{ height: '4px', background: color }} />

                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color, letterSpacing: '0.5px' }}>
                            {ev.nombre_asignatura}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: chip.bg, color: chip.color }}>
                            {chip.label}
                          </span>
                        </div>

                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '6px', lineHeight: 1.3 }}>
                          {ev.titulo}
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.55, marginBottom: ev.descripcion ? '8px' : 0 }}>
                          {new Date(ev.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                        </div>

                        {ev.descripcion && (
                          <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.7, lineHeight: 1.5, marginBottom: '8px' }}>
                            {ev.descripcion}
                          </div>
                        )}

                        <div style={{ paddingTop: '10px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.4 }}>
                            {ev.nombre_profesor || 'Profesor asignado'}
                          </span>

                          {/* Botones editar / eliminar */}
                          {puedeEditar && (
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                              {confirmId === ev.id ? (
                                <>
                                  <span style={{ fontSize: '11px', color: 'var(--color-destructive)', fontWeight: 600 }}>¿Eliminar?</span>
                                  <button style={s.btnDel} onClick={() => eliminar(ev.id)}>Sí</button>
                                  <button style={s.btnSec} onClick={() => setConfirmId(null)}>No</button>
                                </>
                              ) : (
                                <>
                                  <button style={s.btnSec} onClick={() => abrirEditar(ev)}>Editar</button>
                                  <button style={s.btnDel} onClick={() => setConfirmId(ev.id)}>Eliminar</button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Modal crear / editar evaluación */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) cerrarModal(); }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', border: '1px solid var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '20px' }}>
              {editando ? 'Editar Evaluación' : 'Programar Evaluación'}
            </div>

            <label style={s.label}>Asignatura</label>
            <select style={s.input} value={form.id_asignatura} onChange={e => setForm({ ...form, id_asignatura: e.target.value })}>
              <option value="">Selecciona una asignatura...</option>
              {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>

            <label style={s.label}>Título</label>
            <input style={s.input} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Prueba Unidad 1" />

            <label style={s.label}>Fecha</label>
            <DateInputCL style={s.input} value={form.fecha} onChange={fecha => setForm({ ...form, fecha })} />

            <label style={s.label}>Descripción (opcional)</label>
            <textarea style={{ ...s.input, height: '80px', resize: 'vertical', marginBottom: '20px' }}
              value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Contenidos a evaluar..." />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={cerrarModal} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-foreground)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={!form.id_asignatura || !form.titulo || !form.fecha || guardando}
                style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px', opacity: (!form.id_asignatura || !form.titulo || !form.fecha || guardando) ? 0.6 : 1 }}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar Evaluación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
