const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');

/**
 * POST /api/colegios/:id/importar
 * Body JSON: { archivo: "<base64 del .xlsx>" }
 *
 * Sheets esperados (en orden):
 *   Cursos      → nombre, anio
 *   Profesores  → nombre_completo, correo, contraseña
 *   Alumnos     → nombre_completo, rut, fecha_nacimiento, curso
 *   Asignaturas → nombre, curso, correo_profesor
 */
// Parsea DD/MM/YYYY o cualquier formato reconocible → Date válido o null
function parseFecha(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  const ddmm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) return new Date(`${ddmm[3]}-${ddmm[2].padStart(2, '0')}-${ddmm[1].padStart(2, '0')}`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Ejecuta una query con SAVEPOINT para que un error no aborte toda la transacción
async function safeQuery(client, query, params) {
  await client.query('SAVEPOINT sp');
  try {
    const result = await client.query(query, params);
    await client.query('RELEASE SAVEPOINT sp');
    return result;
  } catch (e) {
    await client.query('ROLLBACK TO SAVEPOINT sp');
    throw e;
  }
}

const importarDatos = async (req, res) => {
  const { id: colegio_id } = req.params;
  const { archivo } = req.body;

  if (!archivo) return res.status(400).json({ error: 'Se requiere el campo "archivo" en base64' });

  const client = await pool.connect();
  const resumen = { cursos: 0, profesores: 0, alumnos: 0, asignaturas: 0, errores: [] };

  try {
    // Verificar que el colegio existe
    const { rows: [colegio] } = await client.query('SELECT id FROM colegios WHERE id = $1', [colegio_id]);
    if (!colegio) return res.status(404).json({ error: 'Colegio no encontrado' });

    // Parsear Excel desde base64
    const buffer = Buffer.from(archivo, 'base64');
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const getSheet = (name) => {
      const ws = wb.Sheets[name];
      if (!ws) return [];
      return XLSX.utils.sheet_to_json(ws, { defval: '' });
    };

    const filaCursos      = getSheet('Cursos');
    const filaProfesores  = getSheet('Profesores');
    const filaAlumnos     = getSheet('Alumnos');
    const filaAsignaturas = getSheet('Asignaturas');

    await client.query('BEGIN');

    // ── 1. CURSOS ──────────────────────────────────────
    const mapCursos = {};
    for (const row of filaCursos) {
      const nombre = String(row.nombre || '').trim();
      const anio   = parseInt(row.anio) || new Date().getFullYear();
      if (!nombre) continue;
      try {
        const { rows: [cur] } = await safeQuery(client,
          `INSERT INTO cursos (nombre, anio, colegio_id)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [nombre, anio, colegio_id]
        );
        if (cur) { mapCursos[nombre] = cur.id; resumen.cursos++; }
        else {
          const { rows: [ex] } = await client.query(
            `SELECT id FROM cursos WHERE nombre = $1 AND colegio_id = $2`, [nombre, colegio_id]
          );
          if (ex) mapCursos[nombre] = ex.id;
        }
      } catch (e) { resumen.errores.push(`Curso "${nombre}": ${e.message}`); }
    }

    // ── 2. PROFESORES ──────────────────────────────────
    const mapProfesores = {};
    for (const row of filaProfesores) {
      const nombre   = String(row.nombre_completo || '').trim();
      const correo   = String(row.correo || '').trim().toLowerCase();
      const pass     = String(row.contraseña || row.contrasena || '').trim();
      if (!nombre || !correo || !pass) continue;
      try {
        const hash = await bcrypt.hash(pass, 10);
        const { rows: [prof] } = await safeQuery(client,
          `INSERT INTO usuarios (nombre_completo, correo, rol, contraseña, colegio_id)
           VALUES ($1, $2, 'profesor', $3, $4)
           ON CONFLICT (correo) DO UPDATE SET nombre_completo = EXCLUDED.nombre_completo
           RETURNING id`,
          [nombre, correo, hash, colegio_id]
        );
        mapProfesores[correo] = prof.id;
        resumen.profesores++;
      } catch (e) { resumen.errores.push(`Profesor "${correo}": ${e.message}`); }
    }

    // ── 3. ALUMNOS ─────────────────────────────────────
    for (const row of filaAlumnos) {
      const nombre = String(row.nombre_completo || '').trim();
      const rut    = String(row.rut || '').trim();
      const curso  = String(row.curso || '').trim();
      const fnac   = parseFecha(row.fecha_nacimiento);
      if (!nombre) continue;
      const id_curso = mapCursos[curso] || null;
      try {
        await safeQuery(client,
          `INSERT INTO alumnos (nombre_completo, rut, fecha_nacimiento, id_curso, colegio_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (rut) DO NOTHING`,
          [nombre, rut || null, fnac, id_curso, colegio_id]
        );
        resumen.alumnos++;
      } catch (e) { resumen.errores.push(`Alumno "${nombre}": ${e.message}`); }
    }

    // ── 4. ASIGNATURAS + ASIGNACIONES ──────────────────
    const mapAsignaturas = {};
    for (const row of filaAsignaturas) {
      const nombre      = String(row.nombre || '').trim();
      const cursoNombre = String(row.curso || '').trim();
      const correoPrf   = String(row.correo_profesor || '').trim().toLowerCase();
      if (!nombre) continue;
      try {
        if (!mapAsignaturas[nombre]) {
          const { rows: [asig] } = await safeQuery(client,
            `INSERT INTO asignaturas (nombre)
             VALUES ($1)
             ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
             RETURNING id`,
            [nombre]
          );
          mapAsignaturas[nombre] = asig.id;
          resumen.asignaturas++;
        }
        const id_curso    = mapCursos[cursoNombre] || null;
        const id_profesor = mapProfesores[correoPrf] || null;
        // Solo vincular si hay curso, asignatura Y profesor válidos
        if (id_curso && mapAsignaturas[nombre] && id_profesor) {
          await safeQuery(client,
            `INSERT INTO curso_asignatura_profesor (id_curso, id_asignatura, id_profesor)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [id_curso, mapAsignaturas[nombre], id_profesor]
          );
        }
      } catch (e) { resumen.errores.push(`Asignatura "${nombre}": ${e.message}`); }
    }

    await client.query('COMMIT');
    res.status(200).json({ mensaje: 'Importación completada', resumen });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[IMPORT] Error general:', err.message);
    res.status(500).json({ error: 'Error durante la importación', detalle: err.message });
  } finally {
    client.release();
  }
};

/**
 * GET /api/colegios/:id/plantilla
 * Descarga un Excel de ejemplo con datos realistas listos para editar y volver a subir
 */
const descargarPlantilla = (req, res) => {
  const wb = XLSX.utils.book_new();

  // ── HOJA 1: Cursos ──────────────────────────────────────────────────────────
  // nombre: nombre exacto del curso | anio: año lectivo
  const cursos = [
    { nombre: '1° Básico A',  anio: 2026 },
    { nombre: '1° Básico B',  anio: 2026 },
    { nombre: '2° Básico A',  anio: 2026 },
    { nombre: '3° Básico A',  anio: 2026 },
    { nombre: '4° Básico A',  anio: 2026 },
    { nombre: '5° Básico A',  anio: 2026 },
    { nombre: '6° Básico A',  anio: 2026 },
    { nombre: '7° Básico A',  anio: 2026 },
    { nombre: '8° Básico A',  anio: 2026 },
    { nombre: '1° Medio A',   anio: 2026 },
    { nombre: '2° Medio A',   anio: 2026 },
    { nombre: '3° Medio A',   anio: 2026 },
    { nombre: '4° Medio A',   anio: 2026 },
  ];

  // ── HOJA 2: Profesores ──────────────────────────────────────────────────────
  // contraseña: la que usará para su primer login (mínimo 8 caracteres)
  const profesores = [
    { nombre_completo: 'Ana Martínez González',   correo: 'ana.martinez@colegio.cl',   contraseña: 'Profesor2026!' },
    { nombre_completo: 'Luis Rojas Fuentes',      correo: 'luis.rojas@colegio.cl',      contraseña: 'Profesor2026!' },
    { nombre_completo: 'Carmen Silva Vera',        correo: 'carmen.silva@colegio.cl',    contraseña: 'Profesor2026!' },
    { nombre_completo: 'Jorge Muñoz Paredes',      correo: 'jorge.munoz@colegio.cl',     contraseña: 'Profesor2026!' },
    { nombre_completo: 'Patricia Soto Díaz',       correo: 'patricia.soto@colegio.cl',   contraseña: 'Profesor2026!' },
    { nombre_completo: 'Andrés Castro Molina',     correo: 'andres.castro@colegio.cl',   contraseña: 'Profesor2026!' },
    { nombre_completo: 'Valentina Torres Ríos',    correo: 'valentina.torres@colegio.cl',contraseña: 'Profesor2026!' },
  ];

  // ── HOJA 3: Alumnos ─────────────────────────────────────────────────────────
  // curso: debe coincidir EXACTAMENTE con el nombre en la hoja Cursos
  // fecha_nacimiento: formato DD/MM/AAAA
  // rut: con puntos y guión (puede dejarse vacío si no se tiene)
  const alumnos = [
    { nombre_completo: 'Sofía Pérez Ramírez',      rut: '22.111.001-1', fecha_nacimiento: '12/03/2016', curso: '1° Básico A' },
    { nombre_completo: 'Matías López Contreras',   rut: '22.111.002-2', fecha_nacimiento: '25/07/2016', curso: '1° Básico A' },
    { nombre_completo: 'Valentina Mora Herrera',   rut: '22.111.003-3', fecha_nacimiento: '08/11/2016', curso: '1° Básico A' },
    { nombre_completo: 'Benjamín Reyes Salinas',   rut: '22.111.004-4', fecha_nacimiento: '14/04/2016', curso: '1° Básico A' },
    { nombre_completo: 'Isidora Vargas Pinto',     rut: '22.111.005-5', fecha_nacimiento: '30/01/2016', curso: '1° Básico A' },
    { nombre_completo: 'Agustín Núñez Bravo',      rut: '22.222.001-6', fecha_nacimiento: '17/06/2015', curso: '1° Básico B' },
    { nombre_completo: 'Emilia Castro Jara',       rut: '22.222.002-7', fecha_nacimiento: '03/09/2015', curso: '1° Básico B' },
    { nombre_completo: 'Tomás Fernández Leal',     rut: '22.222.003-8', fecha_nacimiento: '21/02/2015', curso: '1° Básico B' },
    { nombre_completo: 'Catalina Sánchez Vera',    rut: '22.333.001-9', fecha_nacimiento: '05/08/2014', curso: '2° Básico A' },
    { nombre_completo: 'Diego Morales Espinoza',   rut: '22.333.002-K', fecha_nacimiento: '19/12/2014', curso: '2° Básico A' },
    { nombre_completo: 'Antonia Gutiérrez Flores', rut: '22.444.001-1', fecha_nacimiento: '27/05/2011', curso: '1° Medio A' },
    { nombre_completo: 'Ignacio Ramos Acuña',      rut: '22.444.002-2', fecha_nacimiento: '09/10/2011', curso: '1° Medio A' },
    { nombre_completo: 'Fernanda Araya Bustamante', rut: '22.444.003-3', fecha_nacimiento: '16/03/2011', curso: '1° Medio A' },
  ];

  // ── HOJA 4: Asignaturas ─────────────────────────────────────────────────────
  // Una fila por cada combinación curso + asignatura + profesor
  // Si el mismo profesor hace la misma asignatura en varios cursos, repetir la fila
  // correo_profesor: debe coincidir EXACTAMENTE con la hoja Profesores
  const asignaturas = [
    // 1° Básico A
    { nombre: 'Matemáticas',          curso: '1° Básico A', correo_profesor: 'ana.martinez@colegio.cl' },
    { nombre: 'Lenguaje y Comunicación', curso: '1° Básico A', correo_profesor: 'carmen.silva@colegio.cl' },
    { nombre: 'Ciencias Naturales',   curso: '1° Básico A', correo_profesor: 'luis.rojas@colegio.cl' },
    { nombre: 'Historia y Geografía', curso: '1° Básico A', correo_profesor: 'jorge.munoz@colegio.cl' },
    { nombre: 'Educación Física',     curso: '1° Básico A', correo_profesor: 'andres.castro@colegio.cl' },
    { nombre: 'Artes Visuales',       curso: '1° Básico A', correo_profesor: 'valentina.torres@colegio.cl' },
    // 1° Básico B
    { nombre: 'Matemáticas',          curso: '1° Básico B', correo_profesor: 'ana.martinez@colegio.cl' },
    { nombre: 'Lenguaje y Comunicación', curso: '1° Básico B', correo_profesor: 'carmen.silva@colegio.cl' },
    { nombre: 'Ciencias Naturales',   curso: '1° Básico B', correo_profesor: 'luis.rojas@colegio.cl' },
    { nombre: 'Historia y Geografía', curso: '1° Básico B', correo_profesor: 'jorge.munoz@colegio.cl' },
    // 2° Básico A
    { nombre: 'Matemáticas',          curso: '2° Básico A', correo_profesor: 'ana.martinez@colegio.cl' },
    { nombre: 'Lenguaje y Comunicación', curso: '2° Básico A', correo_profesor: 'carmen.silva@colegio.cl' },
    { nombre: 'Ciencias Naturales',   curso: '2° Básico A', correo_profesor: 'patricia.soto@colegio.cl' },
    // 1° Medio A
    { nombre: 'Matemáticas',          curso: '1° Medio A', correo_profesor: 'ana.martinez@colegio.cl' },
    { nombre: 'Lenguaje y Comunicación', curso: '1° Medio A', correo_profesor: 'carmen.silva@colegio.cl' },
    { nombre: 'Historia y Geografía', curso: '1° Medio A', correo_profesor: 'jorge.munoz@colegio.cl' },
    { nombre: 'Biología',             curso: '1° Medio A', correo_profesor: 'patricia.soto@colegio.cl' },
    { nombre: 'Física',               curso: '1° Medio A', correo_profesor: 'luis.rojas@colegio.cl' },
    { nombre: 'Inglés',               curso: '1° Medio A', correo_profesor: 'valentina.torres@colegio.cl' },
    { nombre: 'Educación Física',     curso: '1° Medio A', correo_profesor: 'andres.castro@colegio.cl' },
  ];

  const sheets = { Cursos: cursos, Profesores: profesores, Alumnos: alumnos, Asignaturas: asignaturas };

  for (const [sheetName, data] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sheetName);
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=plantilla_edusync.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

module.exports = { importarDatos, descargarPlantilla };
