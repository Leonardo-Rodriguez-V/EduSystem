require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  const { rows: cursos } = await pool.query(`
    SELECT c.id, c.nombre, c.id_profesor_jefe, u.correo as jefe_correo
    FROM cursos c
    LEFT JOIN usuarios u ON c.id_profesor_jefe = u.id
    ORDER BY c.nombre
  `);
  console.table(cursos);
  process.exit(0);
}

check();
