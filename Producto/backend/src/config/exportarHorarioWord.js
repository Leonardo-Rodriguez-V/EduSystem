require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const path = require('path');
const fs   = require('fs');

const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType,
} = require('docx');

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const BLOQUES = [
  '08:00 – 09:30',
  '09:45 – 11:15',
  '11:30 – 13:00',
  '13:45 – 15:15',
  '15:30 – 17:00',
];

// ─── Colores ─────────────────────────────────────────────────────────────────
const COLOR_HEADER_BG = '1F4E79'; // azul oscuro
const COLOR_DIA_BG    = '2E75B6'; // azul medio
const COLOR_ALT       = 'D6E4F0'; // azul muy claro (filas pares)

// ─── Celda de encabezado de tabla ────────────────────────────────────────────
function celdaHeader(texto, opts = {}) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: opts.color ?? COLOR_HEADER_BG },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: texto, bold: true, color: 'FFFFFF', size: 18 })],
    })],
    ...(opts.width ? { width: { size: opts.width, type: WidthType.PERCENTAGE } } : {}),
  });
}

// ─── Celda normal ─────────────────────────────────────────────────────────────
function celda(texto, opts = {}) {
  return new TableCell({
    shading: opts.bg ? { type: ShadingType.SOLID, color: opts.bg } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({
        text: texto ?? '',
        size: 16,
        bold: opts.bold ?? false,
        color: opts.color ?? '000000',
      })],
    })],
    ...(opts.width ? { width: { size: opts.width, type: WidthType.PERCENTAGE } } : {}),
  });
}

// ─── Tabla de horario de un curso ─────────────────────────────────────────────
function tablaHorario(filas) {
  // filas: { bloque, dia, asignatura, profesor }[]
  // Construir grilla [bloque][dia]
  const grilla = {};
  for (const f of filas) {
    if (!grilla[f.bloque]) grilla[f.bloque] = {};
    grilla[f.bloque][f.dia] = { asignatura: f.asignatura, profesor: f.profesor };
  }

  const bordeTenue = { style: BorderStyle.SINGLE, size: 4, color: 'B8CCE4' };
  const borders = { top: bordeTenue, bottom: bordeTenue, left: bordeTenue, right: bordeTenue };

  // Fila de encabezado
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      celdaHeader('Bloque / Hora', { width: 18 }),
      ...DIAS.slice(1).map(d => celdaHeader(d, { color: COLOR_DIA_BG, width: 16.4 })),
    ],
  });

  const rows = [headerRow];

  BLOQUES.forEach((horaLabel, bIdx) => {
    const bloque = bIdx; // índice 0-4
    const isAlt  = bIdx % 2 === 1;

    rows.push(new TableRow({
      children: [
        // Columna hora
        new TableCell({
          shading: { type: ShadingType.SOLID, color: isAlt ? '1F4E79' : '2E75B6' },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: horaLabel, bold: true, color: 'FFFFFF', size: 16 })],
          })],
        }),
        // Columnas días
        ...([1, 2, 3, 4, 5].map(dia => {
          const slot = grilla[bloque]?.[dia];
          const bgColor = isAlt ? COLOR_ALT : 'FFFFFF';
          if (!slot) return celda('—', { center: true, bg: bgColor, color: 'AAAAAA' });
          return new TableCell({
            shading: { type: ShadingType.SOLID, color: bgColor },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            borders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: slot.asignatura, bold: true, size: 16 })],
              }),
              slot.profesor
                ? new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: slot.profesor, size: 14, color: '555555', italics: true })],
                  })
                : new Paragraph({ children: [] }),
            ],
          });
        })),
      ],
    }));
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  try {
    // 1. Obtener todos los cursos que tienen horario
    const { rows: cursos } = await client.query(`
      SELECT DISTINCT c.id, c.nombre
      FROM cursos c
      JOIN horario h ON h.id_curso = c.id
      ORDER BY c.nombre
    `);

    if (cursos.length === 0) {
      console.error('⚠️  No hay datos en la tabla "horario". Ejecuta primero: npm run seed:horario');
      process.exit(1);
    }

    // 2. Obtener todo el horario de una vez
    const { rows: slots } = await client.query(`
      SELECT
        h.id_curso,
        h.dia_semana::int AS dia,
        h.hora_inicio,
        a.nombre AS asignatura,
        u.nombre_completo AS profesor
      FROM horario h
      JOIN asignaturas a ON a.id = h.id_asignatura
      LEFT JOIN usuarios u ON u.id = h.id_profesor
      ORDER BY h.id_curso, h.dia_semana, h.hora_inicio
    `);

    // 3. Calcular índice de bloque a partir de hora_inicio
    const horaABloque = { '08:00:00': 0, '09:45:00': 1, '11:30:00': 2, '13:45:00': 3, '15:30:00': 4 };

    // Agrupar por curso
    const porCurso = {};
    for (const s of slots) {
      if (!porCurso[s.id_curso]) porCurso[s.id_curso] = [];
      const bIdx = horaABloque[s.hora_inicio];
      if (bIdx === undefined) continue; // hora desconocida, ignorar
      porCurso[s.id_curso].push({ bloque: bIdx, dia: s.dia, asignatura: s.asignatura, profesor: s.profesor });
    }

    // 4. Construir secciones del documento
    const sections = [];
    let first = true;

    for (const curso of cursos) {
      const filas = porCurso[curso.id] ?? [];
      sections.push(
        // Separador entre cursos (excepto el primero)
        ...(first ? [] : [new Paragraph({ children: [] })]),
        // Título del curso
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: first ? 0 : 400, after: 160 },
          children: [
            new TextRun({
              text: `Horario — ${curso.nombre}`,
              bold: true,
              size: 28,
              color: '1F4E79',
            }),
          ],
        }),
        tablaHorario(filas),
      );
      first = false;
    }

    // 5. Crear documento
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Calibri', size: 20 },
          },
        },
      },
      sections: [{
        properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: 'EduSync — Horarios Institucionales', bold: true, size: 36, color: '1F4E79' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Año ${new Date().getFullYear()}  ·  Jornada Escolar Completa (JEC)`,
                size: 22,
                color: '555555',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [
              new TextRun({
                text: 'Enseñanza Media: salida viernes 13:30  ·  Básica y Parvularia: horario completo lunes a viernes',
                size: 18,
                color: '888888',
                italics: true,
              }),
            ],
          }),
          ...sections,
        ],
      }],
    });

    // 6. Guardar archivo
    const outputDir  = path.resolve(__dirname, '../../../../');
    const outputPath = path.join(outputDir, 'Horarios_EduSync.docx');
    const buffer     = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    console.log(`\n✅ Archivo generado: ${outputPath}`);
    console.log(`   Cursos incluidos : ${cursos.length}`);
    console.log(`   Bloques totales  : ${slots.length}`);

  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

main();
