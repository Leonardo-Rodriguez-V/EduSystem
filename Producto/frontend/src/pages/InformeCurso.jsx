import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiFetch from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, GraduationCap, Users, TrendingUp, AlertTriangle, Lock, SlidersHorizontal, CheckSquare, X, Eye } from 'lucide-react';
import FichaAlumno from '../components/FichaAlumno';

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

// ── PDF: Informe Formato MINEDUC ─────────────────────────────────────────────
// Campos exigidos: establecimiento, RBD, curso, año, RUT alumno, nombre, asistencia,
// promedio por asignatura, promedio general, situación final (aprobado/reprobado/pendiente).

function exportarPDFMineduc(colegio, curso, filas, asignaturas) {
  const doc   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const hoy   = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const anio  = new Date().getFullYear();
  const ancho = doc.internal.pageSize.getWidth();

  // ── Encabezado institucional ──────────────────────────────────────────────
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, ancho, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13); doc.setFont(undefined, 'bold');
  doc.text('MINISTERIO DE EDUCACIÓN — REPÚBLICA DE CHILE', ancho / 2, 9, { align: 'center' });
  doc.setFontSize(10); doc.setFont(undefined, 'normal');
  doc.text('Informe de Notas Anual — Formato SIGE/MINEDUC', ancho / 2, 16, { align: 'center' });

  // ── Datos del establecimiento ─────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  const datos = [
    `Establecimiento: ${colegio || 'EduSync'}`,
    `RBD: — (registrar antes de enviar)`,
    `Curso: ${curso.nombre}`,
    `Año Escolar: ${anio}`,
    `Fecha emisión: ${hoy}`,
  ];
  let xd = 14, yd = 28;
  datos.forEach(d => { doc.text(d, xd, yd); yd += 6; });

  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.4);
  doc.line(14, 57, ancho - 14, 57);

  // ── Tabla de notas ────────────────────────────────────────────────────────
  const APROBACION = 4.0;
  const ASIST_MIN  = 85;

  const headers = [
    'N°', 'RUT', 'Apellidos y Nombres',
    ...asignaturas.map(a => a.split(' ').slice(0, 2).join(' ')),
    'Prom.\nGeneral', 'Asist.\n%', 'Situación\nFinal',
  ];

  const body = filas.map((f, idx) => {
    const fila = [
      idx + 1,
      f.rut || '—',
      f.nombre_completo,
    ];
    asignaturas.forEach(a => {
      const p = f.promsPorAsig[a];
      fila.push(p !== null ? p.toFixed(1) : '—');
    });
    fila.push(f.promGeneral !== null ? f.promGeneral.toFixed(1) : '—');
    fila.push(f.pctAsist    !== null ? `${f.pctAsist}%` : '—');

    let situacion = '—';
    if (f.promGeneral !== null && f.pctAsist !== null) {
      situacion = (f.promGeneral >= APROBACION && f.pctAsist >= ASIST_MIN) ? 'APROBADO' : 'REPROBADO';
    } else if (f.promGeneral !== null || f.pctAsist !== null) {
      situacion = 'PENDIENTE';
    }
    fila.push(situacion);
    return fila;
  });

  autoTable(doc, {
    startY: 60,
    head: [headers],
    body,
    headStyles: {
      fillColor: [0, 51, 102], textColor: 255,
      fontStyle: 'bold', fontSize: 7,
      halign: 'center', valign: 'middle',
    },
    bodyStyles: { fontSize: 7.5, valign: 'middle' },
    alternateRowStyles: { fillColor: [232, 240, 254] },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 20, halign: 'center', font: 'courier' },
      2: { cellWidth: 48 },
      [headers.length - 3]: { halign: 'center', fontStyle: 'bold' },
      [headers.length - 2]: { halign: 'center' },
      [headers.length - 1]: { halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const last = headers.length - 1;
      const prev = headers.length - 3;
      if (data.column.index === last) {
        const v = data.cell.text[0];
        if (v === 'APROBADO')  data.cell.styles.textColor = [21, 128, 61];
        if (v === 'REPROBADO') data.cell.styles.textColor = [185, 28, 28];
        if (v === 'PENDIENTE') data.cell.styles.textColor = [180, 83, 9];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.index === prev) {
        const val = parseFloat(data.cell.text[0]);
        if (!isNaN(val)) data.cell.styles.textColor = colorPDF(val);
      }
    },
  });

  // ── Pie de página ─────────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
  doc.text(`Aprobación: prom. ≥ ${APROBACION} y asistencia ≥ ${ASIST_MIN}%  |  Generado por EduSync  |  ${hoy}`, 14, finalY);
  doc.text('_________________________\nDirector(a) del Establecimiento', ancho - 60, finalY + 6);

  doc.save(`Informe_MINEDUC_${curso.nombre.replace(/ /g, '_')}_${anio}.pdf`);
}

// ── PDF: curso completo ───────────────────────────────────────────────────────

function exportarPDFCurso(curso, filas, asignaturas, opciones, fechaDesde, fechaHasta) {
  const { incluirNotas, incluirAsistencia } = opciones;
  const doc = new jsPDF({ orientation: 'landscape' });
  const hoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(22); doc.setTextColor(99, 102, 241);
  doc.text('EduSync', 148, 18, { align: 'center' });
  doc.setFontSize(14); doc.setTextColor(68, 68, 68);
  doc.text(`Informe de Curso — ${curso.nombre}`, 148, 27, { align: 'center' });
  doc.setFontSize(10); doc.setTextColor(136, 136, 136);

  let subtitulo = `Generado el ${hoy}`;
  if (fechaDesde || fechaHasta) {
    subtitulo += `  ·  Período: ${fechaDesde || '—'} al ${fechaHasta || '—'}`;
  }
  doc.text(subtitulo, 148, 35, { align: 'center' });

  const headers = ['Alumno'];
  if (incluirNotas) headers.push(...asignaturas, 'Prom. General');
  if (incluirAsistencia) headers.push('Asistencia');

  const body = filas.map(f => {
    const fila = [f.nombre_completo];
    if (incluirNotas) {
      asignaturas.forEach(a => fila.push(f.promsPorAsig[a] !== null ? f.promsPorAsig[a].toFixed(1) : '—'));
      fila.push(f.promGeneral !== null ? f.promGeneral.toFixed(1) : '—');
    }
    if (incluirAsistencia) fila.push(f.pctAsist !== null ? `${f.pctAsist}%` : '—');
    return fila;
  });

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
      const isAsist = incluirAsistencia && d.column.index === headers.length - 1;
      if (isAsist) {
        const pct = parseInt(d.cell.text[0]);
        if (!isNaN(pct)) {
          d.cell.styles.textColor = pct >= 85 ? [16, 185, 129] : [185, 28, 28];
          d.cell.styles.fontStyle = 'bold';
        }
      } else if (incluirNotas) {
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

function exportarPDFAlumno(alumno, notas, asistencia, opciones, fechaDesde, fechaHasta) {
  const { incluirNotas, incluirAsistencia } = opciones;
  const doc = new jsPDF();
  const hoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(22); doc.setTextColor(99, 102, 241);
  doc.text('EduSync', 105, 20, { align: 'center' });
  doc.setFontSize(14); doc.setTextColor(68, 68, 68);
  doc.text('Informe Individual del Estudiante', 105, 30, { align: 'center' });
  doc.setFontSize(10); doc.setTextColor(136, 136, 136);
  doc.text(`Generado el ${hoy}`, 105, 38, { align: 'center' });
  if (fechaDesde || fechaHasta) {
    doc.text(`Período: ${fechaDesde || '—'} al ${fechaHasta || '—'}`, 105, 44, { align: 'center' });
  }

  doc.setFontSize(11); doc.setTextColor(17, 17, 17);
  const yBase = (fechaDesde || fechaHasta) ? 56 : 52;
  doc.text(`Alumno: ${alumno.nombre_completo}`, 14, yBase);
  doc.text(`RUT: ${alumno.rut || '—'}`, 14, yBase + 8);
  doc.text(`Curso: ${alumno.nombre_curso || '—'}`, 14, yBase + 16);

  let startY = yBase + 28;

  if (incluirNotas && notas.length > 0) {
    const prom = notas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notas.length;
    doc.setFontSize(13);
    doc.setTextColor(...colorPDF(prom));
    doc.text(`Promedio General: ${prom.toFixed(1)}`, 105, startY, { align: 'center' });
    startY += 10;

    autoTable(doc, {
      startY,
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
    startY = doc.lastAutoTable.finalY + 14;
  }

  if (incluirAsistencia && asistencia && asistencia.total > 0) {
    const pct = Math.round((asistencia.presentes / asistencia.total) * 100);
    doc.setFontSize(12); doc.setTextColor(17, 17, 17);
    doc.text('Resumen de Asistencia', 14, startY);
    doc.setFontSize(10); doc.setTextColor(68, 68, 68);
    doc.text(
      `Presentes: ${asistencia.presentes}  |  Ausentes: ${asistencia.ausentes}  |  Tardanzas: ${asistencia.tardanzas}  |  Total: ${asistencia.total} días`,
      14, startY + 8,
    );
    doc.setFontSize(13); doc.setTextColor(...(pct >= 85 ? [16, 185, 129] : [185, 28, 28]));
    doc.text(`Asistencia: ${pct}%`, 14, startY + 18);
  }

  doc.save(`Informe_${alumno.nombre_completo.replace(/ /g, '_')}.pdf`);
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ label, icon: Icon, color, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 14px', borderRadius: '12px', border: `2px solid ${checked ? color : 'var(--color-border)'}`,
        background: checked ? `${color}18` : 'var(--color-surface)',
        cursor: 'pointer', fontWeight: 700, fontSize: '13px',
        color: checked ? color : 'var(--color-foreground)', opacity: checked ? 1 : 0.55,
        transition: 'all 0.15s',
      }}
    >
      {checked ? <CheckSquare size={15} color={color} /> : <X size={15} />}
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function InformeCurso() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')); } catch { return {}; } })();
  const esPremium = !usuario?.plan || usuario.plan !== 'basico';

  const [cursos,       setCursos]       = useState([]);
  const [cursoSel,     setCursoSel]     = useState(null);
  const [alumnos,      setAlumnos]      = useState([]);
  const [notas,        setNotas]        = useState([]);
  const [asistencias,  setAsistencias]  = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [cargandoData, setCargandoData] = useState(false);
  const [fichaAlumno,  setFichaAlumno]  = useState(null);

  // Filtros Premium
  const [fechaDesde,        setFechaDesde]        = useState('');
  const [fechaHasta,        setFechaHasta]        = useState('');
  const [incluirNotas,      setIncluirNotas]      = useState(true);
  const [incluirAsistencia, setIncluirAsistencia] = useState(true);

  // Cargar cursos
  useEffect(() => {
    const url = usuario.rol === 'director' ? '/cursos' : `/cursos?id_profesor=${usuario.id}`;
    apiFetch(url)
      .then(r => r?.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const lista = usuario.rol === 'profesor'
          ? data.filter(c => String(c.id_profesor_jefe) === String(usuario.id))
          : data;
        if (lista.length > 0) { setCursos(lista); setCursoSel(lista[0]); }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [usuario.id, usuario.rol]);

  // Cargar datos cuando cambia el curso o los filtros de fecha
  useEffect(() => {
    if (!cursoSel) return;
    setCargandoData(true);

    const asistQuery = new URLSearchParams();
    if (esPremium && fechaDesde) asistQuery.set('fecha_desde', fechaDesde);
    if (esPremium && fechaHasta) asistQuery.set('fecha_hasta', fechaHasta);
    const asistUrl = `/asistencia/resumen-alumnos/${cursoSel.id}${asistQuery.toString() ? `?${asistQuery}` : ''}`;

    Promise.all([
      apiFetch(`/alumnos?id_curso=${cursoSel.id}`).then(r => r?.json()).catch(() => []),
      apiFetch(`/notas/curso/${cursoSel.id}`).then(r => r?.json()).catch(() => []),
      apiFetch(asistUrl).then(r => r?.json()).catch(() => []),
    ]).then(([als, nts, asis]) => {
      setAlumnos(Array.isArray(als) ? als : []);
      setNotas(Array.isArray(nts) ? nts : []);
      setAsistencias(Array.isArray(asis) ? asis : []);
    }).finally(() => setCargandoData(false));
  }, [cursoSel, fechaDesde, fechaHasta]);

  // ── Filtrar notas por fecha (client-side) ───────────────────────────────────
  const notasFiltradas = notas.filter(n => {
    if (!esPremium) return true;
    const f = n.fecha ? new Date(n.fecha) : null;
    if (fechaDesde && f && f < new Date(fechaDesde)) return false;
    if (fechaHasta && f && f > new Date(fechaHasta + 'T23:59:59')) return false;
    return true;
  });

  // ── Datos derivados ─────────────────────────────────────────────────────────
  const porAlumno   = agruparPorAlumno(notasFiltradas);
  const asistMap    = Object.fromEntries(asistencias.map(a => [a.id, a]));
  const asignaturas = [...new Set(notasFiltradas.map(n => n.nombre_asignatura || 'Sin asignatura'))].sort();

  const filas = alumnos.map(al => {
    const grades      = porAlumno[al.id] || {};
    const promsPorAsig = Object.fromEntries(asignaturas.map(a => [a, promedio(grades[a] || [])]));
    const promGeneral  = promedio(Object.values(grades).flat());
    const asist        = asistMap[al.id];
    const pctAsist     = asist?.total > 0 ? Math.round((asist.presentes / asist.total) * 100) : null;
    return { ...al, promsPorAsig, promGeneral, asist, pctAsist };
  });

  const promsValidos  = filas.map(f => f.promGeneral).filter(p => p !== null);
  const promCurso     = promedio(promsValidos);
  const asistValidos  = filas.filter(f => f.pctAsist !== null);
  const pctAsistCurso = asistValidos.length
    ? Math.round(asistValidos.reduce((s, f) => s + f.pctAsist, 0) / asistValidos.length)
    : null;
  const enRiesgo = filas.filter(f => f.promGeneral !== null && f.promGeneral < 4).length;

  const opcionesPDF = { incluirNotas, incluirAsistencia };

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
    { label: 'Alumnos',       value: alumnos.length,                                              icon: Users,         color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)' },
    { label: 'Promedio Curso', value: promCurso !== null ? promCurso.toFixed(1) : '—',            icon: GraduationCap, ...colorKPI(promCurso, 'nota') },
    { label: 'Asistencia',    value: pctAsistCurso !== null ? `${pctAsistCurso}%` : '—',         icon: TrendingUp,    ...colorKPI(pctAsistCurso, 'asist') },
    { label: 'En Riesgo',     value: enRiesgo, icon: AlertTriangle,
      color:  enRiesgo > 0 ? '#b91c1c' : '#15803d',
      bg:     enRiesgo > 0 ? 'rgba(185,28,28,0.1)' : 'rgba(21,128,61,0.12)',
      border: enRiesgo > 0 ? 'rgba(185,28,28,0.3)' : 'rgba(21,128,61,0.3)' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 0 48px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
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

          {esPremium ? (
            <>
              <button
                onClick={() => exportarPDFCurso(cursoSel, filas, asignaturas, opcionesPDF, fechaDesde, fechaHasta)}
                disabled={!filas.length || cargandoData || (!incluirNotas && !incluirAsistencia)}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '14px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: (filas.length && !cargandoData) ? 'pointer' : 'not-allowed', opacity: (!filas.length || cargandoData || (!incluirNotas && !incluirAsistencia)) ? 0.5 : 1 }}>
                <FileDown size={15} /> PDF Curso
              </button>
              <button
                onClick={() => exportarPDFMineduc(usuario.nombre_colegio || 'EduSync', cursoSel, filas, asignaturas)}
                disabled={!filas.length || cargandoData}
                title="Exportar informe oficial en formato requerido por MINEDUC"
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '14px', border: '2px solid #003366', background: '#003366', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: (filas.length && !cargandoData) ? 'pointer' : 'not-allowed', opacity: (!filas.length || cargandoData) ? 0.5 : 1 }}>
                <FileDown size={15} /> Informe MINEDUC
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '14px', border: '2px solid var(--color-border)', background: 'var(--color-muted)', color: 'var(--color-foreground)', opacity: 0.45, fontSize: '13px', fontWeight: 700 }}>
              <Lock size={14} /> Exportar PDF — Plan Premium
            </div>
          )}
        </div>
      </div>

      {/* ── Filtros Premium ── */}
      {esPremium && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="clay-card"
          style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 800, fontSize: '13px' }}>
            <SlidersHorizontal size={16} /> Filtros del reporte
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, opacity: 0.6 }}>Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)', fontSize: '13px', outline: 'none' }} />
            <label style={{ fontSize: '12px', fontWeight: 700, opacity: 0.6 }}>Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)', fontSize: '13px', outline: 'none' }} />
            {(fechaDesde || fechaHasta) && (
              <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: 'rgba(185,28,28,0.1)', color: '#b91c1c', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                Limpiar
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <Toggle label="Notas"      icon={GraduationCap} color="#6366f1" checked={incluirNotas}      onChange={setIncluirNotas} />
            <Toggle label="Asistencia" icon={TrendingUp}    color="#0ea5e9" checked={incluirAsistencia} onChange={setIncluirAsistencia} />
          </div>
        </motion.div>
      )}

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
                      <Th align="left" minW={200}>Alumno</Th>
                      {incluirNotas && asignaturas.map(a => (
                        <Th key={a} minW={90}>{a.split(' ').slice(0, 2).join(' ')}</Th>
                      ))}
                      {incluirNotas && <Th minW={110} color="#6366f1">Prom. General</Th>}
                      {incluirAsistencia && <Th minW={100} color="#0ea5e9">Asistencia</Th>}
                      {esPremium && <Th minW={70}>PDF</Th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila, i) => (
                      <tr key={fila.id} style={{ borderTop: '1px solid var(--color-border)', background: i % 2 !== 0 ? 'var(--color-muted)' : 'transparent' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {fila.nombre_completo}
                            <button
                              onClick={() => setFichaAlumno(fila)}
                              title="Ver ficha completa del alumno"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', border: 'none', background: 'rgba(99,102,241,0.12)', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                              <Eye size={12} /> Ficha
                            </button>
                          </div>
                        </td>

                        {incluirNotas && asignaturas.map(asig => {
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

                        {incluirNotas && (
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            {fila.promGeneral !== null
                              ? <span style={{ fontWeight: 800, color: colorCSS(fila.promGeneral).color, background: colorCSS(fila.promGeneral).bg, padding: '4px 12px', borderRadius: '10px', fontSize: '14px' }}>{fila.promGeneral.toFixed(1)}</span>
                              : <span style={{ opacity: 0.25 }}>—</span>}
                          </td>
                        )}

                        {incluirAsistencia && (
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            {fila.pctAsist !== null
                              ? <span style={{ fontWeight: 700, color: fila.pctAsist >= 85 ? '#10b981' : '#b91c1c', background: fila.pctAsist >= 85 ? 'rgba(16,185,129,0.12)' : 'rgba(185,28,28,0.1)', padding: '3px 10px', borderRadius: '8px' }}>{fila.pctAsist}%</span>
                              : <span style={{ opacity: 0.25 }}>—</span>}
                          </td>
                        )}

                        {esPremium && (
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => exportarPDFAlumno(fila, notasFiltradas.filter(n => n.id_alumno === fila.id), asistMap[fila.id], opcionesPDF, fechaDesde, fechaHasta)}
                              disabled={!incluirNotas && !incluirAsistencia}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', border: 'none', background: 'rgba(99,102,241,0.12)', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '11px', opacity: (!incluirNotas && !incluirAsistencia) ? 0.4 : 1 }}
                            >
                              <FileDown size={12} /> PDF
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-foreground)', opacity: 0.4, fontWeight: 600 }}>
                {alumnos.length} alumnos · {asignaturas.length} asignaturas · {notasFiltradas.length} evaluaciones
                {(fechaDesde || fechaHasta) && ` · Período filtrado: ${fechaDesde || '…'} → ${fechaHasta || '…'}`}
              </div>
            </motion.div>
          )}
        </>
      )}

      {fichaAlumno && (
        <FichaAlumno alumno={fichaAlumno} onClose={() => setFichaAlumno(null)} />
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
