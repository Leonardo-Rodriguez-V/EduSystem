require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function check() {
  const { rows } = await pool.query(
    "SELECT rol, COUNT(*) as total FROM usuarios GROUP BY rol ORDER BY rol"
  );
  console.log('\n📊 Usuarios por rol:');
  rows.forEach(r => console.log(`   ${r.rol}: ${r.total}`));

  const { rows: ejemplo } = await pool.query(
    "SELECT correo, rol FROM usuarios WHERE rol = 'apoderado' LIMIT 3"
  );
  if (ejemplo.length > 0) {
    console.log('\n📧 Ejemplo apoderados:');
    ejemplo.forEach(r => console.log(`   ${r.correo}`));
  } else {
    console.log('\n⚠️  No hay apoderados en la base de datos.');
  }
  process.exit(0);
}

check().catch(err => { console.error('❌', err.message); process.exit(1); });
