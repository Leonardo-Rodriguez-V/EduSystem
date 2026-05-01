require('dotenv').config();
const pool = require('./src/config/db');

async function fix() {
  console.log('🔧 Corrigiendo asignaciones de Jefes en Track B...');
  const res = await pool.query(`
    UPDATE curso_asignatura_profesor cap
    SET id_profesor = cB.id_profesor_jefe
    FROM cursos cB
    JOIN cursos cA ON cB.nombre = REPLACE(cA.nombre, ' A', ' B')
    WHERE cap.id_curso = cB.id
    AND cap.id_profesor = cA.id_profesor_jefe
    AND cB.nombre LIKE '% B'
    AND cA.nombre LIKE '% A'
  `);
  console.log(`✅ Asignaciones corregidas: ${res.rowCount}`);
  process.exit(0);
}

fix();
