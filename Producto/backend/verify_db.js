require('dotenv').config();
const pool = require('./src/config/db');

async function verify() {
  try {
    const courses = await pool.query('SELECT COUNT(*) FROM cursos');
    console.log('Total Cursos:', courses.rows[0].count);

    const schedules = await pool.query('SELECT COUNT(*) FROM horario');
    console.log('Total Bloques de Horario:', schedules.rows[0].count);

    const teachers = await pool.query(`
      SELECT u.nombre_completo, u.correo, COUNT(h.id_curso) as total_bloques
      FROM horario h
      JOIN usuarios u ON h.id_profesor = u.id
      GROUP BY u.nombre_completo, u.correo
      ORDER BY COUNT(h.id_curso) DESC
      LIMIT 10
    `);
    console.log('\nTop Carga Horaria (Máximo 23):');
    console.table(teachers.rows);

    const conflicts = await pool.query(`
      SELECT h.id_profesor, h.dia_semana, h.hora_inicio, COUNT(*) as solapamientos
      FROM horario h
      WHERE h.id_profesor IS NOT NULL
      GROUP BY h.id_profesor, h.dia_semana, h.hora_inicio
      HAVING COUNT(*) > 1
    `);
    console.log('\nConflictos de horario (profesores en 2 lugares a la vez):', conflicts.rows.length);

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

verify();
