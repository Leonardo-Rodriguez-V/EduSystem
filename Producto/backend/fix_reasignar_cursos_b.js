/**
 * fix_reasignar_cursos_b.js
 * Mueve todos los cursos B asignados al profesor "A" al profesor "(B)" correspondiente.
 * Ejecutar en Railway: node fix_reasignar_cursos_b.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Vista previa: ¿cuántos registros están mal asignados?
    const { rows: preview } = await client.query(`
      SELECT
        prof_a.nombre_completo AS profesor_actual,
        prof_b.nombre_completo AS deberia_ser,
        c.nombre AS curso,
        a.nombre AS asignatura
      FROM curso_asignatura_profesor cap
      JOIN usuarios prof_a ON prof_a.id = cap.id_profesor
      JOIN usuarios prof_b ON prof_b.nombre_completo = prof_a.nombre_completo || ' (B)'
        AND prof_b.colegio_id = prof_a.colegio_id
      JOIN cursos c ON c.id = cap.id_curso
      JOIN asignaturas a ON a.id = cap.id_asignatura
      WHERE prof_a.nombre_completo NOT LIKE '% (B)'
        AND c.nombre LIKE '% B'
      ORDER BY prof_a.nombre_completo, c.nombre
    `);

    console.log(`\n=== REGISTROS MAL ASIGNADOS: ${preview.length} ===`);
    preview.forEach(r =>
      console.log(`  ${r.profesor_actual} → ${r.deberia_ser} | ${r.curso} - ${r.asignatura}`)
    );

    if (preview.length === 0) {
      console.log('Nada que reasignar.');
      await client.query('ROLLBACK');
      return;
    }

    // 2. Eliminar registros duplicados que ya existen en el prof (B)
    const { rowCount: borrados } = await client.query(`
      DELETE FROM curso_asignatura_profesor cap_destino
      USING curso_asignatura_profesor cap_origen
      JOIN usuarios prof_a ON prof_a.id = cap_origen.id_profesor
      JOIN usuarios prof_b ON prof_b.nombre_completo = prof_a.nombre_completo || ' (B)'
        AND prof_b.colegio_id = prof_a.colegio_id
      JOIN cursos c ON c.id = cap_origen.id_curso
      WHERE cap_destino.id_profesor = prof_b.id
        AND cap_destino.id_curso = cap_origen.id_curso
        AND cap_destino.id_asignatura = cap_origen.id_asignatura
        AND prof_a.nombre_completo NOT LIKE '% (B)'
        AND c.nombre LIKE '% B'
    `);
    console.log(`\nDuplicados eliminados del prof (B): ${borrados}`);

    // 3. Reasignar los cursos B al profesor (B)
    const { rowCount: actualizados } = await client.query(`
      UPDATE curso_asignatura_profesor cap
      SET id_profesor = prof_b.id
      FROM usuarios prof_a
      JOIN usuarios prof_b ON prof_b.nombre_completo = prof_a.nombre_completo || ' (B)'
        AND prof_b.colegio_id = prof_a.colegio_id
      JOIN cursos c ON c.id = cap.id_curso
      WHERE cap.id_profesor = prof_a.id
        AND prof_a.nombre_completo NOT LIKE '% (B)'
        AND c.nombre LIKE '% B'
    `);
    console.log(`Registros reasignados: ${actualizados}`);

    // 4. Verificación final
    const { rows: verificacion } = await client.query(`
      SELECT u.nombre_completo, COUNT(DISTINCT cap.id_curso) AS cursos_asignados
      FROM usuarios u
      LEFT JOIN curso_asignatura_profesor cap ON cap.id_profesor = u.id
      WHERE u.rol = 'profesor'
      GROUP BY u.id, u.nombre_completo
      ORDER BY u.nombre_completo
      LIMIT 20
    `);
    console.log('\n=== VERIFICACIÓN (primeros 20 profesores) ===');
    verificacion.forEach(r =>
      console.log(`  ${r.nombre_completo}: ${r.cursos_asignados} cursos`)
    );

    await client.query('COMMIT');
    console.log('\n✓ Reasignación completada correctamente.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
