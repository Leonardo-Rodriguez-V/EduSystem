const pool = require('../config/db');
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
} = require('docx');

const DIAS_LABEL   = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORA_A_BLOQUE = { '08:00:00': 0, '09:45:00': 1, '11:30:00': 2, '13:45:00': 3, '15:30:00': 4 };
const HORAS_LABEL   = ['08:00 – 09:30', '09:45 – 11:15', '11:30 – 13:00', '13:45 – 15:15', '15:30 – 17:00'];

function celdaH(texto, bgColor) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: bgColor },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: texto, bold: true, color: 'FFFFFF', size: 18 })] })],
  });
}

function buildTabla(filas) {
  const grilla = {};
  for (const f of filas) {
    if (!grilla[f.bloque]) grilla[f.bloque] = {};
    grilla[f.bloque][f.dia] = { asignatura: f.asignatura, profesor: f.profesor };
  }
  const borde = { style: BorderStyle.SINGLE, size: 4, color: 'B8CCE4' };
  const borders = { top: borde, bottom: borde, left: borde, right: borde };

  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        celdaH('Hora', '1F4E79'),
        ...DIAS_LABEL.slice(1).map(d => celdaH(d, '2E75B6')),
      ],
    }),
  ];

  HORAS_LABEL.forEach((horaLabel, bIdx) => {
    const isAlt = bIdx % 2 === 1;
    rows.push(new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.SOLID, color: isAlt ? '1F4E79' : '2E75B6' },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: horaLabel, bold: true, color: 'FFFFFF', size: 16 })] })],
        }),
        ...[1, 2, 3, 4, 5].map(dia => {
          const slot = grilla[bIdx]?.[dia];
          const bg = isAlt ? 'D6E4F0' : 'FFFFFF';
          if (!slot) return new TableCell({ shading: { type: ShadingType.SOLID, color: bg }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '—', color: 'AAAAAA', size: 16 })] })] });
          return new TableCell({
            shading: { type: ShadingType.SOLID, color: bg },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            borders,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: slot.asignatura, bold: true, size: 16 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: slot.profesor || '', size: 14, color: '555555', italics: true })] }),
            ],
          });
        }),
      ],
    }));
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

// GET /api/horarios/exportar?id_curso=X  (omitir id_curso = todos los cursos)
const exportarHorarioWord = async (req, res) => {
  const { id_curso } = req.query;
  try {
    const cursosQuery = id_curso
      ? `SELECT id, nombre FROM cursos WHERE id = $1`
      : `SELECT DISTINCT c.id, c.nombre FROM cursos c JOIN horario h ON h.id_curso = c.id ORDER BY c.nombre`;
    const { rows: cursos } = await pool.query(cursosQuery, id_curso ? [id_curso] : []);

    if (cursos.length === 0) return res.status(404).json({ error: 'No hay horario disponible para exportar.' });

    const slotsQuery = id_curso
      ? `SELECT h.id_curso, h.dia_semana::int AS dia, h.hora_inicio, a.nombre AS asignatura, u.nombre_completo AS profesor FROM horario h JOIN asignaturas a ON a.id = h.id_asignatura LEFT JOIN usuarios u ON u.id = h.id_profesor WHERE h.id_curso = $1 ORDER BY h.dia_semana, h.hora_inicio`
      : `SELECT h.id_curso, h.dia_semana::int AS dia, h.hora_inicio, a.nombre AS asignatura, u.nombre_completo AS profesor FROM horario h JOIN asignaturas a ON a.id = h.id_asignatura LEFT JOIN usuarios u ON u.id = h.id_profesor ORDER BY h.id_curso, h.dia_semana, h.hora_inicio`;
    const { rows: slots } = await pool.query(slotsQuery, id_curso ? [id_curso] : []);

    const porCurso = {};
    for (const s of slots) {
      if (!porCurso[s.id_curso]) porCurso[s.id_curso] = [];
      const bIdx = HORA_A_BLOQUE[s.hora_inicio];
      if (bIdx === undefined) continue;
      porCurso[s.id_curso].push({ bloque: bIdx, dia: s.dia, asignatura: s.asignatura, profesor: s.profesor });
    }

    const children = [
      new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: 'EduSync — Horarios Institucionales', bold: true, size: 36, color: '1F4E79' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: `Año ${new Date().getFullYear()} · Jornada Escolar Completa`, size: 22, color: '555555' })] }),
    ];

    let first = true;
    for (const curso of cursos) {
      if (!first) children.push(new Paragraph({ children: [] }));
      children.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: first ? 0 : 400, after: 160 }, children: [new TextRun({ text: `Horario — ${curso.nombre}`, bold: true, size: 28, color: '1F4E79' })] }),
        buildTabla(porCurso[curso.id] ?? []),
      );
      first = false;
    }

    const doc = new Document({
      styles: { default: { document: { run: { font: 'Calibri', size: 20 } } } },
      sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } }, children }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = id_curso ? `Horario_Curso_${id_curso}.docx` : 'Horarios_EduSync.docx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar horario:', error);
    res.status(500).json({ error: 'Error al generar el archivo Word.' });
  }
};

// GET /api/horarios/curso/:id_curso
const obtenerHorarioPorCurso = async (req, res) => {
  const { id_curso } = req.params;
  try {
    const respuesta = await pool.query(
      `SELECT h.id, h.id_curso, h.dia_semana, h.hora_inicio, h.hora_fin,
              TO_CHAR(h.hora_inicio, 'HH24:MI') AS bloque_inicio,
              TO_CHAR(h.hora_fin,   'HH24:MI') AS bloque_fin,
              a.nombre AS nombre_asignatura,
              u.nombre_completo AS nombre_profesor
       FROM horario h
       JOIN asignaturas a ON h.id_asignatura = a.id
       LEFT JOIN usuarios u ON h.id_profesor = u.id
       WHERE h.id_curso = $1
       ORDER BY h.dia_semana, h.hora_inicio`,
      [id_curso]
    );
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener horario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  obtenerHorarioPorCurso,
  exportarHorarioWord,
};
