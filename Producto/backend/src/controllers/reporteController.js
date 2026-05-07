const pool = require('../config/db');
const PDFDocument = require('pdfkit');

// GET /api/reportes/notas/:id_alumno
const exportarNotasPDF = async (req, res) => {
  const { id_alumno } = req.params;
  try {
    const [alumnoR, notasR] = await Promise.all([
      pool.query(`
        SELECT al.nombre_completo, al.rut, c.nombre AS curso
        FROM alumnos al LEFT JOIN cursos c ON c.id = al.id_curso
        WHERE al.id = $1`, [id_alumno]),
      pool.query(`
        SELECT n.descripcion, n.calificacion, n.fecha,
               asig.nombre AS asignatura
        FROM notas n
        LEFT JOIN asignaturas asig ON asig.id = n.id_asignatura
        WHERE n.id_alumno = $1
        ORDER BY n.fecha DESC`, [id_alumno]),
    ]);

    if (alumnoR.rows.length === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    const alumno = alumnoR.rows[0];
    const notas = notasR.rows;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="notas_${alumno.nombre_completo.replace(/ /g, '_')}.pdf"`);
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).fillColor('#6366f1').text('EduSync', { align: 'center' });
    doc.fontSize(12).fillColor('#444').text('Reporte de Calificaciones', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#888').text(`Generado el ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown(1);

    // Datos del alumno
    doc.fontSize(11).fillColor('#111');
    doc.text(`Alumno: ${alumno.nombre_completo}`);
    doc.text(`RUT: ${alumno.rut || '—'}`);
    doc.text(`Curso: ${alumno.curso || '—'}`);
    doc.moveDown(1);

    // Calcular promedio general
    if (notas.length > 0) {
      const promedio = notas.reduce((s, n) => s + parseFloat(n.calificacion), 0) / notas.length;
      const color = promedio >= 4.0 ? '#10b981' : '#ef4444';
      doc.fontSize(13).fillColor(color).text(`Promedio General: ${promedio.toFixed(1)}`, { align: 'center' });
      doc.moveDown(0.8);
    }

    // Tabla de notas
    const col = { desc: 50, asig: 240, nota: 380, fecha: 450 };
    doc.fontSize(10).fillColor('#fff').rect(50, doc.y, 495, 20).fill('#6366f1');
    const yHead = doc.y - 20;
    doc.fillColor('#fff')
      .text('Descripción', col.desc, yHead + 5, { width: 185 })
      .text('Asignatura', col.asig, yHead + 5, { width: 135 })
      .text('Nota', col.nota, yHead + 5, { width: 65 })
      .text('Fecha', col.fecha, yHead + 5, { width: 90 });
    doc.moveDown(0.2);

    notas.forEach((n, i) => {
      const y = doc.y;
      if (i % 2 === 0) doc.rect(50, y, 495, 18).fill('#f1f5f9');
      const nota = parseFloat(n.calificacion);
      const noteColor = nota >= 4.0 ? '#10b981' : '#ef4444';
      doc.fillColor('#222')
        .fontSize(9)
        .text(n.descripcion || '—', col.desc, y + 4, { width: 185 })
        .text(n.asignatura || '—', col.asig, y + 4, { width: 135 })
        .fillColor(noteColor)
        .text(nota.toFixed(1), col.nota, y + 4, { width: 65 })
        .fillColor('#222')
        .text(n.fecha ? new Date(n.fecha).toLocaleDateString('es-CL') : '—', col.fecha, y + 4, { width: 90 });
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error('Error exportando notas PDF:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error generando PDF' });
  }
};

// GET /api/reportes/asistencia/:id_alumno
const exportarAsistenciaPDF = async (req, res) => {
  const { id_alumno } = req.params;
  try {
    const [alumnoR, asistR] = await Promise.all([
      pool.query(`
        SELECT al.nombre_completo, al.rut, c.nombre AS curso
        FROM alumnos al LEFT JOIN cursos c ON c.id = al.id_curso
        WHERE al.id = $1`, [id_alumno]),
      pool.query(`
        SELECT fecha, estado, justificacion
        FROM asistencia WHERE id_alumno = $1 ORDER BY fecha DESC`, [id_alumno]),
    ]);

    if (alumnoR.rows.length === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    const alumno = alumnoR.rows[0];
    const registros = asistR.rows;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="asistencia_${alumno.nombre_completo.replace(/ /g, '_')}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).fillColor('#6366f1').text('EduSync', { align: 'center' });
    doc.fontSize(12).fillColor('#444').text('Reporte de Asistencia', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#888').text(`Generado el ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#111');
    doc.text(`Alumno: ${alumno.nombre_completo}`);
    doc.text(`RUT: ${alumno.rut || '—'}`);
    doc.text(`Curso: ${alumno.curso || '—'}`);
    doc.moveDown(1);

    if (registros.length > 0) {
      const presentes = registros.filter(r => r.estado === 'presente').length;
      const pct = ((presentes / registros.length) * 100).toFixed(1);
      const color = parseFloat(pct) >= 85 ? '#10b981' : '#ef4444';
      doc.fontSize(13).fillColor(color).text(`Asistencia total: ${pct}% (${presentes}/${registros.length} clases)`, { align: 'center' });
      doc.moveDown(0.8);
    }

    const col = { fecha: 50, estado: 200, just: 310 };
    doc.fontSize(10).fillColor('#fff').rect(50, doc.y, 495, 20).fill('#10b981');
    const yHead = doc.y - 20;
    doc.fillColor('#fff')
      .text('Fecha', col.fecha, yHead + 5, { width: 145 })
      .text('Estado', col.estado, yHead + 5, { width: 105 })
      .text('Justificación', col.just, yHead + 5, { width: 235 });
    doc.moveDown(0.2);

    const estadoColor = { presente: '#10b981', ausente: '#ef4444', tardanza: '#f59e0b' };
    registros.forEach((r, i) => {
      const y = doc.y;
      if (i % 2 === 0) doc.rect(50, y, 495, 18).fill('#f1f5f9');
      doc.fillColor('#222').fontSize(9)
        .text(r.fecha ? new Date(r.fecha).toLocaleDateString('es-CL') : '—', col.fecha, y + 4, { width: 145 })
        .fillColor(estadoColor[r.estado] || '#222')
        .text(r.estado || '—', col.estado, y + 4, { width: 105 })
        .fillColor('#222')
        .text(r.justificacion || '—', col.just, y + 4, { width: 235 });
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error('Error exportando asistencia PDF:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error generando PDF' });
  }
};

module.exports = { exportarNotasPDF, exportarAsistenciaPDF };
