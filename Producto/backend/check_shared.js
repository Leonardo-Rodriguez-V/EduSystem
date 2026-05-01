require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  const { rows } = await pool.query(`
    SELECT c.nombre as curso, a.nombre as asig, u.correo
    FROM curso_asignatura_profesor cap
    JOIN cursos c ON cap.id_curso = c.id
    JOIN asignaturas a ON cap.id_asignatura = a.id
    JOIN usuarios u ON cap.id_profesor = u.id
    WHERE c.nombre LIKE '% B'
    AND u.correo NOT LIKE '%.b@edusync.cl'
    AND u.id NOT IN (SELECT id_profesor_jefe FROM cursos WHERE nombre LIKE '% B')
  `);
  console.table(rows);
  process.exit(0);
}

check();
