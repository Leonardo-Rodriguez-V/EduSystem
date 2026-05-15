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
    const mapCursos = {}; // nombre -> id
    for (const row of filaCursos) {
      const nombre = String(row.nombre || '').trim();
      const anio   = parseInt(row.anio) || new Date().getFullYear();
      if (!nombre) continue;
      try {
        const { rows: [cur] } = await client.query(
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
    const mapProfesores = {}; // correo -> id
    for (const row of filaProfesores) {
      const nombre   = String(row.nombre_completo || '').trim();
      const correo   = String(row.correo || '').trim().toLowerCase();
      const pass     = String(row.contraseña || row.contrasena || '').trim();
      if (!nombre || !correo || !pass) continue;
      try {
        const hash = await bcrypt.hash(pass, 10);
        const { rows: [prof] } = await client.query(
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
      const fnac   = row.fecha_nacimiento ? new Date(row.fecha_nacimiento) : null;
      if (!nombre) continue;
      const id_curso = mapCursos[curso] || null;
      try {
        await client.query(
          `INSERT INTO alumnos (nombre_completo, rut, fecha_nacimiento, id_curso, colegio_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (rut) DO NOTHING`,
          [nombre, rut || null, fnac, id_curso, colegio_id]
        );
        resumen.alumnos++;
      } catch (e) { resumen.errores.push(`Alumno "${nombre}": ${e.message}`); }
    }

    // ── 4. ASIGNATURAS + ASIGNACIONES ──────────────────
    const mapAsignaturas = {}; // nombre -> id
    for (const row of filaAsignaturas) {
      const nombre        = String(row.nombre || '').trim();
      const cursoNombre   = String(row.curso || '').trim();
      const correoPrf     = String(row.correo_profesor || '').trim().toLowerCase();
      if (!nombre) continue;
      try {
        // Crear asignatura si no existe
        if (!mapAsignaturas[nombre]) {
          const { rows: [asig] } = await client.query(
            `INSERT INTO asignaturas (nombre)
             VALUES ($1)
             ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
             RETURNING id`,
            [nombre]
          );
          mapAsignaturas[nombre] = asig.id;
          resumen.asignaturas++;
        }
        // Crear asignación curso-asignatura-profesor si hay datos
        const id_curso    = mapCursos[cursoNombre] || null;
        const id_profesor = mapProfesores[correoPrf] || null;
        if (id_curso && mapAsignaturas[nombre]) {
          await client.query(
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
 * Descarga un Excel de ejemplo con las hojas listas para llenar
 */
const descargarPlantilla = (req, res) => {
  const wb = XLSX.utils.book_new();

  const sheets = {
    Cursos: [
      { nombre: '1° Básico A', anio: 2026 },
      { nombre: '2° Básico B', anio: 2026 },
    ],
    Profesores: [
      { nombre_completo: 'Ana Martínez', correo: 'ana@colegio.cl', contraseña: 'Pass1234' },
      { nombre_completo: 'Luis Rojas', correo: 'luis@colegio.cl', contraseña: 'Pass1234' },
    ],
    Alumnos: [
      { nombre_completo: 'Carlos Pérez', rut: '19.000.001-1', fecha_nacimiento: '15/03/2015', curso: '1° Básico A' },
      { nombre_completo: 'María López', rut: '19.000.002-2', fecha_nacimiento: '22/07/2015', curso: '1° Básico A' },
    ],
    Asignaturas: [
      { nombre: 'Matemáticas', curso: '1° Básico A', correo_profesor: 'ana@colegio.cl' },
      { nombre: 'Lenguaje',    curso: '1° Básico A', correo_profesor: 'luis@colegio.cl' },
    ],
  };

  for (const [sheetName, data] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sheetName);
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=plantilla_edusync.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

module.exports = { importarDatos, descargarPlantilla };
