require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  const cursosInHorario = await pool.query('SELECT COUNT(DISTINCT id_curso) FROM horario');
  console.log('Cursos en Horario:', cursosInHorario.rows[0].count);

  const cursosInAsignaciones = await pool.query('SELECT COUNT(DISTINCT id_curso) FROM curso_asignatura_profesor');
  console.log('Cursos con Asignaciones:', cursosInAsignaciones.rows[0].count);

  const details = await pool.query(`
    SELECT c.nombre, COUNT(h.id) as blocks
    FROM cursos c
    LEFT JOIN horario h ON h.id_curso = c.id
    GROUP BY c.nombre
    ORDER BY blocks ASC, c.nombre ASC
    LIMIT 10
  `);
  console.log('Cursos con menos bloques en horario:');
  console.table(details.rows);

  process.exit(0);
}

check();
