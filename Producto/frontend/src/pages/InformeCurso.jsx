import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiFetch from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, GraduationCap, Users, TrendingUp, AlertTriangle } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function promedio(arr) {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function colorCSS(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return { color: 'var(--color-foreground)', bg: 'transparent', op: 0.3 };
  if (n >= 5.5) return { color: '#15803d', bg: 'rgba(21,128,61,0.12)', op: 1 };
  if (n >= 4)   return { color: '#b45309', bg: 'rgba(180,83,9,0.10)',  op: 1 };
  return           { color: '#b91c1c', bg: 'rgba(185,28,28,0.10)', op: 1 };
}

function colorPDF(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return [170, 170, 170];
  if (n >= 5.5) return [21, 128, 61];
  if (n >= 4)   return [180, 83, 9];
  return           [185, 28, 28];
}

function agruparPorAlumno(notas) {
  const map = {};
  for (const n of notas) {
    const sid  = n.id_alumno;
    const asig = n.nombre_asignatura || 'Sin asignatura';
    if (!map[sid])       map[sid] = {};
    if (!map[sid][asig]) map[sid][asig] = [];
    map[sid][asig].push(parseFloat(n.calificacion));
  }
  return map;
}

// ── PDF: curso completo (landscape) ──────────────────────────────────────────

function exportarPDFCurso(curso, filas, asignaturas) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const hoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(22); doc.setTextColor(99, 102, 241);
  doc.text('EduSync', 148, 18, { align: 'center' });
  doc.setFontSize(14); doc.setTextColor(68, 68, 68);
  doc.text(`Informe de Curso — ${curso.nombre}`, 148, 27, { align: 'center' });
  doc.setFontSize(10); doc.setTextColor(136, 136, 136);
  doc.text(`Generado el ${hoy}`, 148, 35, { align: 'center' });

  const headers = ['Alumno', ...asignaturas, 'Prom. General', 'Asistencia'];
  const body = filas.map(f => [
    f.nombre_completo,
    ...asignaturas.map(a => f.promsPorAsig[a] !== null ? f.promsPorAsig[a].toFixed(1) : '—'),
    f.promGeneral !== null ? f.promGeneral.toFixed(1) : '—',
    f.pctAsist !== null ? `${f.pctAsist}%` : '—',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [headers],
    body,
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 0: { cellWidth: 48 } },
    didParseCell: (d) => {
      if (d.section !== 'body' || d.column.index === 0) return;
      const isAsist = d.column.index === headers.length - 1;
      if (isAsist) {
        const pct = parseInt(d.cell.text[0]);
        if (!isNaN(pct)) {
          d.cell.styles.textColor = pct >= 85 ? [16, 185, 129] : [185, 28, 28];
          d.cell.styles.fontStyle = 'bold';
        }
      } else {
        const val = parseFloat(d.cell.text[0]);
        if (!isNaN(val)) {
          d.cell.styles.textColor = colorPDF(val);
          d.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  doc.save(`Informe_Curso_${curso.nombre.replace(/ /g, '_')}.pdf`);
}

// ── PDF: alumno individual ────────────────────────────────────────────────────

function exportarPDFAlumno(alumno, notas, asistencia) {
  const doc = new jsPDF();
  const hoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(22); doc.setTextColor(99, 102, 241);
  doc.text('EduSync', 105, 20, { align: 'center' });
  doc.setFontSize(14); doc.setTextColor(68, 68, 68);
  doc.text('Informe Individual del Estudiante', 105, 30, { align: 'center' });
  doc.setFontSize(10); doc.setTextColor(136, 136, 136);
  doc.text(`Generado el ${hoy}`, 105, 38, { align: 'center' });
  doc.setFontSize(11); doc.setTextColor(17, 17, 17);
  doc.text(`Alumno: ${alumno.nombre_completo}`, 14, 52);
  doc.text(`RUT: ${alumno.rut || '—'}`, 14, 60);
  doc.text(`Curso: ${alumno.nombre_curso || '—'}`, 14, 68);

  if (notas.length > 0) {
    const prom = notas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notas.length;
    doc.setFontSize(13);
    doc.setTextColor(...colorPDF(prom));
    doc.text(`Promedio General: ${prom.toFixed(1)}`, 105, 80, { align: 'center' });
  }

  autoTable(doc, {
    startY: 88,
    head: [['Descripción', 'Asignatura', 'Nota', 'Fecha']],
    body: [...notas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(n => [
      n.descripcion || '—',
      n.nombre_asignatura || '—',
      parseFloat(n.calificacion).toFixed(1),
      n.fecha ? new Date(n.fecha).toLocaleDateString('es-CL') : '—',
    ]),
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    didParseCell: (d) => {
      if (d.column.index === 2 && d.section === 'body') {
        d.cell.styles.textColor = colorPDF(d.cell.text[0]);
        d.cell.styles.fontStyle = 'bold';
      }
    },
  });

  if (asistencia && asistencia.total > 0) {
    const y = doc.lastAutoTable.finalY + 14;
    const pct = Math.round((asistencia.presentes / asistencia.total) * 100);
    doc.setFontSize(12); doc.setTextColor(17, 17, 17);
    doc.text('Resumen de Asistencia', 14, y);
    doc.setFontSize(10); doc.setTextColor(68, 68, 68);
    doc.text(
      `Presentes: ${asistencia.presentes}  |  Ausentes: ${asistencia.ausentes}  |  Tardanzas: ${asistencia.tardanzas}  |  Total: ${asistencia.total} días`,
      14, y + 8,
    );
    doc.setFontSize(13); doc.setTextColor(...(pct >= 85 ? [16, 185, 129] : [185, 28, 28]));
    doc.text(`Asistencia: ${pct}%`, 14, y + 18);
  }

  doc.save(`Informe_${alumno.nombre_completo.replace(/ /g, '_')}.pdf`);
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function InformeCurso() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();

  const [cursos,       setCursos]       = useState([]);
  const [cursoSel,     setCursoSel]     = useState(null);
  const [alumnos,      setAlumnos]      = useState([]);
  const [notas,        setNotas]        = useState([]);
  const [asistencias,  setAsistencias]  = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [cargandoData, setCargandoData] = useState(false);

  // Cargar cursos del profesor (o todos si es director)
  useEffect(() => {
    const url = usuario.rol === 'director' ? '/cursos' : `/cursos?id_profesor=${usuario.id}`;
    apiFetch(url)
      .then(r => r?.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCursos(data);
          setCursoSel(data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [usuario.id, usuario.rol]);

  // Cargar datos cuando cambia el curso
  useEffect(() => {
    if (!cursoSel) return;
    setCargandoData(true);
    Promise.all([
      apiFetch(`/alumnos?id_curso=${cursoSel.id}`).then(r => r?.json()).catch(() => []),
      apiFetch(`/notas/curso/${cursoSel.id}`).then(r => r?.json()).catch(() => []),
      apiFetch(`/asistencia/resumen-alumnos/${cursoSel.id}`).then(r => r?.json()).catch(() => []),
    ]).then(([als, nts, asis]) => {
      setAlumnos(Array.isArray(als) ? als : []);
      setNotas(Array.isArray(nts) ? nts : []);
      setAsistencias(Array.isArray(asis) ? asis : []);
    }).finally(() => setCargandoData(false));
  }, [cursoSel]);

  // ── Datos derivados ─────────────────────────────────────────────────────────
  const porAlumno    = agruparPorAlumno(notas);
  const asistMap     = Object.fromEntries(asistencias.map(a => [a.id, a]));
  const asignaturas  = [...new Set(notas.map(n => n.nombre_asignatura || 'Sin asignatura'))].sort();

  const filas = alumnos.map(al => {
    const grades      = porAlumno[al.id] || {};
    const promsPorAsig = Object.fromEntries(
      asignaturas.map(a => [a, promedio(grades[a] || [])])
    );
    const promGeneral = promedio(Object.values(grades).flat());
    const asist       = asistMap[al.id];
    const pctAsist    = asist?.total > 0 ? Math.round((asist.presentes / asist.total) * 100) : null;
    return { ...al, promsPorAsig, promGeneral, asist, pctAsist };
  });

  const promsValidos  = filas.map(f => f.promGeneral).filter(p => p !== null);
  const promCurso     = promedio(promsValidos);
  const asistValidos  = filas.filter(f => f.pctAsist !== null);
  const pctAsistCurso = asistValidos.length
    ? Math.round(asistValidos.reduce((s, f) => s + f.pctAsist, 0) / asistValidos.length)
    : null;
  const enRiesgo = filas.filter(f => f.promGeneral !== null && f.promGeneral < 4).length;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (cargando) return (
    <div style={{ padding: '80px', textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
    </div>
  );

  if (!cursoSel && !cargando) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div className="clay-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px', borderRadius: '28px' }}>
        <GraduationCap size={56} color="var(--color-primary)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-foreground)' }}>Sin cursos asignados</h2>
        <p style={{ color: 'var(--color-foreground)', opacity: 0.5, marginTop: '8px' }}>No se encontraron cursos asociados a tu cuenta.</p>
      </div>
    </div>
  );

  const kpis = [
    { label: 'Alumnos',       value: alumnos.length,                       icon: Users,          color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)' },
    { label: 'Promedio Curso', value: promCurso !== null ? promCurso.toFixed(1) : '—', icon: GraduationCap,  ...colorKPI(promCurso, 'nota') },
    { label: 'Asistencia',    value: pctAsistCurso !== null ? `${pctAsistCurso}%` : '—', icon: TrendingUp, ...colorKPI(pctAsistCurso, 'asist') },
    { label: 'En Riesgo',     value: enRiesgo,                              icon: AlertTriangle,  color: enRiesgo > 0 ? '#b91c1c' : '#15803d', bg: enRiesgo > 0 ? 'rgba(185,28,28,0.1)' : 'rgba(21,128,61,0.12)', border: enRiesgo > 0 ? 'rgba(185,28,28,0.3)' : 'rgba(21,128,61,0.3)' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 0 48px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-foreground)', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
            Informe de Curso
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-foreground)', opacity: 0.5, marginTop: '4px', fontWeight: 600 }}>
            {cursoSel?.nombre} · Año Lectivo {new Date().getFullYear()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {cursos.length > 1 && (
            <select
              value={cursoSel?.id || ''}
              onChange={e => setCursoSel(cursos.find(c => String(c.id) === e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', outline: 'none' }}
            >
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          )}
          <button
            onClick={() => exportarPDFCurso(cursoSel, filas, asignaturas)}
            disabled={!filas.length || cargandoData}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '14px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: filas.length && !cargandoData ? 'pointer' : 'not-allowed', opacity: (!filas.length || cargandoData) ? 0.5 : 1 }}
          >
            <FileDown size={15} /> Exportar PDF del Curso
          </button>
        </div>
      </div>

      {cargandoData ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {kpis.map(({ label, value, icon: Icon, color, bg, border }) => (
              <motion.div key={label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px 24px', boxShadow: 'var(--clay-shadow)', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: bg, borderRadius: '14px', padding: '12px', border: `2px solid ${border}` }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-foreground)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Tabla ── */}
          {filas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
              <GraduationCap size={48} color="var(--color-primary)" style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ color: 'var(--color-foreground)', opacity: 0.5, fontWeight: 600 }}>No hay datos disponibles para este curso</p>
            </div>
          ) : (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)', boxShadow: 'var(--clay-shadow)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-muted)' }}>
                      <Th align="left"  minW={200}>Alumno</Th>
                      {asignaturas.map(a => (
                        <Th key={a} minW={90}>{a.split(' ').slice(0, 2).join(' ')}</Th>
                      ))}
                      <Th minW={110} color="#6366f1">Prom. General</Th>
                      <Th minW={100} color="#0ea5e9">Asistencia</Th>
                      <Th minW={70}>PDF</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila, i) => (
                      <tr key={fila.id} style={{ borderTop: '1px solid var(--color-border)', background: i % 2 !== 0 ? 'var(--color-muted)' : 'transparent' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                          {fila.nombre_completo}
                        </td>

                        {asignaturas.map(asig => {
                          const p = fila.promsPorAsig[asig];
                          const c = colorCSS(p);
                          return (
                            <td key={asig} style={{ padding: '10px 12px', textAlign: 'center' }}>
                              {p !== null
                                ? <span style={{ fontWeight: 700, color: c.color, background: c.bg, padding: '3px 10px', borderRadius: '8px' }}>{p.toFixed(1)}</span>
                                : <span style={{ color: 'var(--color-foreground)', opacity: 0.25 }}>—</span>}
                            </td>
                          );
                        })}

                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          {fila.promGeneral !== null
                            ? <span style={{ fontWeight: 800, color: colorCSS(fila.promGeneral).color, background: colorCSS(fila.promGeneral).bg, padding: '4px 12px', borderRadius: '10px', fontSize: '14px' }}>{fila.promGeneral.toFixed(1)}</span>
                            : <span style={{ opacity: 0.25 }}>—</span>}
                        </td>

                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          {fila.pctAsist !== null
                            ? <span style={{ fontWeight: 700, color: fila.pctAsist >= 85 ? '#10b981' : '#b91c1c', background: fila.pctAsist >= 85 ? 'rgba(16,185,129,0.12)' : 'rgba(185,28,28,0.1)', padding: '3px 10px', borderRadius: '8px' }}>{fila.pctAsist}%</span>
                            : <span style={{ opacity: 0.25 }}>—</span>}
                        </td>

                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => exportarPDFAlumno(fila, notas.filter(n => n.id_alumno === fila.id), asistMap[fila.id])}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', border: 'none', background: 'rgba(99,102,241,0.12)', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '11px' }}
                          >
                            <FileDown size={12} /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.4, fontWeight: 600 }}>
                {alumnos.length} alumnos · {asignaturas.length} asignaturas · {notas.length} evaluaciones registradas
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Th({ children, align = 'center', minW, color }) {
  return (
    <th style={{
      padding: '14px 12px', textAlign: align, fontWeight: 800, fontSize: '11px',
      textTransform: 'uppercase', letterSpacing: '.5px',
      color: color || 'var(--color-foreground)',
      opacity: color ? 1 : 0.55,
      whiteSpace: 'nowrap', minWidth: minW,
    }}>
      {children}
    </th>
  );
}

function colorKPI(val, tipo) {
  if (tipo === 'nota') {
    if (val === null) return { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' };
    if (val >= 5.5)   return { color: '#15803d', bg: 'rgba(21,128,61,0.12)',  border: 'rgba(21,128,61,0.3)' };
    if (val >= 4)     return { color: '#b45309', bg: 'rgba(180,83,9,0.10)',   border: 'rgba(180,83,9,0.3)' };
    return                   { color: '#b91c1c', bg: 'rgba(185,28,28,0.10)', border: 'rgba(185,28,28,0.3)' };
  }
  if (tipo === 'asist') {
    if (val === null || val >= 85) return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
    return { color: '#b91c1c', bg: 'rgba(185,28,28,0.10)', border: 'rgba(185,28,28,0.3)' };
  }
  return { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' };
}
