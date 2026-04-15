require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function checkConflicts() {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        u.nombre_completo as profesor,
        h.dia_semana,
        h.hora_inicio,
        COUNT(*) as colisiones,
        ARRAY_AGG(c.nombre) as cursos,
        ARRAY_AGG(a.nombre) as asignaturas
      FROM horario h
      JOIN usuarios u ON h.id_profesor = u.id
      JOIN cursos c ON h.id_curso = c.id
      JOIN asignaturas a ON h.id_asignatura = a.id
      GROUP BY u.nombre_completo, h.dia_semana, h.hora_inicio
      HAVING COUNT(*) > 1
      ORDER BY h.dia_semana, h.hora_inicio;
    `;

    const { rows } = await client.query(query);

    if (rows.length === 0) {
      console.log('\n✅ ¡PERFECTO! No se detectaron conflictos de profesores.');
      console.log('Todos los docentes están en una sola sala a la vez.\n');
    } else {
      console.error('\n❌ SE DETECTARON CONFLICTOS:');
      rows.forEach(r => {
        console.error(`- PROFESOR: ${r.profesor}`);
        console.error(`  DÍA: ${r.dia_semana} | HORA: ${r.hora_inicio}`);
        console.error(`  CURSOS EN CONFLICTO: ${r.cursos.join(', ')}`);
        console.error(`  ASIGNATURAS: ${r.asignaturas.join(', ')}`);
        console.error('');
      });
    }
  } catch (e) {
    console.error('❌ Error en validación:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

checkConflicts();
