require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function main() {
  const { rows } = await pool.query(`
    SELECT u.nombre_completo, u.correo, COUNT(aa.id_alumno) as hijos
    FROM usuarios u
    JOIN apoderado_alumno aa ON u.id = aa.id_apoderado
    WHERE u.rol = 'apoderado'
    GROUP BY u.id, u.nombre_completo, u.correo
    HAVING COUNT(aa.id_alumno) = 3
    LIMIT 1
  `);

  if (rows.length === 0) { console.log('No encontrado'); process.exit(0); }
  const p = rows[0];
  console.log(`\n👤 Nombre : ${p.nombre_completo}`);
  console.log(`📧 Correo : ${p.correo}`);
  console.log(`🔑 Clave  : Apoderado123`);
  console.log(`👨‍👧‍👦 Hijos  : ${p.hijos}`);
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
