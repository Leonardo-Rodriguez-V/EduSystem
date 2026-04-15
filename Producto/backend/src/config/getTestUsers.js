require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function main() {
  // Profesor que hace clases en Media (1° a 4° Medio)
  const { rows: profs } = await pool.query(`
    SELECT u.nombre_completo, u.correo, COUNT(DISTINCT cap.id_curso) as cursos,
           STRING_AGG(DISTINCT c.nombre, ', ' ORDER BY c.nombre) as nombres_cursos
    FROM usuarios u
    JOIN curso_asignatura_profesor cap ON u.id = cap.id_profesor
    JOIN cursos c ON cap.id_curso = c.id
    WHERE c.nombre ILIKE '%medio%'
    GROUP BY u.id, u.nombre_completo, u.correo
    ORDER BY cursos DESC
    LIMIT 1
  `);

  // Apoderado de un alumno de 2° Medio
  const { rows: apods } = await pool.query(`
    SELECT u.nombre_completo, u.correo, a.nombre_completo as hijo, c.nombre as curso
    FROM usuarios u
    JOIN apoderado_alumno aa ON u.id = aa.id_apoderado
    JOIN alumnos a ON aa.id_alumno = a.id
    JOIN cursos c ON a.id_curso = c.id
    WHERE c.nombre ILIKE '%2%medio%'
    LIMIT 1
  `);

  if (profs.length > 0) {
    console.log('\n👨‍🏫 PROFESOR DE MEDIA:');
    console.log(`   Nombre  : ${profs[0].nombre_completo}`);
    console.log(`   Correo  : ${profs[0].correo}`);
    console.log(`   Clave   : Profesor123`);
    console.log(`   Cursos  : ${profs[0].nombres_cursos}`);
  }

  if (apods.length > 0) {
    console.log('\n👤 APODERADO DE 2° MEDIO:');
    console.log(`   Nombre  : ${apods[0].nombre_completo}`);
    console.log(`   Correo  : ${apods[0].correo}`);
    console.log(`   Clave   : Apoderado123`);
    console.log(`   Hijo    : ${apods[0].hijo} (${apods[0].curso})`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
