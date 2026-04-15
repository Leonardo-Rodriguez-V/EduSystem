import { useState, useEffect } from 'react';
import apiFetch from '../utils/api';

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
  const hoy  = new Date(); hoy.setHours(0,0,0,0);
  const ev   = new Date(fecha); ev.setHours(0,0,0,0);
  return Math.round((ev - hoy) / (1000 * 60 * 60 * 24));
};

const chipUrgencia = (dias) => {
  if (dias < 0)  return { label: 'Pasada',        bg: 'rgba(100,100,100,0.12)', color: '#888' };
  if (dias === 0) return { label: 'Hoy',           bg: 'rgba(220,38,38,0.15)',  color: '#dc2626' };
  if (dias <= 3)  return { label: `${dias}d`,      bg: 'rgba(220,38,38,0.12)',  color: '#dc2626' };
  if (dias <= 7)  return { label: `${dias}d`,      bg: 'rgba(217,119,6,0.12)', color: '#d97706' };
  return             { label: `${dias}d`,           bg: 'rgba(21,128,61,0.1)',  color: '#15803d' };
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const s = {
  title:    { fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)' },
  select:   { padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 600, background: 'var(--color-surface)', color: 'var(--color-primary)', outline: 'none', cursor: 'pointer' },
  btnPlus:  { background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  label:    { fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.6, marginBottom: '5px', display: 'block' },
  input:    { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-muted)', color: 'var(--color-foreground)', fontSize: '13px', marginBottom: '14px', boxSizing: 'border-box', outline: 'none' },
};

export default function Calendario() {
  const [cursos,       setCursos]       = useState([]);
  const [cursoSel,     setCursoSel]     = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [modal,        setModal]        = useState(false);
  const [asignaturas,  setAsignaturas]  = useState([]);
  const [form,         setForm]         = useState({ id_asignatura: '', titulo: '', descripcion: '', fecha: '' });

  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();
  const esProfesor = usuario.rol === 'profesor';

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

  // Cargar evaluaciones y asignaturas
  useEffect(() => {
    if (!cursoSel) return;
    apiFetch(`/evaluaciones/curso/${cursoSel.id}`)
      .then(r => r?.json())
      .then(data => { if (Array.isArray(data)) setEvaluaciones(data); });
    if (esProfesor) {
      apiFetch(`/notas/config/asignaturas?id_profesor=${usuario.id}&id_curso=${cursoSel.id}`)
        .then(r => r?.json())
        .then(data => { if (Array.isArray(data)) setAsignaturas(data); });
    }
  }, [cursoSel, usuario.id]);

  const guardar = async () => {
    if (!form.id_asignatura || !form.titulo || !form.fecha) return;
    const res = await apiFetch('/evaluaciones', {
      method: 'POST',
      body: JSON.stringify({ ...form, id_curso: cursoSel.id, id_profesor: usuario.id }),
    });
    if (res?.ok) {
      const nueva = await res.json();
      setEvaluaciones(prev => [...prev, nueva].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      setModal(false);
      setForm({ id_asignatura: '', titulo: '', descripcion: '', fecha: '' });
    }
  };

  // Agrupar por mes, ordenadas por fecha
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
          {esProfesor && (
            <button style={s.btnPlus} onClick={() => setModal(true)}>+ Nueva Evaluación</button>
          )}
        </div>
      </div>

      {/* Contenido */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.4 }}>Cargando evaluaciones...</div>
        </div>
      ) : evaluaciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', background: 'var(--color-surface)', borderRadius: '16px', border: '2px dashed var(--color-border)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>Sin evaluaciones programadas</div>
          <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.45 }}>
            {esProfesor ? 'Usa el botón "Nueva Evaluación" para agregar una.' : 'El profesor aún no ha programado evaluaciones.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {Object.values(porMes).map(({ mes, año, items }) => (
            <div key={`${mes}${año}`}>
              {/* Encabezado de mes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {mes} {año}
                </div>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <div style={{ fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.4 }}>{items.length} evaluación{items.length !== 1 ? 'es' : ''}</div>
              </div>

              {/* Cards del mes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {items.map(ev => {
                  const dias   = getDiasRestantes(ev.fecha);
                  const chip   = chipUrgencia(dias);
                  const color  = getAsigColor(ev.nombre_asignatura);
                  const pasada = dias < 0;
                  return (
                    <div key={ev.id} style={{
                      background: 'var(--color-surface)',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      overflow: 'hidden',
                      opacity: pasada ? 0.6 : 1,
                      boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                      transition: 'transform 0.15s',
                    }}>
                      {/* Franja de color por asignatura */}
                      <div style={{ height: '4px', background: color }} />

                      <div style={{ padding: '16px' }}>
                        {/* Badge asignatura + chip urgencia */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color, letterSpacing: '0.5px' }}>
                            {ev.nombre_asignatura}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: chip.bg, color: chip.color }}>
                            {chip.label}
                          </span>
                        </div>

                        {/* Título */}
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '6px', lineHeight: 1.3 }}>
                          {ev.titulo}
                        </div>

                        {/* Fecha */}
                        <div style={{ fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.55, marginBottom: ev.descripcion ? '8px' : 0 }}>
                          {new Date(ev.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                        </div>

                        {/* Descripción */}
                        {ev.descripcion && (
                          <div style={{ fontSize: '13px', color: 'var(--color-foreground)', opacity: 0.7, lineHeight: 1.5 }}>
                            {ev.descripcion}
                          </div>
                        )}

                        {/* Footer */}
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-foreground)', opacity: 0.4 }}>
                          {ev.nombre_profesor || 'Profesor asignado'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva evaluación */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', border: '1px solid var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '20px' }}>
              Programar Evaluación
            </div>

            <label style={s.label}>Asignatura</label>
            <select style={s.input} value={form.id_asignatura} onChange={e => setForm({ ...form, id_asignatura: e.target.value })}>
              <option value="">Selecciona una asignatura...</option>
              {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>

            <label style={s.label}>Título</label>
            <input style={s.input} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Prueba Unidad 1" />

            <label style={s.label}>Fecha</label>
            <input type="date" style={s.input} value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />

            <label style={s.label}>Descripción (opcional)</label>
            <textarea style={{ ...s.input, height: '80px', resize: 'vertical', marginBottom: '20px' }}
              value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Contenidos a evaluar..." />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-foreground)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={guardar} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                disabled={!form.id_asignatura || !form.titulo || !form.fecha}>
                Guardar Evaluación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
