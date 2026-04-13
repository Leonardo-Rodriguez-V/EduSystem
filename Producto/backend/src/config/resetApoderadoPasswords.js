require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function reset() {
  const nueva = 'Apoderado2024!';
  const hash  = await bcrypt.hash(nueva, 10);

  const res = await pool.query(
    "UPDATE usuarios SET contraseña = $1 WHERE rol = 'apoderado' RETURNING correo",
    [hash]
  );

  console.log(`✅ Contraseña reseteada para ${res.rowCount} apoderado(s).`);
  res.rows.forEach(r => console.log('  -', r.correo));
  console.log(`\n🔑 Nueva contraseña: ${nueva}`);
  process.exit(0);
}

reset().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
