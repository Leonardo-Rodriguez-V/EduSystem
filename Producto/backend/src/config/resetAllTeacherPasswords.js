require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function reset() {
  const passwordGlobal = 'Profesor2024!';
  console.log(`🔐 Generando hash para: ${passwordGlobal}...`);
  const hash = await bcrypt.hash(passwordGlobal, 10);

  const res = await pool.query(
    "UPDATE usuarios SET contraseña = $1 WHERE rol = 'profesor' RETURNING correo",
    [hash]
  );

  console.log(`✅ Contraseña reseteada para ${res.rowCount} profesores.`);
  console.log('Ejemplo login:', res.rows[0].correo);
  process.exit(0);
}

reset().catch(err => {
    console.error('❌ Error resetting passwords:', err);
    process.exit(1);
});
