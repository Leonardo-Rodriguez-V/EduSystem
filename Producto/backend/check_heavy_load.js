require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  const { rows } = await pool.query(`
    SELECT c.nombre as curso, a.nombre as asignatura, u.nombre_completo as profesor, u.correo
    FROM curso_asignatura_profesor cap
    JOIN cursos c ON cap.id_curso = c.id
    JOIN asignaturas a ON cap.id_asignatura = a.id
    JOIN usuarios u ON cap.id_profesor = u.id
    WHERE u.correo IN ('claudia.morales@edusync.cl', 'patricia.vega@edusync.cl', 'ana@edusync.com', 'pablo.silva@edusync.cl')
    ORDER BY u.correo, c.nombre, a.nombre
  `);

  console.table(rows);
  process.exit(0);
}

check();
