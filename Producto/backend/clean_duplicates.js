require('dotenv').config();
const pool = require('./src/config/db');

async function clean() {
  const res = await pool.query(`
    DELETE FROM curso_asignatura_profesor 
    WHERE id NOT IN (
      SELECT MIN(id) 
      FROM curso_asignatura_profesor 
      GROUP BY id_curso, id_asignatura, id_profesor
    )
  `);
  console.log(`✅ Duplicados eliminados: ${res.rowCount}`);
  process.exit(0);
}

clean();
