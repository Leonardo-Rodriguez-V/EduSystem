import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

const s = {
  pageTitle:  { fontSize: '20px', fontWeight: 700, color: '#1A2B4A', marginBottom: '4px' },
  pageSub:    { fontSize: '13px', color: '#607D8B', marginBottom: '24px' },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  card:       { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' },
  cardTitle:  { fontSize: '15px', fontWeight: 600, color: '#1A2B4A', marginBottom: '16px' },
  kpiGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' },
  kpi:        (color) => ({ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: `4px solid ${color}`, textAlign: 'center' }),
  kpiVal:     { fontSize: '28px', fontWeight: 700, color: '#1A2B4A', margin: '4px 0' },
  kpiLbl:     { fontSize: '11px', color: '#607D8B', textTransform: 'uppercase', letterSpacing: '.5px' },
  tbl:        { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th:         { textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: 600, color: '#607D8B', textTransform: 'uppercase', borderBottom: '2px solid #E8EDF2' },
  td:         { padding: '9px 10px', borderBottom: '1px solid #E8EDF2', color: '#2D3A4A' },
  badge:      (bg, color) => ({ display: 'inline-block', padding: '2px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: bg, color }),
  empty:      { textAlign: 'center', padding: '30px', color: '#90A4AE', fontSize: '13px' },
};

function colorEstado(e) {
  if (e === 'presente') return ['#E8F5E9', '#2E7D32'];
  if (e === 'tardanza') return ['#FFF8E1', '#F57F17'];
  return ['#FFEBEE', '#C62828'];
}

function colorNota(n) {
  if (!n && n !== 0) return ['#F5F7FA', '#607D8B'];
  if (n >= 6) return ['#E8F5E9', '#2E7D32'];
  if (n >= 4) return ['#FFF8E1', '#F57F17'];
  return ['#FFEBEE', '#C62828'];
}

export default function PortalApoderado() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  const [alumno,      setAlumno]      = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [notas,       setNotas]       = useState([]);
  const [avisos,      setAvisos]      = useState([]);
  const [cargando,    setCargando]    = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        /* 1. Buscar alumno vinculado al apoderado */
        const resAlumnos = await apiFetch('/alumnos');
        const listaAlumnos = await resAlumnos?.json();
        if (!Array.isArray(listaAlumnos) || listaAlumnos.length === 0) return;

        /* Buscar alumno donde id_apoderado coincide con el usuario actual */
        const miAlumno = listaAlumnos.find(a => a.id_apoderado === usuario.id) || listaAlumnos[0];
        setAlumno(miAlumno);

        /* 2. Cargar datos en paralelo */
        const [resAsistencia, resNotas, resAvisos] = await Promise.all([
          apiFetch(`/asistencia/alumno/${miAlumno.id}`),
          apiFetch(`/notas?id_alumno=${miAlumno.id}`),
          miAlumno.id_curso ? apiFetch(`/avisos?id_curso=${miAlumno.id_curso}`) : Promise.resolve(null),
        ]);

        const [dataAsistencia, dataNotas, dataAvisos] = await Promise.all([
          resAsistencia?.json(),
          resNotas?.json(),
          resAvisos?.json(),
        ]);

        if (Array.isArray(dataAsistencia)) setAsistencias(dataAsistencia);
        if (Array.isArray(dataNotas))      setNotas(dataNotas);
        if (Array.isArray(dataAvisos))     setAvisos(dataAvisos);
      } catch (e) {
        console.error('Error al cargar datos del apoderado:', e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [usuario.id]);

  /* Métricas */
  const totalClases  = asistencias.length;
  const presentes    = asistencias.filter(a => a.estado === 'presente').length;
  const pctAsistencia = totalClases > 0 ? ((presentes / totalClases) * 100).toFixed(1) : '—';

  const promedioNotas = notas.length > 0
    ? (notas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notas.length).toFixed(1)
    : '—';

  if (cargando) return <p style={{ color: '#90A4AE', textAlign: 'center', padding: '60px' }}>Cargando información...</p>;

  if (!alumno) return (
    <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍👩‍👧</div>
      <div style={{ color: '#607D8B', fontSize: '14px' }}>No tienes un alumno vinculado a tu cuenta.</div>
      <div style={{ color: '#90A4AE', fontSize: '12px', marginTop: '8px' }}>Contacta al director para vincular tu cuenta.</div>
    </div>
  );

  return (
    <div>
      <div style={s.pageTitle}>Portal Apoderado</div>
      <div style={s.pageSub}>
        Seguimiento académico de <strong>{alumno.nombre_completo}</strong> · {alumno.nombre_curso}
      </div>

      {/* KPIs */}
      <div style={s.kpiGrid}>
        <div style={s.kpi('#1565C0')}>
          <div style={s.kpiLbl}>Asistencia</div>
          <div style={{ ...s.kpiVal, color: pctAsistencia < 85 ? '#C62828' : '#2E7D32' }}>{pctAsistencia}%</div>
          <div style={{ fontSize: '11px', color: '#90A4AE' }}>{presentes} de {totalClases} clases</div>
        </div>
        <div style={s.kpi('#2E7D32')}>
          <div style={s.kpiLbl}>Promedio general</div>
          <div style={{ ...s.kpiVal, color: colorNota(Number(promedioNotas))[1] }}>{promedioNotas}</div>
          <div style={{ fontSize: '11px', color: '#90A4AE' }}>{notas.length} evaluaciones</div>
        </div>
        <div style={s.kpi('#F57F17')}>
          <div style={s.kpiLbl}>Avisos del curso</div>
          <div style={s.kpiVal}>{avisos.length}</div>
          <div style={{ fontSize: '11px', color: '#90A4AE' }}>publicados</div>
        </div>
      </div>

      <div style={s.grid2}>
        {/* Últimas asistencias */}
        <div style={s.card}>
          <div style={s.cardTitle}>📋 Asistencia reciente</div>
          {asistencias.length === 0 ? (
            <div style={s.empty}>Sin registros de asistencia</div>
          ) : (
            <table style={s.tbl}>
              <thead>
                <tr>
                  <th style={s.th}>Fecha</th>
                  <th style={s.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.slice(0, 10).map(a => (
                  <tr key={a.id}>
                    <td style={s.td}>{new Date(a.fecha).toLocaleDateString('es-CL')}</td>
                    <td style={s.td}>
                      <span style={s.badge(...colorEstado(a.estado))}>{a.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Notas */}
        <div style={s.card}>
          <div style={s.cardTitle}>📝 Calificaciones</div>
          {notas.length === 0 ? (
            <div style={s.empty}>Sin calificaciones registradas</div>
          ) : (
            <table style={s.tbl}>
              <thead>
                <tr>
                  <th style={s.th}>Evaluación</th>
                  <th style={s.th}>Nota</th>
                  <th style={s.th}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {notas.map(n => (
                  <tr key={n.id}>
                    <td style={s.td}>{n.descripcion}</td>
                    <td style={s.td}>
                      <span style={s.badge(...colorNota(n.calificacion))}>{parseFloat(n.calificacion).toFixed(1)}</span>
                    </td>
                    <td style={s.td}>{new Date(n.fecha).toLocaleDateString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Avisos del curso */}
      {avisos.length > 0 && (
        <div style={s.card}>
          <div style={s.cardTitle}>📢 Avisos del curso</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {avisos.slice(0, 5).map(a => (
              <div key={a.id} style={{ padding: '14px', background: '#F5F7FA', borderRadius: '10px', borderLeft: '3px solid #1565C0' }}>
                <div style={{ fontWeight: 600, color: '#1A2B4A', fontSize: '14px' }}>{a.titulo}</div>
                <div style={{ fontSize: '12px', color: '#90A4AE', margin: '3px 0 8px' }}>
                  {a.nombre_autor} · {new Date(a.creado_en).toLocaleDateString('es-CL')}
                </div>
                <div style={{ fontSize: '13px', color: '#455A64', lineHeight: '1.5' }}>{a.contenido}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
