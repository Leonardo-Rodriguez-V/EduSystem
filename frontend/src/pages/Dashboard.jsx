import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

const s = {
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' },
  pageTitle:  { fontSize: '20px', fontWeight: 700, color: '#1A2B4A' },
  pageSub:    { fontSize: '13px', color: '#607D8B', marginTop: '2px' },
  kpiGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  kpiCard:    (color) => ({ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: `4px solid ${color}` }),
  kpiLabel:   { fontSize: '12px', color: '#607D8B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' },
  kpiValue:   { fontSize: '32px', fontWeight: 700, color: '#1A2B4A', margin: '6px 0 4px' },
  kpiSub:     { fontSize: '12px', color: '#607D8B' },
  card:       { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: '20px' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  cardTitle:  { fontSize: '15px', fontWeight: 600, color: '#1A2B4A' },
  tbl:        { width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' },
  th:         { textAlign: 'left', padding: '10px 12px', fontSize: '11.5px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '2px solid #E8EDF2' },
  td:         { padding: '11px 12px', borderBottom: '1px solid #E8EDF2', color: '#2D3A4A', verticalAlign: 'middle' },
  badge:      (bg, color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: bg, color }),
  btn:        { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: '#1565C0', color: '#fff' },
};

export default function Dashboard() {
  const [cursos, setCursos]   = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  useEffect(() => {
    Promise.all([
      apiFetch('/cursos').catch(() => []),
      apiFetch('/alumnos').catch(() => []),
    ]).then(([c, a]) => {
      setCursos(Array.isArray(c) ? c : []);
      setAlumnos(Array.isArray(a) ? a : []);
    }).finally(() => setCargando(false));
  }, []);

  const totalAlumnos = alumnos.length;

  /* ── Render por rol ── */
  if (usuario.rol === 'director') return <DashboardDirector usuario={usuario} cursos={cursos} totalAlumnos={totalAlumnos} cargando={cargando} />;
  if (usuario.rol === 'profesor') return <DashboardProfesor usuario={usuario} cursos={cursos} totalAlumnos={totalAlumnos} cargando={cargando} />;
  return <DashboardGenerico usuario={usuario} cursos={cursos} />;
}

/* ────────── DIRECTOR ────────── */
function DashboardDirector({ usuario, cursos, totalAlumnos, cargando }) {
  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <div style={s.pageTitle}>Bienvenido, Director {usuario.nombre_completo?.split(' ')[0]}</div>
          <div style={s.pageSub}>Resumen general del establecimiento</div>
        </div>
        <button style={s.btn}>+ Nuevo aviso</button>
      </div>

      {/* KPIs */}
      <div style={s.kpiGrid}>
        <div style={s.kpiCard('#1565C0')}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={s.kpiLabel}>Total Alumnos</div>
              <div style={s.kpiValue}>{cargando ? '...' : totalAlumnos}</div>
              <div style={s.kpiSub}>Matriculados activos</div>
            </div>
            <span style={{ fontSize: '28px' }}>👤</span>
          </div>
        </div>
        <div style={s.kpiCard('#2E7D32')}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={s.kpiLabel}>Cursos Activos</div>
              <div style={s.kpiValue}>{cargando ? '...' : cursos.length}</div>
              <div style={s.kpiSub}>Año 2026</div>
            </div>
            <span style={{ fontSize: '28px' }}>📚</span>
          </div>
        </div>
        <div style={s.kpiCard('#F57F17')}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={s.kpiLabel}>Asistencia Promedio</div>
              <div style={s.kpiValue}>—</div>
              <div style={s.kpiSub}>Actualizar con datos reales</div>
            </div>
            <span style={{ fontSize: '28px' }}>📊</span>
          </div>
        </div>
      </div>

      {/* Cursos */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <span style={s.cardTitle}>Cursos registrados</span>
        </div>
        {cargando ? (
          <p style={{ color: '#90A4AE', fontSize: '13px' }}>Cargando...</p>
        ) : cursos.length === 0 ? (
          <p style={{ color: '#90A4AE', fontSize: '13px' }}>No hay cursos registrados.</p>
        ) : (
          <table style={s.tbl}>
            <thead>
              <tr>
                <th style={s.th}>Curso</th>
                <th style={s.th}>Año</th>
                <th style={s.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map(c => (
                <tr key={c.id} style={{ cursor: 'default' }}>
                  <td style={s.td}><strong>{c.nombre}</strong></td>
                  <td style={s.td}>{c.anio}</td>
                  <td style={s.td}><span style={s.badge('#E8F5E9', '#2E7D32')}>Activo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ────────── PROFESOR ────────── */
function DashboardProfesor({ usuario, cursos, totalAlumnos, cargando }) {
  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <div style={s.pageTitle}>Bienvenido, {usuario.nombre_completo?.split(' ')[0]}</div>
          <div style={s.pageSub}>Control de clases, alumnos y evaluaciones asignadas</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={s.kpiGrid}>
        <div style={s.kpiCard('#1565C0')}>
          <div style={s.kpiLabel}>Mis Cursos Jefes</div>
          <div style={s.kpiValue}>{cargando ? '...' : cursos.length}</div>
          <div style={s.kpiSub}>Cursos asignados</div>
        </div>
        <div style={s.kpiCard('#2E7D32')}>
          <div style={s.kpiLabel}>Mis Alumnos</div>
          <div style={s.kpiValue}>{cargando ? '...' : totalAlumnos}</div>
          <div style={s.kpiSub}>Total matriculados</div>
        </div>
        <div style={s.kpiCard('#F57F17')}>
          <div style={s.kpiLabel}>Pendientes</div>
          <div style={s.kpiValue}>0</div>
          <div style={s.kpiSub}>Asistencias sin registrar</div>
        </div>
      </div>

      {/* Cursos */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <span style={s.cardTitle}>Mis Cursos</span>
        </div>
        {cargando ? (
          <p style={{ color: '#90A4AE', fontSize: '13px' }}>Cargando...</p>
        ) : cursos.length === 0 ? (
          <p style={{ color: '#90A4AE', fontSize: '13px' }}>No tienes cursos asignados.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {cursos.map(c => (
              <div key={c.id} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.08)', border: '1px solid #E8EDF2' }}>
                <div style={{ background: 'linear-gradient(135deg, #1565C0, #42A5F5)', padding: '24px 16px' }}>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>{c.nombre}</div>
                </div>
                <div style={{ background: '#fff', padding: '14px 16px' }}>
                  <span style={{ fontSize: '12px', background: '#E3F2FD', color: '#1565C0', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>AÑO {c.anio}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────── GENÉRICO (apoderado / alumno) ────────── */
function DashboardGenerico({ usuario }) {
  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <div style={s.pageTitle}>Bienvenido, {usuario.nombre_completo}</div>
          <div style={s.pageSub}>Portal EduSync</div>
        </div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Información del sistema</div>
        <p style={{ color: '#607D8B', fontSize: '13.5px', marginTop: '12px' }}>
          Usa el menú lateral para navegar entre las secciones disponibles.
        </p>
      </div>
    </div>
  );
}
